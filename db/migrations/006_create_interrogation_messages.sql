-- 006: Every question a player asks and every answer a suspect gives.
-- Stored on the server so the AI always sees the real conversation
-- (a player can't fake "earlier you admitted it"), and chats survive a refresh.

CREATE TABLE interrogation_messages (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY, -- also gives the order
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  case_id    TEXT NOT NULL,
  suspect_id TEXT NOT NULL,
  role       TEXT NOT NULL CHECK (role IN ('detective', 'suspect')),
  content    TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 2000),
  -- For suspect replies: 'ai' (Gemini) or 'fallback' (keyword reply when Gemini failed).
  source     TEXT CHECK (source IN ('ai', 'fallback')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- The suspect must belong to this case. Deleting a case deletes its conversations.
  FOREIGN KEY (case_id, suspect_id) REFERENCES suspects (case_id, id) ON DELETE CASCADE
);

-- Loading one player's conversation with one suspect, in order.
CREATE INDEX interrogation_messages_thread_idx
  ON interrogation_messages (user_id, case_id, suspect_id, id);

-- Counting a player's questions in the last 24 hours (the daily limit).
CREATE INDEX interrogation_messages_user_time_idx
  ON interrogation_messages (user_id, created_at);
