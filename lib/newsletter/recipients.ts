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
  const filtered = sponsors.filter((sponsor) => {
    switch (audience) {
      case "bairescode_sponsors":
        return sponsor.origen?.trim().toLowerCase() === "bairescode";
      case "high_priority_sponsors":
        return sponsor.prioridad.trim().toLowerCase().includes("alta");
      case "lead_sponsors":
        return sponsor.estado === "Lead";
      case "proposal_sponsors":
        return sponsor.estado === "Propuesta enviada";
      case "negotiating_sponsors":
        return sponsor.estado === "En negociación";
      case "confirmed_sponsors":
        return sponsor.estado === "Confirmado";
      default:
        return true;
    }
  });

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
      sponsorId: sponsor.id,
    });
  }

  return { recipients, skipped };
}
