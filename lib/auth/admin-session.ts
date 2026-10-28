import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE, SESSION_HOURS, createAdminToken, verifyAdminToken } from "./admin-token";

export async function startAdminSession() {
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE, createAdminToken(), {
    httpOnly: true, // browser JavaScript can't read it, so injected scripts can't steal it
    secure: process.env.NODE_ENV === "production", // HTTPS only once deployed
    sameSite: "strict", // never sent on requests started by other websites
    path: "/",
    maxAge: SESSION_HOURS * 60 * 60, // seconds
  });
}

export async function endAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE);
}

export async function isAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  return verifyAdminToken(cookieStore.get(ADMIN_COOKIE)?.value);
}

// For admin pages: send visitors who aren't logged in to the login page.
export async function requireAdminPage() {
  if (!(await isAdmin())) redirect("/admin/login");
}
