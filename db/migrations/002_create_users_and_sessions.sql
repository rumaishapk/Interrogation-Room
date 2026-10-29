-- 002: Player accounts and login sessions.
-- The admin login is separate (ADMIN_PASSWORD in .env.local) and is not stored here.

CREATE TABLE users (
  -- gen_random_uuid() makes ids that can't be guessed by counting (1, 2, 3 ...).
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username      TEXT NOT NULL CHECK (username ~ '^[A-Za-z0-9_]{3,20}$'),
  -- Never the password itself: a one-way scrypt hash, e.g. 'scrypt$32768$8$1$<salt>$<hash>'.
  password_hash TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Usernames are unique ignoring case, so "Rishad" and "rishad" can't both exist.
CREATE UNIQUE INDEX users_username_lower_idx ON users (lower(username));

-- One row per logged-in browser. Logging out deletes the row.
CREATE TABLE sessions (
  -- The SHA-256 hash of the token in the player's cookie, not the token itself,
  -- so someone who reads this table still can't log in as anyone.
  id         TEXT PRIMARY KEY,
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Speeds up "log out on all devices" (find every session for one user).
CREATE INDEX sessions_user_id_idx ON sessions (user_id);
