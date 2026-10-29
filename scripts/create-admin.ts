// Creates an admin account, or resets an admin's password.
//   npm run admin:create -- <username>            create a new admin
//   npm run admin:create -- <username> --reset    set a new password (logs them out everywhere)
// There is deliberately no web page for this: anyone could use a page.
import pg from "pg";
import { createInterface } from "node:readline";
import { hashPassword } from "../lib/auth/password.ts";
import { signupSchema } from "../lib/auth/credentials.ts";

const args = process.argv.slice(2);
const reset = args.includes("--reset");
const username = args.find((arg) => !arg.startsWith("--"));
if (!username) {
  console.error("Usage: npm run admin:create -- <username> [--reset]");
  process.exit(1);
}

// When a person is typing, hide the password. When input is piped in (tests), read lines.
let pipedLines: string[] | undefined;
async function ask(question: string): Promise<string> {
  if (!process.stdin.isTTY) {
    if (!pipedLines) {
      pipedLines = [];
      for await (const line of createInterface({ input: process.stdin })) pipedLines.push(line);
    }
    return pipedLines.shift() ?? "";
  }
  process.stdout.write(question);
  return new Promise((resolve) => {
    const stdin = process.stdin;
    let value = "";
    const onData = (chunk: string) => {
      for (const char of chunk) {
        if (char === "\r" || char === "\n") {
          stdin.setRawMode(false);
          stdin.pause();
          stdin.off("data", onData);
          process.stdout.write("\n");
          return resolve(value);
        }
        if (char === "\u0003") process.exit(130); // Ctrl+C
        if (char === "\u007f" || char === "\b") value = value.slice(0, -1); // Backspace
        else value += char;
      }
    };
    stdin.setRawMode(true); // read key by key, without echoing to the screen
    stdin.setEncoding("utf8");
    stdin.resume();
    stdin.on("data", onData);
  });
}

const password = await ask("New admin password: ");
if ((await ask("Repeat the password: ")) !== password) {
  console.error("The passwords don't match. Nothing was changed.");
  process.exit(1);
}
// Same rules as player accounts: 3–20 character username, 8+ character password.
const parsed = signupSchema.safeParse({ username, password });
if (!parsed.success) {
  console.error(parsed.error.issues[0].message);
  process.exit(1);
}

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set. Copy .env.example to .env.local and fill it in.");
  process.exit(1);
}
const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

try {
  const passwordHash = await hashPassword(parsed.data.password);
  if (reset) {
    const result = await client.query(
      "UPDATE admins SET password_hash = $2 WHERE lower(username) = lower($1) RETURNING id",
      [parsed.data.username, passwordHash]
    );
    if (result.rowCount === 0) {
      console.error(`No admin named '${parsed.data.username}'.`);
      process.exitCode = 1;
    } else {
      // A new password should end every existing login.
      await client.query("DELETE FROM admin_sessions WHERE admin_id = $1", [result.rows[0].id]);
      console.log(`Password updated for admin '${parsed.data.username}'. Their old sessions were logged out.`);
    }
  } else {
    await client.query("INSERT INTO admins (username, password_hash) VALUES ($1, $2)", [
      parsed.data.username,
      passwordHash,
    ]);
    console.log(`Admin '${parsed.data.username}' created. Log in at /admin/login`);
  }
} catch (err) {
  if ((err as { code?: string }).code === "23505") {
    console.error(`An admin named '${username}' already exists. Use --reset to change the password.`);
  } else {
    console.error("Failed:", err instanceof Error ? err.message : err);
  }
  process.exitCode = 1;
} finally {
  await client.end();
}
