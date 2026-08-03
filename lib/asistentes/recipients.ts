import type { AsistentePotencial } from "@/types/asistentes";
import type { AttendeeEmailAudience, AttendeeEmailRecipient } from "@/types/asistentes";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email.trim());
}

export function resolveAttendeeRecipients(
  asistentes: AsistentePotencial[],
  audience: AttendeeEmailAudience
): { recipients: AttendeeEmailRecipient[]; skipped: number } {
  let filtered = asistentes;

  if (audience === "interested") {
    filtered = asistentes.filter((a) =>
      ["Lead", "Contactado", "Invitación enviada", "Interesado"].includes(a.estado)
    );
  }

  const seen = new Set<string>();
  const recipients: AttendeeEmailRecipient[] = [];
  let skipped = 0;

  for (const asistente of filtered) {
    const email = asistente.email?.trim().toLowerCase();
    if (!email || !isValidEmail(email)) {
      skipped += 1;
      continue;
    }
    if (seen.has(email)) {
      skipped += 1;
      continue;
    }

    seen.add(email);
    const name = [asistente.nombre, asistente.apellido].filter(Boolean).join(" ").trim();
    recipients.push({
      email,
      name: name || asistente.organizacion || "Asistente",
      organizacion: asistente.organizacion?.trim() || "—",
      attendeeId: asistente.id,
    });
  }

  return { recipients, skipped };
}
