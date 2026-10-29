"use server";
// Server Actions: functions the browser can call by submitting a form.
// They always run on the server, so the password check never happens in the browser.

import { redirect } from "next/navigation";
import { pool } from "@/lib/db/pool";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { endAdminSession, startAdminSession } from "@/lib/auth/admin-session";

export type LoginState = { error?: string; username?: string };

const LOGIN_FAILED = "Incorrect username or password.";

// Used when the username doesn't exist, so both failures take the same time.
let dummyHash: Promise<string> | undefined;

export async function login(_previous: LoginState, formData: FormData): Promise<LoginState> {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!username || !password) return { error: LOGIN_FAILED, username };

  try {
    const { rows } = await pool.query<{ id: string; passwordHash: string }>(
      `SELECT id, password_hash AS "passwordHash" FROM admins WHERE lower(username) = lower($1)`,
      [username]
    );
    const admin = rows[0];
    dummyHash ??= hashPassword("dummy-password-for-timing");
    const passwordOk = await verifyPassword(password, admin?.passwordHash ?? (await dummyHash));

    if (!admin || !passwordOk) {
      // A short pause makes guessing many passwords slow.
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return { error: LOGIN_FAILED, username };
    }
    await startAdminSession(admin.id);
  } catch (err) {
    console.error("Admin login failed:", err);
    return { error: "Something went wrong. Please try again.", username };
  }
  // redirect() throws a special signal, so it stays outside try/catch.
  redirect("/admin");
}

export async function logout() {
  await endAdminSession();
  redirect("/admin/login");
}
