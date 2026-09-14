ALTER TABLE asistentes_potenciales
  ADD COLUMN IF NOT EXISTS registration_payment_method TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS registration_access_type TEXT DEFAULT '';

CREATE INDEX IF NOT EXISTS idx_asistentes_registration_payment_method
  ON asistentes_potenciales(registration_payment_method);
