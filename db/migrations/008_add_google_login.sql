-- 008: "Continue with Google" for players.
-- A player can now log in with a password, with Google, or (later) both.

-- Google players have no password.
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;

-- Google's permanent id for the account (the "sub" claim). Emails can change
-- or be reused, so this, not the email, is how we recognise a returning player.
ALTER TABLE users ADD COLUMN google_sub TEXT;
-- Kept for reference only (e.g. support). Never used to log anyone in.
ALTER TABLE users ADD COLUMN email TEXT;

-- Named, so the code can tell "this Google account already has a player"
-- (e.g. signup finished in another tab) apart from "that username is taken".
ALTER TABLE users ADD CONSTRAINT users_google_sub_unique UNIQUE (google_sub);

-- Every player must have at least one way to log in, and an empty string doesn't count.
ALTER TABLE users ADD CONSTRAINT users_has_login_method
  CHECK (password_hash IS NOT NULL OR google_sub IS NOT NULL);
ALTER TABLE users ADD CONSTRAINT users_google_sub_nonempty CHECK (google_sub <> '');
ALTER TABLE users ADD CONSTRAINT users_password_hash_nonempty CHECK (password_hash <> '');

-- "Google said yes, but the player hasn't chosen a detective name yet."
-- Lives for 15 minutes. Every read must check expires_at > now().
CREATE TABLE pending_google_signups (
  -- SHA-256 hash of the token in the player's cookie, same idea as sessions.id.
  id         TEXT PRIMARY KEY,
  google_sub TEXT NOT NULL CHECK (google_sub <> ''),
  email      TEXT,
  -- Where to send the player once they've picked a name (already checked by safeNextPath).
  next_path  TEXT NOT NULL CHECK (char_length(next_path) <= 512),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Clearing out expired rows.
CREATE INDEX pending_google_signups_expires_idx ON pending_google_signups (expires_at);
-- Replacing a player's older pending row when they come back from Google again.
CREATE INDEX pending_google_signups_google_sub_idx ON pending_google_signups (google_sub);
