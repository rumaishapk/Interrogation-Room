-- 007: What each suspect looks like (public), for profiles and portraits.
-- Both are optional: cases created before this migration simply don't have them,
-- and the app draws a stable stand-in look instead.

ALTER TABLE suspects ADD COLUMN appearance TEXT
  CHECK (appearance IS NULL OR char_length(appearance) BETWEEN 1 AND 300);

-- e.g. {"age":"young","skin":"tan","hairStyle":"bun", ...}. The allowed values are
-- checked by the app's validator (lib/game/suspect-look.ts), not repeated here.
ALTER TABLE suspects ADD COLUMN look JSONB
  CHECK (look IS NULL OR jsonb_typeof(look) = 'object');
