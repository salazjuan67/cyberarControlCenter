"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Check,
  ExternalLink,
  Loader2,
  Mail,
  ScanSearch,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useStore } from "@/store/useStore";
import { fetchAllData } from "@/app/actions/data";
import {
  approveProposedEmail,
  getEnrichmentStats,
  rejectProposedEmail,
  scanSponsorEmails,
  type EnrichmentStats,
  type ScanResult,
} from "@/app/actions/sponsor-enrichment";
import { extractWebsiteFromNotas } from "@/lib/sponsors/website-parser";
import type { Sponsor } from "@/types";

export function SponsorEnrichmentPanel() {
  const { sponsors, hydrate } = useStore();
  const [stats, setStats] = useState<EnrichmentStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [lastScan, setLastScan] = useState<ScanResult | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pending = useMemo(
    () => sponsors.filter((s) => s.proposedEmail.trim() && !s.email.trim()),
    [sponsors]
  );

  const refreshAll = useCallback(async () => {
    const [nextStats, data] = await Promise.all([getEnrichmentStats(), fetchAllData()]);
    setStats(nextStats);
    hydrate({
      config: data.config,
      sponsors: data.sponsors,
      inscripciones: data.inscripciones,
      gastos: data.gastos,
      escenarios: data.escenarios,
    });
  }, [hydrate]);

  useEffect(() => {
    setLoadingStats(true);
    getEnrichmentStats()
      .then(setStats)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoadingStats(false));
  }, [sponsors.length]);

  async function handleScan() {
    setScanning(true);
    setError(null);
    try {
      const result = await scanSponsorEmails(25);
      setLastScan(result);
      await refreshAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al escanear");
    } finally {
      setScanning(false);
    }
  }

  async function handleApprove(id: string) {
    setActionId(id);
    setError(null);
    try {
      await approveProposedEmail(id);
      await refreshAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al aprobar");
    } finally {
      setActionId(null);
    }
  }

  async function handleReject(id: string) {
    setActionId(id);
    setError(null);
    try {
      await rejectProposedEmail(id);
      await refreshAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al rechazar");
    } finally {
      setActionId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-4 md:p-5">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Mail className="w-4 h-4 text-cyan-500" />
              Enriquecimiento de emails
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xl">
              Escanea el sitio oficial de cada sponsor (desde el campo notas) y propone un email
              para revisión manual. No se guarda en el CRM hasta que lo apruebes.
            </p>
          </div>
          <Button
            onClick={handleScan}
            disabled={scanning || (stats?.scannable ?? 0) === 0}
            className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold shrink-0"
          >
            {scanning ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <ScanSearch className="w-4 h-4 mr-2" />
            )}
            Escanear lote (25)
          </Button>
        </div>

        {loadingStats ? (
          <div className="flex items-center gap-2 text-sm text-slate-500 mt-4">
            <Loader2 className="w-4 h-4 animate-spin" />
            Cargando estadísticas...
          </div>
        ) : stats ? (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-4">
            <Stat label="Sin email" value={stats.withoutEmail} />
            <Stat label="Con sitio web" value={stats.withWebsite} />
            <Stat label="Escaneables" value={stats.scannable} accent="cyan" />
            <Stat label="Pendientes" value={stats.pendingReview} accent="yellow" />
            <Stat label="Con email" value={stats.withEmail} accent="emerald" />
          </div>
        ) : null}

        {lastScan && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 font-mono">
            Último escaneo: {lastScan.scanned} procesados · {lastScan.found} propuestas ·{" "}
            {lastScan.errors.length} sin resultado
          </p>
        )}

        {error && (
          <p className="text-xs text-red-500 mt-3">{error}</p>
        )}
      </div>

      {pending.length > 0 ? (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80">
            <h4 className="text-sm font-medium text-slate-800 dark:text-slate-200">
              Propuestas pendientes ({pending.length})
            </h4>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {pending.map((sponsor) => (
              <PendingRow
                key={sponsor.id}
                sponsor={sponsor}
                busy={actionId === sponsor.id}
                onApprove={() => handleApprove(sponsor.id)}
                onReject={() => handleReject(sponsor.id)}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-8 text-center text-sm text-slate-500 dark:text-slate-400">
          No hay propuestas pendientes. Ejecutá un escaneo para buscar emails en sitios oficiales.
        </div>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: "cyan" | "yellow" | "emerald";
}) {
  const color =
    accent === "cyan"
      ? "text-cyan-600 dark:text-cyan-400"
      : accent === "yellow"
        ? "text-amber-600 dark:text-amber-400"
        : accent === "emerald"
          ? "text-emerald-600 dark:text-emerald-400"
          : "text-slate-800 dark:text-slate-200";

  return (
    <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 px-3 py-2">
      <p className="text-[10px] uppercase tracking-wide text-slate-400">{label}</p>
      <p className={`text-lg font-semibold tabular-nums ${color}`}>{value}</p>
    </div>
  );
}

function PendingRow({
  sponsor,
  busy,
  onApprove,
  onReject,
}: {
  sponsor: Sponsor;
  busy: boolean;
  onApprove: () => void;
  onReject: () => void;
}) {
  const website = extractWebsiteFromNotas(sponsor.notas);

  return (
    <div className="px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
          {sponsor.empresa}
        </p>
        <p className="text-sm text-cyan-600 dark:text-cyan-400 font-mono truncate">
          {sponsor.proposedEmail}
        </p>
        <div className="flex flex-wrap items-center gap-2 mt-1">
          {sponsor.region && (
            <Badge variant="outline" className="text-[10px]">
              {sponsor.region}
            </Badge>
          )}
          {website && (
            <a
              href={website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-slate-500 hover:text-cyan-500 inline-flex items-center gap-1"
            >
              Sitio <ExternalLink className="w-3 h-3" />
            </a>
          )}
          {sponsor.emailSourceUrl && (
            <a
              href={sponsor.emailSourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-slate-500 hover:text-cyan-500 inline-flex items-center gap-1"
            >
              Fuente <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Button
          size="sm"
          variant="outline"
          disabled={busy}
          onClick={onReject}
          className="h-8"
        >
          {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
          <span className="ml-1.5 hidden sm:inline">Rechazar</span>
        </Button>
        <Button
          size="sm"
          disabled={busy}
          onClick={onApprove}
          className="h-8 bg-emerald-600 hover:bg-emerald-500 text-white"
        >
          {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
          <span className="ml-1.5 hidden sm:inline">Aprobar</span>
        </Button>
      </div>
    </div>
  );
}
