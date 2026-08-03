"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { BarChart3, ChevronDown, ChevronUp, History, Loader2, RefreshCw, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getNewsletterCampaignDetail,
  getNewsletterCampaigns,
} from "@/app/actions/newsletter";
import {
  AUDIENCE_LABELS,
  DeliveryStatusBadge,
  formatNewsletterDate,
} from "@/lib/newsletter/display";
import type {
  NewsletterCampaign,
  NewsletterCampaignDetail,
  NewsletterDeliveryRow,
} from "@/types/newsletter";

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

function RecipientTable({
  deliveries,
  query,
}: {
  deliveries: NewsletterDeliveryRow[];
  query: string;
}) {
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return deliveries;
    return deliveries.filter(
      (d) =>
        d.empresa.toLowerCase().includes(q) ||
        d.recipientEmail.toLowerCase().includes(q) ||
        d.recipientName.toLowerCase().includes(q)
    );
  }, [deliveries, query]);

  if (filtered.length === 0) {
    return (
      <p className="text-sm text-slate-500 dark:text-slate-400 py-6 text-center">
        {query ? "Ningún destinatario coincide con la búsqueda." : "Sin destinatarios registrados."}
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-50 dark:bg-slate-900/80 text-left text-[10px] uppercase tracking-wide text-slate-400">
            <th className="px-3 py-2 font-medium">Empresa</th>
            <th className="px-3 py-2 font-medium">Email</th>
            <th className="px-3 py-2 font-medium">Estado</th>
            <th className="px-3 py-2 font-medium hidden md:table-cell">Enviado</th>
            <th className="px-3 py-2 font-medium hidden lg:table-cell">Entregado</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {filtered.map((row) => (
            <tr key={row.id} className="text-slate-700 dark:text-slate-300">
              <td className="px-3 py-2.5">
                <p className="font-medium text-slate-800 dark:text-slate-200">{row.empresa}</p>
                {row.recipientName && row.recipientName !== row.empresa && (
                  <p className="text-xs text-slate-400">{row.recipientName}</p>
                )}
              </td>
              <td className="px-3 py-2.5 font-mono text-xs">{row.recipientEmail}</td>
              <td className="px-3 py-2.5">
                <DeliveryStatusBadge status={row.status} />
                {row.bounceReason && (
                  <p className="text-[10px] text-red-500 mt-1 max-w-[180px] truncate" title={row.bounceReason}>
                    {row.bounceReason}
                  </p>
                )}
              </td>
              <td className="px-3 py-2.5 text-xs text-slate-500 hidden md:table-cell">
                {formatNewsletterDate(row.sentAt)}
              </td>
              <td className="px-3 py-2.5 text-xs text-slate-500 hidden lg:table-cell">
                {formatNewsletterDate(row.deliveredAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function NewsletterTrackingPanel() {
  const [campaigns, setCampaigns] = useState<NewsletterCampaign[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<NewsletterCampaignDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recipientQuery, setRecipientQuery] = useState("");
  const [showRecipients, setShowRecipients] = useState(true);

  const loadDetail = useCallback(async (campaignId: string) => {
    setLoadingDetail(true);
    try {
      const nextDetail = await getNewsletterCampaignDetail(campaignId);
      setDetail(nextDetail);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cargar el envío");
    } finally {
      setLoadingDetail(false);
    }
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
        await loadDetail(activeId);
      } else {
        setDetail(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cargar el historial");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [loadDetail, selectedId]);

  useEffect(() => {
    refresh();
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    setRecipientQuery("");
    loadDetail(selectedId);
  }, [selectedId, loadDetail]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 py-8 justify-center">
        <Loader2 className="w-4 h-4 animate-spin" />
        Cargando historial de envíos...
      </div>
    );
  }

  if (campaigns.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-8 text-center text-sm text-slate-500 dark:text-slate-400">
        Todavía no hay envíos masivos registrados. El historial aparece después del primer envío.
      </div>
    );
  }

  const stats = detail?.stats;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            <h3 className="text-slate-700 dark:text-slate-200 font-semibold text-sm">
              Historial de envíos masivos
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {campaigns.length} campaña(s) · destinatarios y estado de entrega por envío.
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
            className={`rounded-lg px-3 py-2 text-left border transition-colors min-w-[200px] ${
              selectedId === campaign.id
                ? "border-cyan-300 dark:border-cyan-500/40 bg-cyan-50 dark:bg-cyan-500/10"
                : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50"
            }`}
          >
            <p className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate max-w-[260px]">
              {campaign.subject}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">
              {formatNewsletterDate(campaign.createdAt)} · {campaign.totalRecipients} dest.
            </p>
            <p className="text-[10px] text-slate-400 font-mono mt-0.5">{campaign.id}</p>
          </button>
        ))}
      </div>

      {detail && (
        <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 p-4 space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                {detail.campaign.subject}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {formatNewsletterDate(detail.campaign.createdAt)} ·{" "}
                {AUDIENCE_LABELS[detail.campaign.audience] ?? detail.campaign.audience} ·{" "}
                {detail.campaign.fromEmail}
              </p>
              <p className="text-[10px] text-slate-400 font-mono mt-1">ID: {detail.campaign.id}</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <BarChart3 className="w-3.5 h-3.5" />
              Métricas vía webhook Resend
            </div>
          </div>

          {loadingDetail ? (
            <div className="flex items-center gap-2 text-sm text-slate-500 py-4">
              <Loader2 className="w-4 h-4 animate-spin" />
              Cargando destinatarios...
            </div>
          ) : stats ? (
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
          ) : null}

          <div className="space-y-3">
            <button
              type="button"
              onClick={() => setShowRecipients((v) => !v)}
              className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200"
            >
              {showRecipients ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
              Destinatarios ({detail.deliveries.length})
            </button>

            {showRecipients && (
              <>
                <div className="relative max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <Input
                    value={recipientQuery}
                    onChange={(e) => setRecipientQuery(e.target.value)}
                    placeholder="Buscar empresa o email..."
                    className="pl-9 h-9 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-sm"
                  />
                </div>
                <RecipientTable deliveries={detail.deliveries} query={recipientQuery} />
              </>
            )}
          </div>
        </div>
      )}

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
