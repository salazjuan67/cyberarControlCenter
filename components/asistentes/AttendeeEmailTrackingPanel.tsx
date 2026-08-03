"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { History, Loader2, RefreshCw, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getAttendeeEmailCampaignDetail,
  getAttendeeEmailCampaigns,
} from "@/app/actions/attendee-email";
import { DeliveryStatusBadge, formatNewsletterDate } from "@/lib/newsletter/display";
import type { AttendeeEmailCampaign, AttendeeEmailCampaignDetail, AttendeeEmailDeliveryRow } from "@/types/asistentes";

const AUDIENCE_LABELS: Record<string, string> = {
  all: "Todos con email",
  with_email: "Todos con email",
  interested: "En pipeline",
};

function RecipientTable({ deliveries, query }: { deliveries: AttendeeEmailDeliveryRow[]; query: string }) {
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return deliveries;
    return deliveries.filter(
      (d) =>
        d.organizacion.toLowerCase().includes(q) ||
        d.recipientEmail.toLowerCase().includes(q) ||
        d.recipientName.toLowerCase().includes(q)
    );
  }, [deliveries, query]);

  if (filtered.length === 0) {
    return <p className="text-sm text-slate-500 py-6 text-center">Sin destinatarios.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-50 dark:bg-slate-900/80 text-left text-[10px] uppercase text-slate-400">
            <th className="px-3 py-2">Nombre</th>
            <th className="px-3 py-2">Email</th>
            <th className="px-3 py-2">Estado</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {filtered.map((row) => (
            <tr key={row.id}>
              <td className="px-3 py-2.5">
                <p className="font-medium text-slate-800 dark:text-slate-200">{row.recipientName}</p>
                <p className="text-xs text-slate-400">{row.organizacion}</p>
              </td>
              <td className="px-3 py-2.5 font-mono text-xs">{row.recipientEmail}</td>
              <td className="px-3 py-2.5"><DeliveryStatusBadge status={row.status} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function AttendeeEmailTrackingPanel() {
  const [campaigns, setCampaigns] = useState<AttendeeEmailCampaign[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<AttendeeEmailCampaignDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [recipientQuery, setRecipientQuery] = useState("");

  const loadDetail = useCallback(async (id: string) => {
    setDetail(await getAttendeeEmailCampaignDetail(id));
  }, []);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    const next = await getAttendeeEmailCampaigns();
    setCampaigns(next);
    const activeId = selectedId ?? next[0]?.id ?? null;
    if (activeId) {
      setSelectedId(activeId);
      await loadDetail(activeId);
    } else setDetail(null);
    setLoading(false);
    setRefreshing(false);
  }, [loadDetail, selectedId]);

  useEffect(() => { refresh(); }, []);
  useEffect(() => {
    if (selectedId) {
      setRecipientQuery("");
      loadDetail(selectedId);
    }
  }, [selectedId, loadDetail]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-500 py-8 justify-center">
        <Loader2 className="w-4 h-4 animate-spin" /> Cargando historial...
      </div>
    );
  }

  if (campaigns.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-8 text-center text-sm text-slate-500">
        El historial de envíos a asistentes aparece después del primer envío masivo.
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-violet-500" />
          <h3 className="font-semibold text-sm">Historial de envíos a asistentes</h3>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={refresh} disabled={refreshing} className="gap-2">
          {refreshing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
          Actualizar
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {campaigns.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setSelectedId(c.id)}
            className={`rounded-lg px-3 py-2 text-left border min-w-[200px] ${
              selectedId === c.id
                ? "border-violet-300 bg-violet-50 dark:bg-violet-500/10"
                : "border-slate-200 dark:border-slate-700"
            }`}
          >
            <p className="text-xs font-medium truncate max-w-[240px]">{c.subject}</p>
            <p className="text-[10px] text-slate-400">{formatNewsletterDate(c.createdAt)} · {c.totalRecipients} dest.</p>
          </button>
        ))}
      </div>

      {detail && (
        <div className="space-y-3 rounded-lg border p-4 bg-slate-50/50 dark:bg-slate-900/40">
          <p className="text-sm font-semibold">{detail.campaign.subject}</p>
          <p className="text-xs text-slate-500">
            {formatNewsletterDate(detail.campaign.createdAt)} · {AUDIENCE_LABELS[detail.campaign.audience]} · {detail.campaign.fromEmail}
          </p>
          <p className="text-xs text-slate-500">
            Enviados: {detail.stats.sent} · Entregados: {detail.stats.delivered} · Rebotados: {detail.stats.bounced}
          </p>
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <Input value={recipientQuery} onChange={(e) => setRecipientQuery(e.target.value)} placeholder="Buscar..." className="pl-9 h-9 text-sm" />
          </div>
          <RecipientTable deliveries={detail.deliveries} query={recipientQuery} />
        </div>
      )}
    </div>
  );
}
