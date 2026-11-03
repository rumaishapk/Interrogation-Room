import "server-only";
import {
  ApiError,
  GoogleGenAI,
  type GenerateContentParameters,
  type GenerateContentResponse,
} from "@google/genai";
import { createFailover } from "./key-failover";

// The one place the model is chosen. Change it here (or set GEMINI_MODEL in .env.local).
// A pinned stable model, not a "-latest" alias, so results don't change without us knowing.
export const GEMINI_MODEL = process.env.GEMINI_MODEL ?? "gemini-3.5-flash";

// 500 = Gemini had an internal error, 503 = Gemini is overloaded ("high demand").
// Both usually pass within seconds, so they're worth retrying.
export function isTemporaryGeminiError(err: unknown): err is ApiError {
  return err instanceof ApiError && (err.status === 500 || err.status === 503);
}

// 429 = this key's quota (per minute or per day) is used up. Another key may still work.
export function isQuotaError(err: unknown): err is ApiError {
  return err instanceof ApiError && err.status === 429;
}

// A message a person can understand, for any error thrown by a Gemini call.
export function geminiErrorMessage(err: unknown): string {
  if (isQuotaError(err)) {
    return "The AI has reached its usage limit for now. Please try again later.";
  }
  if (isTemporaryGeminiError(err)) {
    return "Gemini is busy right now (high demand). Please try again in a few minutes.";
  }
  return "The AI service failed. Please try again later.";
}

// After a key runs out, don't try it again for this long. One wasted request
// every half hour is cheap, and it notices when a quota resets.
const EXHAUSTED_KEY_COOLDOWN_MS = 30 * 60 * 1000;

let run: ReturnType<typeof createFailover<GoogleGenAI>> | undefined;

// Set up on first use, so missing keys only break AI features, not the whole app.
function failover() {
  if (!run) {
    // The main key first, then the backup. Empty ones are ignored.
    const keys = [process.env.GEMINI_API_KEY, process.env.GEMINI_API_KEY_BACKUP].filter(
      (key): key is string => Boolean(key)
    );
    if (keys.length === 0) {
      throw new Error("GEMINI_API_KEY is not set. Add it to .env.local and restart the server.");
    }
    const names = ["main", "backup"];
    run = createFailover(
      keys.map((apiKey) => new GoogleGenAI({ apiKey })),
      {
        isQuotaError,
        cooldownMs: EXHAUSTED_KEY_COOLDOWN_MS,
        // Logs which key, never the key itself.
        onSwitch: (from, to) => console.warn(`Gemini ${names[from]} key quota exhausted; switching to ${names[to]} key.`),
      }
    );
  }
  return run;
}

// Every AI feature calls Gemini through here, so all of them get the key switch-over.
export function generateContent(params: GenerateContentParameters): Promise<GenerateContentResponse> {
  return failover()((client) => client.models.generateContent(params));
}
