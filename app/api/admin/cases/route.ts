import { z } from "zod";
import { ApiError } from "@google/genai";
import { pool } from "@/lib/db/pool";
import { insertCase } from "@/lib/db/insert-case";
import { generateCase } from "@/lib/game/generate-case";
import { checkIdea } from "@/lib/game/moderate-idea";
import { MAX_IDEA_LENGTH, normalizeIdea } from "@/lib/game/player-idea";
import { isTemporaryGeminiError } from "@/lib/ai/gemini";
import { isAdmin } from "@/lib/auth/admin-session";

// POST /api/admin/cases  { "difficulty": "easy" | "medium" | "hard", "idea"?: string }
// Generates a case with Gemini and saves it as a draft (players can't see drafts).
// Admin only: every call costs API quota.

const bodySchema = z.object({
  difficulty: z.enum(["easy", "medium", "hard"]),
  // Normalised first, then checked, so the length limit applies to the cleaned text.
  idea: z
    .string()
    .transform(normalizeIdea)
    .pipe(z.string().max(MAX_IDEA_LENGTH))
    .optional(),
});

export async function POST(request: Request) {
  // Checked here as well as in proxy.ts, so this route is safe on its own.
  if (!(await isAdmin())) {
    return Response.json({ error: "Admin login required." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: `difficulty must be easy, medium or hard; idea at most ${MAX_IDEA_LENGTH} characters.` },
      { status: 400 }
    );
  }
  const idea = parsed.data.idea || undefined; // an empty idea means "no idea"

  let result;
  try {
    // Check the idea first: a cheap call that can save an expensive one.
    if (idea) {
      const verdict = await checkIdea(idea);
      if (!verdict.allowed) {
        return Response.json({ error: verdict.reason, rejectedIdea: true }, { status: 422 });
      }
    }
    result = await generateCase(parsed.data.difficulty, { idea });
  } catch (err) {
    console.error("Case generation failed:", err);
    if (err instanceof ApiError && err.status === 429) {
      return Response.json({ error: "Gemini rate limit reached. Wait a minute and try again." }, { status: 429 });
    }
    // Still busy after the automatic retries.
    if (isTemporaryGeminiError(err)) {
      return Response.json(
        { error: "Gemini is busy right now (high demand). Please try again in a few minutes." },
        { status: 503 }
      );
    }
    return Response.json({ error: "The AI service failed. Check the server logs." }, { status: 502 });
  }

  if (!result.ok) {
    // 422 = "I understood the request, but the result isn't acceptable".
    return Response.json(
      {
        error: "Gemini could not produce a valid case.",
        errors: result.errors,
        attempts: result.attempts,
        totalTokens: result.totalTokens,
      },
      { status: 422 }
    );
  }

  // Save inside a transaction: the whole case is stored, or none of it.
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await insertCase(client, result.caseDef, "draft");
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Saving generated case failed:", err);
    return Response.json({ error: "The case was generated but could not be saved." }, { status: 503 });
  } finally {
    client.release(); // always give the connection back to the pool
  }

  const { caseDef } = result;
  return Response.json(
    {
      id: caseDef.id,
      title: caseDef.title,
      difficulty: caseDef.difficulty,
      suspectCount: caseDef.suspects.length,
      attempts: result.attempts,
      totalTokens: result.totalTokens,
    },
    { status: 201 }
  );
}
