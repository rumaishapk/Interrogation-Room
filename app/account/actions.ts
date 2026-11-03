"use server";
// Server Actions for player accounts. They run only on the server.

import { randomBytes } from "node:crypto";
import { redirect } from "next/navigation";
import { signupSchema, usernameSchema } from "@/lib/auth/credentials";
import { completeGoogleSignup } from "@/lib/auth/google";
import { hashPassword, verifyLoginPassword } from "@/lib/auth/password";
import { createUser, findUserByUsername } from "@/lib/auth/users";
import { endPlayerSession, startPlayerSession } from "@/lib/auth/player-session";
import { safeNextPath } from "@/lib/auth/next-path";

export type AccountFormState = { error?: string; username?: string };

const LOGIN_FAILED = "Incorrect username or password.";
const SOMETHING_WRONG = "Something went wrong. Please try again.";

// A hash of a random password, used when the username doesn't exist (see login below).
let dummyHash: Promise<string> | undefined;

export async function signup(_previous: AccountFormState, formData: FormData): Promise<AccountFormState> {
  const username = String(formData.get("username") ?? "");
  const parsed = signupSchema.safeParse({ username, password: formData.get("password") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message, username };
  }

  let userId: string;
  try {
    const result = await createUser(parsed.data.username, parsed.data.password);
    if (result === "taken") return { error: "That username is already taken.", username };
    userId = result;
    await startPlayerSession(userId);
  } catch (err) {
    console.error("Signup failed:", err);
    return { error: SOMETHING_WRONG, username };
  }
  // redirect() works by throwing a special signal, so it must stay outside try/catch.
  // The hidden "next" field can be edited by anyone, so check it again here.
  redirect(safeNextPath(formData.get("next")));
}

export async function login(_previous: AccountFormState, formData: FormData): Promise<AccountFormState> {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!username || !password) return { error: LOGIN_FAILED, username };

  try {
    const user = await findUserByUsername(username);
    // If the username doesn't exist we still check a password against a dummy hash.
    // Otherwise "no such user" would answer faster than "wrong password", and an
    // attacker could time the replies to find out which usernames exist.
    // The dummy's password is random and thrown away, so nothing can match it.
    dummyHash ??= hashPassword(randomBytes(32).toString("hex"));
    const passwordOk = await verifyLoginPassword(password, user?.passwordHash, await dummyHash);
    if (!user || !passwordOk) return { error: LOGIN_FAILED, username };

    await startPlayerSession(user.id);
  } catch (err) {
    console.error("Login failed:", err);
    return { error: SOMETHING_WRONG, username };
  }
  // The hidden "next" field can be edited by anyone, so check it again here.
  redirect(safeNextPath(formData.get("next")));
}

// Second half of "Continue with Google" for first-time players: they pick a username.
export async function chooseGoogleUsername(_previous: AccountFormState, formData: FormData): Promise<AccountFormState> {
  const username = String(formData.get("username") ?? "");
  const parsed = usernameSchema.safeParse(username);
  if (!parsed.success) return { error: parsed.error.issues[0].message, username };

  let destination: string;
  try {
    const result = await completeGoogleSignup(parsed.data);
    if (result.status === "taken") return { error: "That username is already taken.", username };
    if (result.status === "expired") {
      destination = "/login?error=google_expired";
    } else {
      await startPlayerSession(result.userId);
      destination = safeNextPath(result.next);
    }
  } catch (err) {
    console.error("Google signup failed:", err);
    return { error: SOMETHING_WRONG, username };
  }
  redirect(destination);
}

export async function logout() {
  await endPlayerSession();
  redirect("/");
}
