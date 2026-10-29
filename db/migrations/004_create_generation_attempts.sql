-- 004: Every time a player asks the AI for a case. Used for daily limits
-- and to allow only one generation at a time per player.

CREATE TABLE case_generation_attempts (
  -- An auto-increasing number. Fine here: nobody looks these ids up from a URL.
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  -- running:        generation in progress
  -- rejected_idea:  the safety check refused the idea (doesn't count toward limits)
  -- succeeded:      a case was created (case_id is set)
  -- failed:         Gemini or validation failed after the safety check passed
  outcome     TEXT NOT NULL DEFAULT 'running'
              CHECK (outcome IN ('running', 'rejected_idea', 'succeeded', 'failed')),
  case_id     TEXT REFERENCES cases(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ
);

-- A "partial" unique index: only rows that are still running are included, so each
-- player can have at most ONE running attempt. Two clicks at the same moment can't
-- both start, because the database refuses the second insert.
CREATE UNIQUE INDEX one_running_attempt_per_user
  ON case_generation_attempts (user_id) WHERE outcome = 'running';

-- Speeds up counting "attempts in the last 24 hours".
CREATE INDEX case_generation_attempts_created_at_idx ON case_generation_attempts (created_at);
