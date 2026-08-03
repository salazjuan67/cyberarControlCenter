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

CREATE INDEX IF NOT EXISTS idx_newsletter_deliveries_campaign
  ON newsletter_deliveries(campaign_id);

CREATE INDEX IF NOT EXISTS idx_newsletter_deliveries_resend_email
  ON newsletter_deliveries(resend_email_id);

CREATE INDEX IF NOT EXISTS idx_newsletter_deliveries_status
  ON newsletter_deliveries(status);
