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
  break_even NUMERIC NOT NULL DEFAULT 0
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
  ultimo_contacto DATE,
  proxima_accion TEXT DEFAULT '',
  notas TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inscripciones (
  id TEXT PRIMARY KEY,
  categoria TEXT NOT NULL,
  modalidad TEXT NOT NULL,
  precio_unitario NUMERIC NOT NULL DEFAULT 0,
  cantidad_confirmada INT NOT NULL DEFAULT 0,
  cantidad_proyectada INT NOT NULL DEFAULT 0,
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
  monto_prom_sponsor NUMERIC NOT NULL DEFAULT 0
);
