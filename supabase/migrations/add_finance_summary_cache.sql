-- Cache del pull finance-summary de CYBER.AR (una fila, JSON completo)

CREATE TABLE IF NOT EXISTS finance_summary_cache (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  payload JSONB NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL,
  synced_at TIMESTAMPTZ DEFAULT NOW()
);
