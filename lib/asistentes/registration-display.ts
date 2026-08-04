export const REGISTRATION_STATUS_LABELS: Record<string, string> = {
  confirmed: "Confirmada",
  pending: "Pendiente",
  rejected: "Rechazada",
};

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  aprobado: "Pago aprobado",
  iniciado: "Pago iniciado",
  pendiente: "Pago pendiente",
  rechazado: "Pago rechazado",
};

export function registrationStatusLabel(value?: string): string {
  if (!value) return "Sin inscripción";
  return REGISTRATION_STATUS_LABELS[value] ?? value;
}

export function paymentStatusLabel(value?: string): string {
  if (!value) return "—";
  return PAYMENT_STATUS_LABELS[value] ?? value;
}

export function registrationStatusClass(value?: string): string {
  if (value === "confirmed") {
    return "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-300";
  }
  if (value === "rejected") {
    return "border-red-300 bg-red-50 text-red-700 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-300";
  }
  return "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-300";
}
