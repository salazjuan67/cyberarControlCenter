ALTER TABLE sponsors
  ADD COLUMN IF NOT EXISTS origen TEXT DEFAULT '';

CREATE INDEX IF NOT EXISTS idx_sponsors_origen
  ON sponsors(origen);
