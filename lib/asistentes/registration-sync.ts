import type {
  AsistenteCategoria,
  AsistenteModalidad,
  AsistentePotencial,
} from "@/types/asistentes";
import type { ExternalRegistration } from "@/types/registration-sync";

export function normalizeRegistrationEmail(value: string): string {
  return value.trim().toLowerCase();
}

function mapCategory(value: string): AsistenteCategoria {
  switch (value.trim().toLowerCase()) {
    case "alumno_grado":
      return "Estudiante";
    case "expositor":
      return "Expositor";
    default:
      return "Profesional";
  }
}

function mapModality(value: string): AsistenteModalidad {
  const normalized = value.trim().toLowerCase();
  if (normalized === "presencial") return "Presencial";
  if (normalized === "virtual") return "Virtual";
  return "";
}

function appendOrigin(current: string): string {
  const source = "Sistema de inscripciones";
  if (!current.trim()) return source;
  if (current.toLowerCase().includes(source.toLowerCase())) return current;
  return `${current} · ${source}`;
}

export function mergeRegistrationIntoAttendee(
  registration: ExternalRegistration,
  existing: AsistentePotencial | null,
  attendeeId: string,
  syncedAt: string
): AsistentePotencial {
  const confirmed = registration.registrationStatus === "confirmed";
  const base: AsistentePotencial = existing ?? {
    id: attendeeId,
    nombre: registration.fullName || registration.email,
    apellido: "",
    email: registration.email,
    telefono: "",
    organizacion: "",
    cargo: "",
    categoria: mapCategory(registration.category),
    modalidad: mapModality(registration.modality),
    estado: confirmed ? "Inscripto" : "Interesado",
    origen: "Sistema de inscripciones",
    pais: "",
    region: "",
    responsable: "",
    probabilidad: confirmed ? 100 : 80,
    ultimoContacto: "",
    proximaAccion: confirmed ? "" : "Completar inscripción",
    notas: "",
  };

  return {
    ...base,
    nombre: base.nombre || registration.fullName || registration.email,
    email: registration.email,
    telefono: base.telefono || registration.phone,
    organizacion: base.organizacion || registration.organization,
    categoria: mapCategory(registration.category),
    modalidad: mapModality(registration.modality) || base.modalidad,
    estado: confirmed ? "Inscripto" : base.estado,
    origen: appendOrigin(base.origen),
    probabilidad: confirmed ? 100 : base.probabilidad,
    proximaAccion: confirmed
      ? base.proximaAccion === "Completar inscripción"
        ? ""
        : base.proximaAccion
      : base.proximaAccion || "Completar inscripción",
    registrationId: registration.id,
    registrationStatus: registration.registrationStatus,
    paymentStatus: registration.paymentStatus,
    registeredAt: registration.registeredAt,
    registrationSyncedAt: syncedAt,
  };
}

export function attendeeSyncFingerprint(attendee: AsistentePotencial): string {
  return JSON.stringify({
    ...attendee,
    registrationSyncedAt: undefined,
  });
}
