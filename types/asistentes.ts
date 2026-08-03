export type AsistenteCategoria =
  | "Profesional"
  | "Estudiante"
  | "Militar"
  | "Investigador"
  | "Invitado"
  | "Expositor";

export type AsistenteModalidad = "Presencial" | "Virtual" | "";

export type AsistenteEstado =
  | "Lead"
  | "Contactado"
  | "Invitación enviada"
  | "Interesado"
  | "Inscripto"
  | "No interesado";

export interface AsistentePotencial {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  organizacion: string;
  cargo: string;
  categoria: AsistenteCategoria;
  modalidad: AsistenteModalidad;
  estado: AsistenteEstado;
  origen: string;
  pais: string;
  region: string;
  responsable: string;
  probabilidad: number;
  ultimoContacto: string;
  proximaAccion: string;
  notas: string;
}

export type AttendeeEmailAudience = "all" | "with_email" | "interested";

export type AttendeeDeliveryStatus =
  | "pending"
  | "sent"
  | "delivered"
  | "bounced"
  | "failed"
  | "delayed";

export interface AttendeeEmailRecipient {
  email: string;
  name: string;
  organizacion: string;
  attendeeId: string;
}

export interface AttendeeEmailPreview {
  audience: AttendeeEmailAudience;
  recipients: AttendeeEmailRecipient[];
  skipped: number;
}

export interface AttendeeEmailCampaign {
  id: string;
  subject: string;
  audience: AttendeeEmailAudience;
  fromEmail: string;
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
  createdAt: string;
}

export interface AttendeeEmailDeliveryRow {
  id: string;
  campaignId: string;
  resendEmailId: string;
  attendeeId: string;
  recipientEmail: string;
  recipientName: string;
  organizacion: string;
  status: AttendeeDeliveryStatus;
  sentAt: string;
  deliveredAt: string;
  bouncedAt: string;
  failedAt: string;
  bounceReason: string;
  lastEventAt: string;
}

export interface AttendeeEmailCampaignStats {
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

export interface AttendeeEmailCampaignDetail {
  campaign: AttendeeEmailCampaign;
  stats: AttendeeEmailCampaignStats;
  deliveries: AttendeeEmailDeliveryRow[];
}

export interface AttendeeEmailHistoryEntry {
  deliveryId: string;
  campaignId: string;
  subject: string;
  campaignDate: string;
  recipientEmail: string;
  status: AttendeeDeliveryStatus;
  sentAt: string;
  deliveredAt: string;
  bouncedAt: string;
  bounceReason: string;
}

export interface SendAttendeeEmailInput {
  subject: string;
  html: string;
  audience: AttendeeEmailAudience;
}

export interface SendAttendeeEmailResult {
  ok: boolean;
  sent: number;
  failed: number;
  errors: string[];
  campaignId?: string;
}

export interface AttendeeEmailStatus {
  configured: boolean;
  fromEmail: string | null;
  fromEmailWarning: string | null;
}
