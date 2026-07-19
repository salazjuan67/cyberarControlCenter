"use client";

import { RefreshCw, CreditCard, Landmark, Users, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatNumber, MONEDA_LABELS } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import type { FinanceSummary } from "@/types/finance-summary";
import type { Moneda } from "@/types";

interface CyberarFinancePanelProps {
  summary: FinanceSummary | null;
  loading?: boolean;
  error?: string | null;
  configured?: boolean;
  onRefresh?: () => void;
  compact?: boolean;
}

function formatLabel(key: string): string {
  return key
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatCategoriaModalidad(key: string): string {
  const [categoria, modalidad] = key.split("|");
  const cat = categoria ? formatLabel(categoria) : "—";
  const mod = modalidad ? formatLabel(modalidad) : "—";
  return `${cat} · ${mod}`;
}

export function CyberarFinancePanel({
  summary,
  loading = false,
  error = null,
  configured = true,
  onRefresh,
  compact = false,
}: CyberarFinancePanelProps) {
  const currencies = summary
    ? (Object.keys(summary.currency_totals) as Moneda[])
    : [];

  const generatedAt = summary?.generated_at
    ? new Date(summary.generated_at).toLocaleString("es-AR")
    : null;
  const syncedAt = summary?.synced_at
    ? new Date(summary.synced_at).toLocaleString("es-AR")
    : null;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-cyan-200 dark:border-cyan-500/20 p-5 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono px-2 py-0.5 rounded border border-cyan-200 dark:border-cyan-500/30 text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-500/10">
              CYBER.AR
            </span>
            <h3 className="text-slate-800 dark:text-slate-100 font-semibold text-sm">
              Inscripciones — pagos aprobados
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Pull desde finance-summary · solo pagos aprobados
            {generatedAt && <> · generado {generatedAt}</>}
            {syncedAt && <> · sync {syncedAt}</>}
          </p>
        </div>
        {onRefresh && (
          <Button
            size="sm"
            variant="outline"
            onClick={onRefresh}
            disabled={loading || !configured}
            className="gap-1.5 shrink-0 border-slate-300 dark:border-slate-700"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
            Actualizar
          </Button>
        )}
      </div>

      {!configured && (
        <div className="flex items-start gap-2 rounded-lg border border-yellow-200 dark:border-yellow-500/30 bg-yellow-50 dark:bg-yellow-500/10 p-3 text-sm text-yellow-800 dark:text-yellow-200">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <p>
            Configurá <code className="text-xs">CYBERAR_FINANCE_API_KEY</code> en el servidor
            (Vercel / .env.local). La key no debe ir al frontend ni al repo.
          </p>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 p-3 text-sm text-red-700 dark:text-red-300">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <p>{error}{summary ? " — mostrando último snapshot guardado." : ""}</p>
        </div>
      )}

      {!summary && !loading && configured && !error && (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Sin datos todavía. Usá Actualizar para traer el resumen desde CYBER.AR.
        </p>
      )}

      {loading && !summary && (
        <p className="text-sm text-slate-500 dark:text-slate-400 animate-pulse">
          Sincronizando con CYBER.AR...
        </p>
      )}

      {summary && (
        <>
          <div className={cn("grid gap-4", compact ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-2")}>
            {currencies.map((moneda) => {
              const totals = summary.currency_totals[moneda]!;
              return (
                <div
                  key={moneda}
                  className="rounded-lg border border-slate-200 dark:border-slate-800 p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Totales {MONEDA_LABELS[moneda]}
                    </span>
                    <span className="text-lg font-bold text-slate-900 dark:text-white">
                      {formatCurrency(totals.total, moneda)}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-md bg-slate-50 dark:bg-slate-800/60 p-3">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-1">
                        <CreditCard className="w-3.5 h-3.5" />
                        Mercado Pago
                      </div>
                      <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm">
                        {formatCurrency(totals.by_method.mp, moneda)}
                      </p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                        {formatNumber(totals.payments_count.mp)} pagos
                      </p>
                    </div>
                    <div className="rounded-md bg-slate-50 dark:bg-slate-800/60 p-3">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-1">
                        <Landmark className="w-3.5 h-3.5" />
                        Transferencia
                      </div>
                      <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm">
                        {formatCurrency(totals.by_method.transferencia, moneda)}
                      </p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                        {formatNumber(totals.payments_count.transferencia)} pagos
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    {formatNumber(totals.payments_count.total)} pagos aprobados en total
                  </p>
                </div>
              );
            })}
          </div>

          <div className={cn("grid gap-4", compact ? "grid-cols-1" : "grid-cols-1 md:grid-cols-3")}>
            <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Participantes
                </span>
              </div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {formatNumber(summary.participants.total)}
              </p>
            </div>

            <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                Por categoría
              </p>
              <div className="space-y-1.5">
                {Object.entries(summary.participants.by_categoria)
                  .sort(([, a], [, b]) => b - a)
                  .map(([key, count]) => (
                    <div key={key} className="flex items-center justify-between text-sm">
                      <span className="text-slate-600 dark:text-slate-300">{formatLabel(key)}</span>
                      <span className="font-medium text-slate-900 dark:text-white">{formatNumber(count)}</span>
                    </div>
                  ))}
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                Por modalidad
              </p>
              <div className="space-y-1.5">
                {Object.entries(summary.participants.by_modalidad)
                  .sort(([, a], [, b]) => b - a)
                  .map(([key, count]) => (
                    <div key={key} className="flex items-center justify-between text-sm">
                      <span className="text-slate-600 dark:text-slate-300">{formatLabel(key)}</span>
                      <span className="font-medium text-slate-900 dark:text-white">{formatNumber(count)}</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {!compact && Object.keys(summary.participants.by_categoria_modalidad).length > 0 && (
            <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                Categoría × modalidad
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {Object.entries(summary.participants.by_categoria_modalidad)
                  .sort(([, a], [, b]) => b - a)
                  .map(([key, count]) => (
                    <div
                      key={key}
                      className="flex items-center justify-between rounded-md bg-slate-50 dark:bg-slate-800/60 px-3 py-2 text-sm"
                    >
                      <span className="text-slate-600 dark:text-slate-300 truncate pr-2">
                        {formatCategoriaModalidad(key)}
                      </span>
                      <span className="font-medium text-slate-900 dark:text-white shrink-0">
                        {formatNumber(count)}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
