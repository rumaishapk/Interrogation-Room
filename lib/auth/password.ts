// Password hashing with scrypt, built into Node. No Next.js imports,
// so it can be unit-tested directly.
//
// Stored format: "scrypt$<N>$<r>$<p>$<salt>$<hash>" (salt and hash in base64).
// Keeping the settings inside the stored string means we can make hashing
// stronger later without breaking passwords saved with the old settings.
import { randomBytes, scrypt, timingSafeEqual, type ScryptOptions } from "node:crypto";

// N = cost (how slow), r = block size, p = parallelism. These use about 32 MB of
// memory per hash: slow for an attacker guessing billions, fine for one login.
const N = 32768;
const R = 8;
const P = 1;
const KEY_LENGTH = 64;
const SALT_BYTES = 16;

// A very long "password" would make scrypt take a long time: limit it.
export const MAX_PASSWORD_LENGTH = 128;

function scryptAsync(password: string, salt: Buffer, options: ScryptOptions): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    // maxmem must be above 128 * N * r bytes, or Node refuses these settings.
    scrypt(password, salt, KEY_LENGTH, { ...options, maxmem: 64 * 1024 * 1024 }, (err, key) =>
      err ? reject(err) : resolve(key)
    );
  });
}

export async function hashPassword(password: string): Promise<string> {
  // A new random salt every time: two players with the same password get different hashes.
  const salt = randomBytes(SALT_BYTES);
  const hash = await scryptAsync(password, salt, { N, r: R, p: P });
  return ["scrypt", N, R, P, salt.toString("base64"), hash.toString("base64")].join("$");
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [algorithm, n, r, p, saltText, hashText] = stored.split("$");
  if (algorithm !== "scrypt" || !saltText || !hashText) return false;
  if (password.length > MAX_PASSWORD_LENGTH) return false;

  const expected = Buffer.from(hashText, "base64");
  const actual = await scryptAsync(password, Buffer.from(saltText, "base64"), {
    N: Number(n),
    r: Number(r),
    p: Number(p),
  });
  // Constant-time comparison, so timing can't reveal how much of the hash matched.
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
