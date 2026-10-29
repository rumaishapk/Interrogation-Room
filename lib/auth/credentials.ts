// Username and password rules, shared by signup and login.
// No server-only imports, so they can be unit-tested.
import { z } from "zod";
import { MAX_PASSWORD_LENGTH } from "./password.ts"; // .ts so Node can run the unit tests directly

// Matches the CHECK constraint on users.username in migration 002.
export const usernameSchema = z
  .string()
  .trim()
  .regex(/^[A-Za-z0-9_]{3,20}$/, "Username must be 3–20 letters, numbers or underscores.");

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters.")
  .max(MAX_PASSWORD_LENGTH, `Password must be at most ${MAX_PASSWORD_LENGTH} characters.`);

export const signupSchema = z.object({ username: usernameSchema, password: passwordSchema });
