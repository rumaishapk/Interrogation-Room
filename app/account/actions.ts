"use server";
// Server Actions for player accounts. They run only on the server.

import { redirect } from "next/navigation";
import { signupSchema } from "@/lib/auth/credentials";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { createUser, findUserByUsername } from "@/lib/auth/users";
import { endPlayerSession, startPlayerSession } from "@/lib/auth/player-session";

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
  redirect("/cases");
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
    dummyHash ??= hashPassword("dummy-password-for-timing");
    const passwordOk = await verifyPassword(password, user?.passwordHash ?? (await dummyHash));
    if (!user || !passwordOk) return { error: LOGIN_FAILED, username };

    await startPlayerSession(user.id);
  } catch (err) {
    console.error("Login failed:", err);
    return { error: SOMETHING_WRONG, username };
  }
  redirect("/cases");
}

export async function logout() {
  await endPlayerSession();
  redirect("/");
}
