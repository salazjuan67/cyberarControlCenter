ALTER TABLE attendee_email_campaigns
  ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_attendee_campaigns_scheduled
  ON attendee_email_campaigns(scheduled_for)
  WHERE scheduled_for IS NOT NULL AND cancelled_at IS NULL;
