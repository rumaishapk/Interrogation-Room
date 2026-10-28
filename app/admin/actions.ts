"use server";
// Server Actions: functions the browser can call by submitting a form.
// They always run on the server, so the password check never happens in the browser.

import { redirect } from "next/navigation";
import { isAdminLoginConfigured, passwordMatches } from "@/lib/auth/admin-token";
import { endAdminSession, startAdminSession } from "@/lib/auth/admin-session";

export type LoginState = { error?: string };

export async function login(_previous: LoginState, formData: FormData): Promise<LoginState> {
  const password = formData.get("password");
  if (typeof password !== "string" || password.length === 0) {
    return { error: "Enter the admin password." };
  }
  if (!isAdminLoginConfigured()) {
    return {
      error: "Admin login isn't set up. Add ADMIN_PASSWORD and ADMIN_SESSION_SECRET to .env.local and restart.",
    };
  }
  if (!passwordMatches(password)) {
    // A short pause makes guessing many passwords slow.
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return { error: "Incorrect password." };
  }

  await startAdminSession();
  redirect("/admin");
}

export async function logout() {
  await endAdminSession();
  redirect("/admin/login");
}
