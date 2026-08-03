export type NewsletterAudience = "all_sponsors" | "confirmed_sponsors";

export interface NewsletterRecipient {
  email: string;
  name: string;
  empresa: string;
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
}

export interface SendTestEmailInput {
  subject: string;
  html: string;
  to: string;
}

export interface SendTestEmailResult {
  ok: boolean;
  error?: string;
}

export interface NewsletterStatus {
  configured: boolean;
  fromEmail: string | null;
}

export interface NewsletterSummaryDraft {
  subject: string;
  html: string;
}
