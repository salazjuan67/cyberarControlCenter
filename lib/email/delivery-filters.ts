export type DeliveryStatFilter =
  | "all"
  | "sent"
  | "delivered"
  | "bounced"
  | "failed"
  | "pending"
  | "opened";

export interface DeliveryFilterRow {
  status: string;
  openedAt?: string;
}

export function matchesDeliveryFilter(
  delivery: DeliveryFilterRow,
  filter: DeliveryStatFilter
): boolean {
  switch (filter) {
    case "all":
      return true;
    case "sent":
      return ["sent", "delivered", "bounced", "delayed"].includes(delivery.status);
    case "delivered":
      return delivery.status === "delivered";
    case "bounced":
      return delivery.status === "bounced";
    case "failed":
      return delivery.status === "failed";
    case "pending":
      return ["pending", "sent", "delayed"].includes(delivery.status);
    case "opened":
      return Boolean(delivery.openedAt);
  }
}

export const DELIVERY_FILTER_LABELS: Record<DeliveryStatFilter, string> = {
  all: "Total",
  sent: "Enviados",
  delivered: "Entregados",
  bounced: "Rebotados",
  failed: "Fallidos",
  pending: "Pendientes",
  opened: "Abiertos",
};
