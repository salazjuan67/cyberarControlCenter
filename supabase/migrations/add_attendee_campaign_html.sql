ALTER TABLE attendee_email_campaigns
  ADD COLUMN IF NOT EXISTS html TEXT DEFAULT '';
