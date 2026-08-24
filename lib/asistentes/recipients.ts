import type { AsistentePotencial } from "@/types/asistentes";
import type { AttendeeEmailAudience, AttendeeEmailRecipient } from "@/types/asistentes";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email.trim());
}

export function resolveAttendeeRecipients(
  asistentes: AsistentePotencial[],
  audience: AttendeeEmailAudience,
  excludedEmails: ReadonlySet<string> = new Set()
): { recipients: AttendeeEmailRecipient[]; skipped: number } {
  let filtered = asistentes;

  if (audience === "interested") {
    filtered = asistentes.filter((a) =>
      ["Lead", "Contactado", "Invitación enviada", "Interesado"].includes(a.estado)
    );
  } else if (audience === "bairescode") {
    filtered = asistentes.filter((a) => a.origen.trim().toLowerCase() === "bairescode");
  } else if (audience === "not_registered_safe") {
    filtered = asistentes.filter(
      (a) => a.estado !== "Inscripto" && a.registrationStatus !== "confirmed"
    );
  } else if (audience === "unconfirmed_unpaid") {
    filtered = asistentes.filter((a) => {
      const registrationStatus = a.registrationStatus?.trim().toLowerCase();
      const paymentStatus = a.paymentStatus?.trim().toLowerCase();
      return (
        registrationStatus !== "confirmed" &&
        !["aprobado", "approved", "paid"].includes(paymentStatus ?? "")
      );
    });
  } else if (audience === "registered_confirmed") {
    filtered = asistentes.filter(
      (a) => a.estado === "Inscripto" || a.registrationStatus === "confirmed"
    );
  } else if (audience === "registered_pending") {
    filtered = asistentes.filter((a) => a.registrationStatus === "pending");
  } else if (audience === "registered_rejected") {
    filtered = asistentes.filter((a) => a.registrationStatus === "rejected");
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
    if (excludedEmails.has(email)) {
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
