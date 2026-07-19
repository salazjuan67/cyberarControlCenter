import type { Moneda } from "@/types";

export type FinancePaymentMethod = "mp" | "transferencia";

export interface FinanceCurrencyTotals {
  total: number;
  by_method: Record<FinancePaymentMethod, number>;
  payments_count: {
    mp: number;
    transferencia: number;
    total: number;
  };
}

export interface FinanceParticipants {
  total: number;
  by_categoria: Record<string, number>;
  by_modalidad: Record<string, number>;
  by_categoria_modalidad: Record<string, number>;
}

export interface FinanceSummaryFilters {
  from: string | null;
  to: string | null;
  include_test: boolean;
}

export interface FinanceSummary {
  ok: true;
  generated_at: string;
  filters: FinanceSummaryFilters;
  currency_totals: Partial<Record<Moneda, FinanceCurrencyTotals>>;
  participants: FinanceParticipants;
  synced_at?: string;
}

export interface FinanceSummaryFetchOptions {
  from?: string;
  to?: string;
  includeTest?: boolean;
}

export interface FinanceSummarySyncResult {
  summary: FinanceSummary | null;
  source: "api" | "cache";
  error?: string;
}
