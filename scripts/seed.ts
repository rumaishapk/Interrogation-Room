// Inserts the hand-written cases from db/seeds into PostgreSQL.
// Usage: npm run db:seed   (safe to re-run: each case is replaced, not duplicated)
import pg from "pg";
import type { CaseDefinition } from "../lib/game/types.ts";
import { blackwoodCase } from "../db/seeds/blackwood.ts";
import { validateCase } from "../lib/game/validate-case.ts";
import { insertCase } from "../lib/db/insert-case.ts";

const seedCases: CaseDefinition[] = [blackwoodCase];

// Refuse to touch the database if any case is invalid.
const invalid = seedCases
  .map((c) => ({ id: c.id, result: validateCase(c) }))
  .filter(({ result }) => !result.ok);
if (invalid.length > 0) {
  for (const { id, result } of invalid) {
    console.error(`Case '${id}' is invalid:`);
    if (!result.ok) for (const error of result.errors) console.error(`  - ${error}`);
  }
  process.exit(1);
}

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set. Copy .env.example to .env.local and fill it in.");
  process.exit(1);
}

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

// One transaction for everything: either every case is seeded, or nothing changes.
try {
  await client.query("BEGIN");
  for (const c of seedCases) {
    await insertCase(client, c, "published");
    console.log(`Seeded ${c.id} (${c.suspects.length} suspects, ${c.clues.length} clues)`);
  }
  await client.query("COMMIT");
} catch (err) {
  await client.query("ROLLBACK");
  console.error("Seed failed, nothing was changed:", err instanceof Error ? err.message : err);
  process.exitCode = 1;
} finally {
  await client.end();
}
