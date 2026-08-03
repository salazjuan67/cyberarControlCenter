"use client";

import { useCallback, useEffect, useState } from "react";
import { BarChart3, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getNewsletterCampaignStats,
  getNewsletterCampaigns,
} from "@/app/actions/newsletter";
import type { NewsletterCampaign, NewsletterCampaignStats } from "@/types/newsletter";

function formatDate(value: string): string {
  if (!value) return "—";
  return new Date(value).toLocaleString("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StatBox({
  label,
  value,
  accent,
}: {
  label: string;
  value: number | string;
  accent?: "emerald" | "amber" | "red" | "cyan";
}) {
  const color =
    accent === "emerald"
      ? "text-emerald-600 dark:text-emerald-400"
      : accent === "amber"
        ? "text-amber-600 dark:text-amber-400"
        : accent === "red"
          ? "text-red-600 dark:text-red-400"
          : accent === "cyan"
            ? "text-cyan-600 dark:text-cyan-400"
            : "text-slate-800 dark:text-slate-200";

  return (
    <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 px-3 py-2">
      <p className="text-[10px] uppercase tracking-wide text-slate-400">{label}</p>
      <p className={`text-lg font-semibold tabular-nums ${color}`}>{value}</p>
    </div>
  );
}

export function NewsletterTrackingPanel() {
  const [campaigns, setCampaigns] = useState<NewsletterCampaign[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [stats, setStats] = useState<NewsletterCampaignStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(async (campaignId: string) => {
    const nextStats = await getNewsletterCampaignStats(campaignId);
    setStats(nextStats);
  }, []);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    setError(null);
    try {
      const nextCampaigns = await getNewsletterCampaigns();
      setCampaigns(nextCampaigns);

      const activeId = selectedId ?? nextCampaigns[0]?.id ?? null;
      if (activeId) {
        setSelectedId(activeId);
        await loadStats(activeId);
      } else {
        setStats(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron cargar métricas");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [loadStats, selectedId]);

  useEffect(() => {
    refresh();
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    loadStats(selectedId).catch((err: Error) => setError(err.message));
  }, [selectedId, loadStats]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 py-8 justify-center">
        <Loader2 className="w-4 h-4 animate-spin" />
        Cargando métricas de envío...
      </div>
    );
  }

  if (campaigns.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-8 text-center text-sm text-slate-500 dark:text-slate-400">
        Todavía no hay campañas registradas. Las métricas aparecen después del primer envío masivo.
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            <h3 className="text-slate-700 dark:text-slate-200 font-semibold text-sm">
              Métricas de entrega
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Entregados y rebotados se actualizan vía webhook de Resend.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={refresh}
          disabled={refreshing}
          className="gap-2 border-slate-300 dark:border-slate-700"
        >
          {refreshing ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <RefreshCw className="w-3.5 h-3.5" />
          )}
          Actualizar
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {campaigns.map((campaign) => (
          <button
            key={campaign.id}
            type="button"
            onClick={() => setSelectedId(campaign.id)}
            className={`rounded-lg px-3 py-2 text-left border transition-colors ${
              selectedId === campaign.id
                ? "border-cyan-300 dark:border-cyan-500/40 bg-cyan-50 dark:bg-cyan-500/10"
                : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50"
            }`}
          >
            <p className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate max-w-[220px]">
              {campaign.subject}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">{formatDate(campaign.createdAt)}</p>
          </button>
        ))}
      </div>

      {stats && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <StatBox label="Total" value={stats.total} />
            <StatBox label="Enviados" value={stats.sent} accent="cyan" />
            <StatBox label="Entregados" value={stats.delivered} accent="emerald" />
            <StatBox label="Rebotados" value={stats.bounced} accent="red" />
            <StatBox label="Fallidos" value={stats.failed} accent="red" />
            <StatBox label="Pendientes" value={stats.pending} accent="amber" />
          </div>

          <div className="flex flex-wrap gap-4 text-sm text-slate-600 dark:text-slate-300">
            <span>
              Tasa de entrega:{" "}
              <strong className="text-emerald-600 dark:text-emerald-400">
                {stats.deliveryRate}%
              </strong>
            </span>
            <span>
              Tasa de rebote:{" "}
              <strong className="text-red-600 dark:text-red-400">{stats.bounceRate}%</strong>
            </span>
          </div>
        </>
      )}

      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}

      <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-relaxed">
        Configurá el webhook en Resend apuntando a{" "}
        <code className="font-mono">/api/webhooks/resend</code> con eventos{" "}
        <code className="font-mono">email.sent</code>,{" "}
        <code className="font-mono">email.delivered</code>,{" "}
        <code className="font-mono">email.bounced</code> y{" "}
        <code className="font-mono">email.failed</code>. Agregá{" "}
        <code className="font-mono">RESEND_WEBHOOK_SECRET</code> en Vercel.
      </p>
    </div>
  );
}
