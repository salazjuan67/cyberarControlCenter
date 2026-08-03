-- Ejecutá este script en Supabase → SQL Editor

CREATE TABLE IF NOT EXISTS event_config (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  nombre_evento TEXT NOT NULL,
  anio INT NOT NULL,
  moneda TEXT NOT NULL DEFAULT 'USD',
  fecha_inicio DATE NOT NULL,
  fecha_cierre_inscripciones DATE NOT NULL,
  meta_presencial INT NOT NULL DEFAULT 0,
  meta_virtual INT NOT NULL DEFAULT 0,
  meta_sponsors INT NOT NULL DEFAULT 0,
  break_even NUMERIC NOT NULL DEFAULT 0,
  break_even_moneda TEXT NOT NULL DEFAULT 'USD'
);

CREATE TABLE IF NOT EXISTS sponsors (
  id TEXT PRIMARY KEY,
  empresa TEXT NOT NULL,
  contacto TEXT DEFAULT '',
  email TEXT DEFAULT '',
  telefono TEXT DEFAULT '',
  categoria TEXT NOT NULL,
  estado TEXT NOT NULL,
  monto_estimado NUMERIC NOT NULL DEFAULT 0,
  monto_confirmado NUMERIC NOT NULL DEFAULT 0,
  probabilidad INT NOT NULL DEFAULT 0,
  responsable TEXT DEFAULT '',
  segmento TEXT DEFAULT '',
  prioridad TEXT DEFAULT '',
  region TEXT DEFAULT '',
  ultimo_contacto DATE,
  proxima_accion TEXT DEFAULT '',
  notas TEXT DEFAULT '',
  proposed_email TEXT DEFAULT '',
  email_source_url TEXT DEFAULT '',
  moneda TEXT NOT NULL DEFAULT 'USD',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inscripciones (
  id TEXT PRIMARY KEY,
  categoria TEXT NOT NULL,
  modalidad TEXT NOT NULL,
  precio_unitario NUMERIC NOT NULL DEFAULT 0,
  cantidad_confirmada INT NOT NULL DEFAULT 0,
  cantidad_proyectada INT NOT NULL DEFAULT 0,
  moneda TEXT NOT NULL DEFAULT 'USD',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS gastos (
  id TEXT PRIMARY KEY,
  concepto TEXT NOT NULL,
  categoria TEXT NOT NULL,
  presupuesto_estimado NUMERIC NOT NULL DEFAULT 0,
  costo_real NUMERIC NOT NULL DEFAULT 0,
  estado TEXT NOT NULL,
  proveedor TEXT DEFAULT '',
  fecha_pago DATE,
  notas TEXT DEFAULT '',
  moneda TEXT NOT NULL DEFAULT 'USD',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS escenarios (
  tipo TEXT PRIMARY KEY,
  asistentes_presenciales INT NOT NULL DEFAULT 0,
  asistentes_virtuales INT NOT NULL DEFAULT 0,
  sponsors_confirmados NUMERIC NOT NULL DEFAULT 0,
  sponsors_potenciales NUMERIC NOT NULL DEFAULT 0,
  gastos_estimados NUMERIC NOT NULL DEFAULT 0,
  precio_prom_presencial NUMERIC NOT NULL DEFAULT 0,
  precio_prom_virtual NUMERIC NOT NULL DEFAULT 0,
  monto_prom_sponsor NUMERIC NOT NULL DEFAULT 0,
  moneda TEXT NOT NULL DEFAULT 'USD'
);

CREATE TABLE IF NOT EXISTS finance_summary_cache (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  payload JSONB NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL,
  synced_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS newsletter_campaigns (
  id TEXT PRIMARY KEY,
  subject TEXT NOT NULL,
  audience TEXT NOT NULL,
  from_email TEXT NOT NULL,
  total_recipients INT NOT NULL DEFAULT 0,
  sent_count INT NOT NULL DEFAULT 0,
  failed_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS newsletter_deliveries (
  id TEXT PRIMARY KEY,
  campaign_id TEXT NOT NULL REFERENCES newsletter_campaigns(id) ON DELETE CASCADE,
  resend_email_id TEXT UNIQUE,
  sponsor_id TEXT DEFAULT '',
  recipient_email TEXT NOT NULL,
  recipient_name TEXT DEFAULT '',
  empresa TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending',
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  bounced_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  bounce_reason TEXT DEFAULT '',
  last_event_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

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
