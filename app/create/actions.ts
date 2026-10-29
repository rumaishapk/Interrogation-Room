"use server";

import { redirect } from "next/navigation";
import { getCurrentPlayer } from "@/lib/auth/player-session";
import { geminiErrorMessage } from "@/lib/ai/gemini";
import { generateCase } from "@/lib/game/generate-case";
import { checkIdea } from "@/lib/game/moderate-idea";
import { MAX_IDEA_LENGTH, normalizeIdea } from "@/lib/game/player-idea";
import { limitMessage } from "@/lib/game/generation-limits";
import { finishAttempt, getLimits, getUsage, savePlayerCase, startAttempt } from "@/lib/game/player-cases";

export type CreateCaseState = { error?: string; idea?: string };

const MIN_IDEA_LENGTH = 10;

export async function createCase(_previous: CreateCaseState, formData: FormData): Promise<CreateCaseState> {
  const idea = normalizeIdea(String(formData.get("idea") ?? ""));

  // 1. Who is asking? The page hides the form from guests, but a Server Action
  //    can be called directly, so it must check for itself.
  const player = await getCurrentPlayer();
  if (!player) return { error: "Please log in to create a case.", idea };

  // 2. Is the idea usable?
  if (idea.length < MIN_IDEA_LENGTH || idea.length > MAX_IDEA_LENGTH) {
    return { error: `Describe your idea in ${MIN_IDEA_LENGTH}–${MAX_IDEA_LENGTH} characters.`, idea };
  }

  let caseId: string;
  let attemptId: number | undefined;
  try {
    // 3. Under the daily limits?
    const blocked = limitMessage(await getUsage(player.id), getLimits());
    if (blocked) return { error: blocked, idea };

    // 4. Only one generation at a time per player.
    const attempt = await startAttempt(player.id);
    if (attempt === "busy") {
      return { error: "You already have a case being generated. Please wait for it to finish.", idea };
    }
    attemptId = attempt;

    // 5. The cheap safety check, before the expensive generation.
    const verdict = await checkIdea(idea);
    if (!verdict.allowed) {
      await finishAttempt(attemptId, "rejected_idea");
      return { error: verdict.reason, idea };
    }

    // 6. Generate and validate (repairs once if needed).
    const result = await generateCase("medium", { idea });
    if (!result.ok) {
      console.error("Player case failed validation:", result.errors);
      await finishAttempt(attemptId, "failed");
      return { error: "The AI couldn't build a fair mystery from that idea. Try describing it differently.", idea };
    }

    // 7. Save as published, credited to the player.
    await savePlayerCase(result.caseDef, player.id, idea);
    await finishAttempt(attemptId, "succeeded", result.caseDef.id);
    caseId = result.caseDef.id;
  } catch (err) {
    console.error("Player case generation failed:", err);
    // Free the "one at a time" lock so the player can try again.
    if (attemptId !== undefined) await finishAttempt(attemptId, "failed").catch(() => {});
    return { error: geminiErrorMessage(err), idea };
  }

  // redirect() throws a special signal, so it stays outside try/catch.
  redirect(`/game/${caseId}`);
}
