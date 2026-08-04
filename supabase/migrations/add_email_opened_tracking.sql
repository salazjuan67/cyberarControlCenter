ALTER TABLE attendee_email_deliveries
  ADD COLUMN IF NOT EXISTS opened_at TIMESTAMPTZ;

ALTER TABLE newsletter_deliveries
  ADD COLUMN IF NOT EXISTS opened_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_attendee_deliveries_opened
  ON attendee_email_deliveries(opened_at)
  WHERE opened_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_newsletter_deliveries_opened
  ON newsletter_deliveries(opened_at)
  WHERE opened_at IS NOT NULL;
