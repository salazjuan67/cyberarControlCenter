"use client";

import type { NewsletterDeliveryStatus } from "@/types/newsletter";

const STATUS_LABELS: Record<NewsletterDeliveryStatus, string> = {
  pending: "Pendiente",
  sent: "Enviado",
  delivered: "Entregado",
  bounced: "Rebotado",
  failed: "Fallido",
  delayed: "Demorado",
};

const STATUS_CLASSES: Record<NewsletterDeliveryStatus, string> = {
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300",
  sent: "bg-cyan-100 text-cyan-800 dark:bg-cyan-500/15 dark:text-cyan-300",
  delivered: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300",
  bounced: "bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-300",
  failed: "bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-300",
  delayed: "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300",
};

export function formatNewsletterDate(value: string): string {
  if (!value) return "—";
  return new Date(value).toLocaleString("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function DeliveryStatusBadge({ status }: { status: NewsletterDeliveryStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${STATUS_CLASSES[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

export const AUDIENCE_LABELS: Record<string, string> = {
  all_sponsors: "Todos los sponsors",
  confirmed_sponsors: "Solo confirmados",
};
