// Where to send a player after they log in, e.g. back to the case they clicked.
// The value comes from the URL (?next=...), which anyone can edit, so only allow
// paths on THIS site. Otherwise a link like /login?next=https://evil.example
// would send a freshly logged-in player to another website (an "open redirect").

const FALLBACK = "/cases";

export function safeNextPath(value: unknown): string {
  if (typeof value !== "string") return FALLBACK;
  // Must start with exactly one "/". "//evil.example" and "/\evil.example" are
  // treated by browsers as links to another site.
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return FALLBACK;
  // No control characters (e.g. hidden newlines).
  if (/[\u0000-\u001f\u007f]/.test(value)) return FALLBACK;
  return value;
}
