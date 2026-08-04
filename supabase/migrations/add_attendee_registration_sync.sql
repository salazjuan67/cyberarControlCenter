ALTER TABLE asistentes_potenciales
  ADD COLUMN IF NOT EXISTS registration_id TEXT,
  ADD COLUMN IF NOT EXISTS registration_status TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS registered_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS registration_synced_at TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS idx_asistentes_registration_id
  ON asistentes_potenciales(registration_id)
  WHERE registration_id IS NOT NULL AND registration_id <> '';

CREATE INDEX IF NOT EXISTS idx_asistentes_email_normalized
  ON asistentes_potenciales(LOWER(TRIM(email)));

CREATE INDEX IF NOT EXISTS idx_asistentes_registration_status
  ON asistentes_potenciales(registration_status);

CREATE TABLE IF NOT EXISTS attendee_registration_syncs (
  id TEXT PRIMARY KEY,
  generated_at TIMESTAMPTZ,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  fetched_count INT NOT NULL DEFAULT 0,
  created_count INT NOT NULL DEFAULT 0,
  updated_count INT NOT NULL DEFAULT 0,
  unchanged_count INT NOT NULL DEFAULT 0,
  error_count INT NOT NULL DEFAULT 0,
  errors JSONB NOT NULL DEFAULT '[]'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_attendee_registration_syncs_synced_at
  ON attendee_registration_syncs(synced_at DESC);
