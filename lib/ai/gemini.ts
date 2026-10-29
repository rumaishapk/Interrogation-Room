import "server-only";
import { ApiError, GoogleGenAI } from "@google/genai";

// The one place the model is chosen. Change it here (or set GEMINI_MODEL in .env.local).
// A pinned stable model, not a "-latest" alias, so results don't change without us knowing.
export const GEMINI_MODEL = process.env.GEMINI_MODEL ?? "gemini-3.5-flash";

// 500 = Gemini had an internal error, 503 = Gemini is overloaded ("high demand").
// Both usually pass within seconds, so they're worth retrying.
export function isTemporaryGeminiError(err: unknown): err is ApiError {
  return err instanceof ApiError && (err.status === 500 || err.status === 503);
}

// A message a person can understand, for any error thrown by a Gemini call.
export function geminiErrorMessage(err: unknown): string {
  if (err instanceof ApiError && err.status === 429) {
    return "Gemini rate limit reached. Wait a minute and try again.";
  }
  if (isTemporaryGeminiError(err)) {
    return "Gemini is busy right now (high demand). Please try again in a few minutes.";
  }
  return "The AI service failed. Please try again later.";
}

let client: GoogleGenAI | undefined;

// Created on first use, so a missing key only breaks AI features, not the whole app.
export function getGemini(): GoogleGenAI {
  if (!client) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not set. Add it to .env.local and restart the server.");
    }
    client = new GoogleGenAI({ apiKey });
  }
  return client;
}
