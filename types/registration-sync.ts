export type RegistrationStatus = "confirmed" | "pending" | "rejected";
export type RegistrationPaymentStatus =
  | "aprobado"
  | "iniciado"
  | "pendiente"
  | "rechazado"
  | string;

export interface ExternalRegistration {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  organization: string;
  category: string;
  modality: string;
  registrationStatus: RegistrationStatus;
  paymentStatus: RegistrationPaymentStatus;
  paymentMethod: string;
  accessType: string;
  registeredAt: string;
  paidAt: string;
  studentCertificateStatus: string;
  isTest: boolean;
}

export interface RegistrationExportPage {
  generatedAt: string;
  nextCursor: string | null;
  registrations: ExternalRegistration[];
}

export interface RegistrationSyncResult {
  fetched: number;
  created: number;
  updated: number;
  unchanged: number;
  errors: string[];
  generatedAt: string;
  syncedAt: string;
}

export interface RegistrationSyncStatus extends RegistrationSyncResult {
  id: string;
}
