import "server-only";
import { pool } from "@/lib/db/pool";
import { hashPassword } from "./password";

export type UserRow = { id: string; username: string; passwordHash: string };

// Postgres error code for "a UNIQUE constraint was violated".
const UNIQUE_VIOLATION = "23505";

// Returns the new user's id, or "taken" if the username already exists.
export async function createUser(username: string, password: string): Promise<string | "taken"> {
  const passwordHash = await hashPassword(password);
  try {
    const { rows } = await pool.query<{ id: string }>(
      "INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id",
      [username, passwordHash]
    );
    return rows[0].id;
  } catch (err) {
    // Two people signing up with the same name at the same moment are caught here too,
    // because the database, not our code, enforces uniqueness.
    if ((err as { code?: string }).code === UNIQUE_VIOLATION) return "taken";
    throw err;
  }
}

// Case-insensitive, matching the users_username_lower_idx unique index.
export async function findUserByUsername(username: string): Promise<UserRow | undefined> {
  const { rows } = await pool.query<UserRow>(
    `SELECT id, username, password_hash AS "passwordHash"
     FROM users WHERE lower(username) = lower($1)`,
    [username]
  );
  return rows[0];
}
