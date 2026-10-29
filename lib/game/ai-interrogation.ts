import "server-only";
import { ThinkingLevel, type Content } from "@google/genai";
import { getGemini, GEMINI_MODEL, isTemporaryGeminiError } from "@/lib/ai/gemini";
import { withRetry } from "@/lib/ai/retry";
import { toPublicCase } from "./case-store";
import { getSuspectReply } from "./interrogation";
import { buildSuspectInstruction, cleanReply, detectiveTurn, unsafeReplyReason } from "./suspect-prompt";
import type { CaseDefinition, ChatMessage } from "./types";

export type SuspectAnswer = { reply: string; source: "ai" | "fallback" };

// Asks Gemini to answer as the suspect. If anything goes wrong (Gemini busy,
// a timeout, or a reply that fails the safety net) the old keyword reply is used,
// so the game always answers.
export async function askSuspect(
  caseDef: CaseDefinition,
  suspectId: string,
  history: ChatMessage[],
  question: string
): Promise<SuspectAnswer | null> {
  const knowledge = caseDef.knowledge.find((k) => k.suspectId === suspectId);
  const suspect = caseDef.suspects.find((s) => s.id === suspectId);
  if (!knowledge || !suspect) return null;

  const fallback = (): SuspectAnswer => ({
    reply: getSuspectReply(caseDef, suspectId, question) ?? knowledge.fallbackReply,
    source: "fallback",
  });

  // Only the public case and THIS suspect's knowledge go into the prompt.
  const systemInstruction = buildSuspectInstruction(toPublicCase(caseDef), knowledge);
  const contents: Content[] = [
    ...history.map((m) => ({
      role: m.role === "detective" ? "user" : "model",
      parts: [{ text: m.role === "detective" ? detectiveTurn(m.content) : m.content }],
    })),
    { role: "user", parts: [{ text: detectiveTurn(question) }] },
  ];

  const callGemini = () =>
    withRetry(
      () =>
        getGemini().models.generateContent({
          model: GEMINI_MODEL,
          contents,
          config: {
            systemInstruction,
            temperature: 0.9, // some variety, so answers don't feel scripted
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }, // a chat needs quick replies
            httpOptions: { timeout: 25_000 },
          },
        }),
      { isTemporary: isTemporaryGeminiError, delaysMs: [1_000, 3_000] }
    );

  try {
    let response = await callGemini();
    if (!response.text) {
      // Gemini says why it gave no text, e.g. MALFORMED_RESPONSE (a glitch) or SAFETY (its filter).
      console.warn(
        `Empty AI reply for ${suspectId}: finishReason=${response.candidates?.[0]?.finishReason}, ` +
          `blockReason=${response.promptFeedback?.blockReason ?? "none"}. Trying once more.`
      );
      // Glitches are usually one-offs, so one more try is worth a small extra request.
      response = await callGemini();
    }
    const reply = cleanReply(response.text ?? "", suspect.name);
    // The engine, not the model, knows who the murderer is.
    const problem = unsafeReplyReason(reply, {
      secrets: knowledge.secrets,
      isMurderer: suspectId === caseDef.truth.murdererId,
    });
    if (problem) {
      console.warn(`AI reply for ${suspectId} blocked (${problem}); using fallback.`);
      return fallback();
    }
    return { reply, source: "ai" };
  } catch (err) {
    console.error("AI interrogation failed; using fallback:", err);
    return fallback();
  }
}
