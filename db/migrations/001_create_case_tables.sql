-- 001: Tables that describe a case (the reusable mystery definition).
-- Player progress (games, messages, accusations) will get its own migration later.

-- One row per mystery.
CREATE TABLE cases (
  id             TEXT PRIMARY KEY,                       -- e.g. 'blackwood-001'
  title          TEXT NOT NULL,
  difficulty     TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  briefing       TEXT NOT NULL,
  victim         TEXT NOT NULL,
  location       TEXT NOT NULL,
  time_of_death  TEXT NOT NULL,
  status         TEXT NOT NULL DEFAULT 'draft'
                 CHECK (status IN ('draft', 'published', 'rejected')),
  schema_version INTEGER NOT NULL DEFAULT 1,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  published_at   TIMESTAMPTZ
);

-- Suspect ids like 'david' only need to be unique inside one case,
-- so the primary key is the pair (case_id, id).
CREATE TABLE suspects (
  case_id     TEXT NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  id          TEXT NOT NULL,
  position    INTEGER NOT NULL,                          -- display order; SQL rows have none
  name        TEXT NOT NULL,
  occupation  TEXT NOT NULL,
  description TEXT NOT NULL,
  PRIMARY KEY (case_id, id)
);

CREATE TABLE clues (
  case_id     TEXT NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  id          TEXT NOT NULL,
  position    INTEGER NOT NULL,
  title       TEXT NOT NULL,
  description TEXT NOT NULL,
  PRIMARY KEY (case_id, id)
);

CREATE TABLE motives (
  case_id  TEXT NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  id       TEXT NOT NULL,
  position INTEGER NOT NULL,
  label    TEXT NOT NULL,
  PRIMARY KEY (case_id, id)
);

CREATE TABLE weapons (
  case_id  TEXT NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  id       TEXT NOT NULL,
  position INTEGER NOT NULL,
  label    TEXT NOT NULL,
  PRIMARY KEY (case_id, id)
);

-- The solution. Server-only: never select from this table in a player-facing query
-- except to judge an accusation.
-- The composite foreign keys guarantee the murderer, motive and weapon belong to THIS case.
CREATE TABLE case_truths (
  case_id          TEXT PRIMARY KEY REFERENCES cases(id) ON DELETE CASCADE,
  murderer_id      TEXT NOT NULL,
  motive_id        TEXT NOT NULL,
  weapon_id        TEXT NOT NULL,
  cause_of_death   TEXT NOT NULL,
  key_evidence_ids JSONB NOT NULL CHECK (jsonb_typeof(key_evidence_ids) = 'array'),
  explanation      TEXT NOT NULL,
  timeline         JSONB NOT NULL CHECK (jsonb_typeof(timeline) = 'array'),
  FOREIGN KEY (case_id, murderer_id) REFERENCES suspects (case_id, id),
  FOREIGN KEY (case_id, motive_id)   REFERENCES motives  (case_id, id),
  FOREIGN KEY (case_id, weapon_id)   REFERENCES weapons  (case_id, id)
);

-- What each suspect knows and how they talk. Server-only.
CREATE TABLE suspect_knowledge (
  case_id        TEXT NOT NULL,
  suspect_id     TEXT NOT NULL,
  personality    TEXT NOT NULL,
  initial_alibi  TEXT NOT NULL,
  knows          JSONB NOT NULL CHECK (jsonb_typeof(knows) = 'array'),
  secrets        JSONB NOT NULL CHECK (jsonb_typeof(secrets) = 'array'),
  topics         JSONB NOT NULL CHECK (jsonb_typeof(topics) = 'array'),
  fallback_reply TEXT NOT NULL,
  PRIMARY KEY (case_id, suspect_id),
  FOREIGN KEY (case_id, suspect_id) REFERENCES suspects (case_id, id) ON DELETE CASCADE
);
