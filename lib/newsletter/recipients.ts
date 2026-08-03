import type { Sponsor } from "@/types";
import type { NewsletterAudience, NewsletterRecipient } from "@/types/newsletter";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email.trim());
}

export function resolveSponsorRecipients(
  sponsors: Sponsor[],
  audience: NewsletterAudience
): { recipients: NewsletterRecipient[]; skipped: number } {
  const filtered =
    audience === "confirmed_sponsors"
      ? sponsors.filter((s) => s.estado === "Confirmado")
      : sponsors;

  const seen = new Set<string>();
  const recipients: NewsletterRecipient[] = [];
  let skipped = 0;

  for (const sponsor of filtered) {
    const email = sponsor.email?.trim().toLowerCase();
    if (!email || !isValidEmail(email)) {
      skipped += 1;
      continue;
    }
    if (seen.has(email)) {
      skipped += 1;
      continue;
    }

    seen.add(email);
    recipients.push({
      email,
      name: sponsor.contacto?.trim() || sponsor.empresa?.trim() || "Contacto",
      empresa: sponsor.empresa?.trim() || "—",
    });
  }

  return { recipients, skipped };
}
