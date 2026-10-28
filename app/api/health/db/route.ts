import { connection } from "next/server";
import { pool } from "@/lib/db/pool";

// GET /api/health/db — confirms the app can reach PostgreSQL.
export async function GET() {
  // Wait for a real request: never run this query during `next build`.
  await connection();

  try {
    const { rows } = await pool.query<{ database: string; server_time: Date }>(
      "SELECT current_database() AS database, now() AS server_time"
    );
    return Response.json({ ok: true, ...rows[0] });
  } catch (err) {
    // Log the details on the server, but don't send them to the browser.
    console.error("Database health check failed:", err);
    return Response.json({ ok: false, error: "Could not connect to the database." }, { status: 503 });
  }
}
