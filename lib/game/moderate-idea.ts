import "server-only";
import { getGemini, GEMINI_MODEL, isTemporaryGeminiError } from "@/lib/ai/gemini";
import { toGeminiSchema } from "@/lib/ai/gemini-schema";
import { withRetry } from "@/lib/ai/retry";
import {
  MODERATION_INSTRUCTION,
  parseVerdict,
  storyIdeaBlock,
  verdictSchema,
  type IdeaVerdict,
} from "./player-idea";

// A small, cheap call made BEFORE the expensive case generation.
export async function checkIdea(idea: string): Promise<IdeaVerdict> {
  const response = await withRetry(
    () =>
      getGemini().models.generateContent({
        model: GEMINI_MODEL,
        contents: storyIdeaBlock(idea),
        config: {
          systemInstruction: MODERATION_INSTRUCTION,
          responseMimeType: "application/json",
          responseJsonSchema: toGeminiSchema(verdictSchema),
          temperature: 0, // the same idea should always get the same answer
          httpOptions: { timeout: 30_000 },
        },
      }),
    { isTemporary: isTemporaryGeminiError, delaysMs: [3_000, 8_000] }
  );
  return parseVerdict(response.text);
}
