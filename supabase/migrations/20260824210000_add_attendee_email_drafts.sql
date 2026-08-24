CREATE TABLE IF NOT EXISTS attendee_email_drafts (
  id TEXT PRIMARY KEY,
  sort_order INT NOT NULL,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  html TEXT NOT NULL DEFAULT '',
  audience TEXT NOT NULL DEFAULT 'unconfirmed_unpaid',
  recommended_for TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_attendee_email_drafts_sort_order
  ON attendee_email_drafts(sort_order);

CREATE INDEX IF NOT EXISTS idx_attendee_email_drafts_recommended
  ON attendee_email_drafts(recommended_for);
