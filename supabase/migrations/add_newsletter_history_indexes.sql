CREATE INDEX IF NOT EXISTS idx_newsletter_deliveries_sponsor
  ON newsletter_deliveries(sponsor_id);

CREATE INDEX IF NOT EXISTS idx_newsletter_deliveries_recipient_email
  ON newsletter_deliveries(recipient_email);

CREATE INDEX IF NOT EXISTS idx_newsletter_campaigns_created
  ON newsletter_campaigns(created_at DESC);
