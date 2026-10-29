-- 005: Admin accounts and admin login sessions, stored in the database.
-- Kept separate from players (users/sessions), so a player can never become admin
-- by accident. Admins are created from the terminal: npm run admin:create

CREATE TABLE admins (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username      TEXT NOT NULL CHECK (username ~ '^[A-Za-z0-9_]{3,20}$'),
  password_hash TEXT NOT NULL, -- scrypt hash, same format as users.password_hash
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX admins_username_lower_idx ON admins (lower(username));

CREATE TABLE admin_sessions (
  id         TEXT PRIMARY KEY, -- SHA-256 hash of the cookie token, never the token itself
  admin_id   UUID NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX admin_sessions_admin_id_idx ON admin_sessions (admin_id);
