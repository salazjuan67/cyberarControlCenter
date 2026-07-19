import type { Moneda } from "@/types";

export const MONEDA_LABELS: Record<Moneda, string> = {
  USD: "USD",
  ARS: "ARS",
  EUR: "EUR",
};

export function formatCurrency(
  amount: number,
  currency: Moneda | string = "USD",
  compact = false
): string {
  const code = currency === "ARS" || currency === "EUR" || currency === "USD"
    ? currency
    : "USD";

  if (compact && Math.abs(amount) >= 1000) {
    const k = amount / 1000;
    return `${code} ${k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)}K`;
  }
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: code,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatPercent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return "-";
  return new Date(dateStr + "T00:00:00").toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("es-AR").format(value);
}

export function getResultadoColor(value: number): string {
  if (value > 0) return "text-emerald-400";
  if (value < 0) return "text-red-400";
  return "text-slate-400";
}

export function getDesvioColor(percent: number): string {
  if (percent <= 0) return "text-emerald-400";
  if (percent <= 10) return "text-yellow-400";
  return "text-red-400";
}

/** Suma importes agrupados por moneda */
export function sumByMoneda<T extends { moneda: Moneda }>(
  items: T[],
  getAmount: (item: T) => number
): Partial<Record<Moneda, number>> {
  return items.reduce<Partial<Record<Moneda, number>>>((acc, item) => {
    const amount = getAmount(item);
    if (amount === 0) return acc;
    acc[item.moneda] = (acc[item.moneda] ?? 0) + amount;
    return acc;
  }, {});
}

/** Formatea totales por moneda para footers de tablas */
export function formatTotalsByMoneda(
  totals: Partial<Record<Moneda, number>>
): string {
  const entries = (Object.entries(totals) as [Moneda, number][]).filter(
    ([, v]) => v !== 0
  );
  if (entries.length === 0) return "—";
  return entries.map(([m, v]) => formatCurrency(v, m)).join(" · ");
}
