export type NewsletterAudience = "all_sponsors" | "confirmed_sponsors";

export type NewsletterDeliveryStatus =
  | "pending"
  | "sent"
  | "delivered"
  | "bounced"
  | "failed"
  | "delayed";

export interface NewsletterRecipient {
  email: string;
  name: string;
  empresa: string;
  sponsorId: string;
}

export interface NewsletterPreview {
  audience: NewsletterAudience;
  recipients: NewsletterRecipient[];
  skipped: number;
}

export interface SendNewsletterInput {
  subject: string;
  html: string;
  audience: NewsletterAudience;
}

export interface SendNewsletterResult {
  ok: boolean;
  sent: number;
  failed: number;
  errors: string[];
  campaignId?: string;
}

export interface SendTestEmailInput {
  subject: string;
  html: string;
  to: string;
}

export interface SendTestEmailResult {
  ok: boolean;
  error?: string;
  emailId?: string;
  hint?: string;
}

export interface NewsletterStatus {
  configured: boolean;
  fromEmail: string | null;
  fromEmailWarning: string | null;
}

export interface NewsletterSummaryDraft {
  subject: string;
  html: string;
}

export interface NewsletterCampaign {
  id: string;
  subject: string;
  audience: NewsletterAudience;
  fromEmail: string;
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
  createdAt: string;
}

export interface NewsletterCampaignStats {
  campaignId: string;
  subject: string;
  createdAt: string;
  total: number;
  sent: number;
  delivered: number;
  bounced: number;
  failed: number;
  pending: number;
  deliveryRate: number;
  bounceRate: number;
}

export interface NewsletterDeliveryRow {
  id: string;
  campaignId: string;
  resendEmailId: string;
  sponsorId: string;
  recipientEmail: string;
  recipientName: string;
  empresa: string;
  status: NewsletterDeliveryStatus;
  sentAt: string;
  deliveredAt: string;
  bouncedAt: string;
  failedAt: string;
  bounceReason: string;
  lastEventAt: string;
}

export interface NewsletterCampaignDetail {
  campaign: NewsletterCampaign;
  stats: NewsletterCampaignStats;
  deliveries: NewsletterDeliveryRow[];
}

export interface SponsorEmailHistoryEntry {
  deliveryId: string;
  campaignId: string;
  subject: string;
  campaignDate: string;
  recipientEmail: string;
  status: NewsletterDeliveryStatus;
  sentAt: string;
  deliveredAt: string;
  bouncedAt: string;
  bounceReason: string;
}
