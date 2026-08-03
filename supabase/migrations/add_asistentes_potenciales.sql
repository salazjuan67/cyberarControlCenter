CREATE TABLE IF NOT EXISTS asistentes_potenciales (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL DEFAULT '',
  apellido TEXT DEFAULT '',
  email TEXT DEFAULT '',
  telefono TEXT DEFAULT '',
  organizacion TEXT DEFAULT '',
  cargo TEXT DEFAULT '',
  categoria TEXT NOT NULL DEFAULT 'Profesional',
  modalidad TEXT DEFAULT '',
  estado TEXT NOT NULL DEFAULT 'Lead',
  origen TEXT DEFAULT '',
  pais TEXT DEFAULT '',
  region TEXT DEFAULT '',
  responsable TEXT DEFAULT '',
  probabilidad INT NOT NULL DEFAULT 50,
  ultimo_contacto DATE,
  proxima_accion TEXT DEFAULT '',
  notas TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS attendee_email_campaigns (
  id TEXT PRIMARY KEY,
  subject TEXT NOT NULL,
  audience TEXT NOT NULL,
  from_email TEXT NOT NULL,
  total_recipients INT NOT NULL DEFAULT 0,
  sent_count INT NOT NULL DEFAULT 0,
  failed_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS attendee_email_deliveries (
  id TEXT PRIMARY KEY,
  campaign_id TEXT NOT NULL REFERENCES attendee_email_campaigns(id) ON DELETE CASCADE,
  resend_email_id TEXT UNIQUE,
  attendee_id TEXT DEFAULT '',
  recipient_email TEXT NOT NULL,
  recipient_name TEXT DEFAULT '',
  organizacion TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending',
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  bounced_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  bounce_reason TEXT DEFAULT '',
  last_event_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_asistentes_email ON asistentes_potenciales(email);
CREATE INDEX IF NOT EXISTS idx_asistentes_estado ON asistentes_potenciales(estado);
CREATE INDEX IF NOT EXISTS idx_attendee_deliveries_campaign ON attendee_email_deliveries(campaign_id);
CREATE INDEX IF NOT EXISTS idx_attendee_deliveries_attendee ON attendee_email_deliveries(attendee_id);
CREATE INDEX IF NOT EXISTS idx_attendee_deliveries_resend ON attendee_email_deliveries(resend_email_id);
