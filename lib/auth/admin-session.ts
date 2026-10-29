import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { pool } from "@/lib/db/pool";
import { hashSessionToken, newSessionToken } from "./session-token";

// The name proxy.ts looks for. Keep the two in sync.
export const ADMIN_COOKIE = "admin_session";
const SESSION_HOURS = 8; // shorter than players: admin sessions can do more damage if stolen

export type Admin = { id: string; username: string };

export async function startAdminSession(adminId: string) {
  const token = newSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_HOURS * 60 * 60 * 1000);

  await pool.query("DELETE FROM admin_sessions WHERE admin_id = $1 AND expires_at < now()", [adminId]);
  await pool.query("INSERT INTO admin_sessions (id, admin_id, expires_at) VALUES ($1, $2, $3)", [
    hashSessionToken(token),
    adminId,
    expiresAt,
  ]);

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE, token, {
    httpOnly: true, // browser JavaScript can't read it
    secure: process.env.NODE_ENV === "production", // HTTPS only once deployed
    sameSite: "strict", // never sent on requests started by other websites
    path: "/",
    expires: expiresAt,
  });
}

export async function endAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE)?.value;
  if (token) {
    // Delete the row too, so a copied token stops working.
    await pool.query("DELETE FROM admin_sessions WHERE id = $1", [hashSessionToken(token)]);
  }
  cookieStore.delete(ADMIN_COOKIE);
}

// The logged-in admin, or null. One query per request, thanks to cache().
export const getCurrentAdmin = cache(async (): Promise<Admin | null> => {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE)?.value;
  if (!token) return null;

  const { rows } = await pool.query<Admin>(
    `SELECT a.id, a.username
     FROM admin_sessions s JOIN admins a ON a.id = s.admin_id
     WHERE s.id = $1 AND s.expires_at > now()`,
    [hashSessionToken(token)]
  );
  return rows[0] ?? null;
});

export async function isAdmin(): Promise<boolean> {
  return (await getCurrentAdmin()) !== null;
}

// For admin pages: send visitors who aren't logged in to the login page.
export async function requireAdminPage() {
  if (!(await isAdmin())) redirect("/admin/login");
}
