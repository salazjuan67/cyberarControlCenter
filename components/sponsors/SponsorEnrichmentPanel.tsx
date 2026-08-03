"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Check,
  ExternalLink,
  Loader2,
  Mail,
  ScanSearch,
  Sparkles,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useStore } from "@/store/useStore";
import { fetchAllData } from "@/app/actions/data";
import {
  approveProposedEmail,
  getEnrichmentStats,
  getHunterStatus,
  rejectProposedEmail,
  scanSponsorEmails,
  scanSponsorEmailsWithHunter,
  type EnrichmentStats,
  type HunterStatus,
  type ScanResult,
} from "@/app/actions/sponsor-enrichment";
import { extractWebsiteFromNotas } from "@/lib/sponsors/website-parser";
import { parseHunterSourceUrl } from "@/lib/sponsors/hunter";
import type { Sponsor } from "@/types";

export function SponsorEnrichmentPanel() {
  const { sponsors, hydrate } = useStore();
  const [stats, setStats] = useState<EnrichmentStats | null>(null);
  const [hunterStatus, setHunterStatus] = useState<HunterStatus | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [scanProvider, setScanProvider] = useState<"scraper" | "hunter" | null>(null);
  const [lastScan, setLastScan] = useState<ScanResult | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pending = useMemo(
    () => sponsors.filter((s) => s.proposedEmail.trim() && !s.email.trim()),
    [sponsors]
  );

  const refreshAll = useCallback(async () => {
    const [nextStats, hunter, data] = await Promise.all([
      getEnrichmentStats(),
      getHunterStatus(),
      fetchAllData(),
    ]);
    setStats(nextStats);
    setHunterStatus(hunter);
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
    Promise.all([getEnrichmentStats(), getHunterStatus()])
      .then(([nextStats, hunter]) => {
        setStats(nextStats);
        setHunterStatus(hunter);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoadingStats(false));
  }, [sponsors.length]);

  useEffect(() => {
    if (!scanning) return;

    const interval = setInterval(() => {
      refreshAll().catch(() => {});
    }, 4000);

    return () => clearInterval(interval);
  }, [scanning, refreshAll]);

  async function handleScan(provider: "scraper" | "hunter") {
    setScanning(true);
    setScanProvider(provider);
    setError(null);
    try {
      const result =
        provider === "hunter"
          ? await scanSponsorEmailsWithHunter(25)
          : await scanSponsorEmails(25);
      setLastScan(result);
      await refreshAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al escanear");
    } finally {
      setScanning(false);
      setScanProvider(null);
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
              Buscá emails con Hunter.io (recomendado) o escaneá el sitio oficial. Las propuestas
              requieren revisión manual antes de guardarse en el CRM.
            </p>
            {hunterStatus?.configured && (
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-2 font-mono">
                Hunter: {hunterStatus.planName ?? "activo"}
                {typeof hunterStatus.searchesAvailable === "number"
                  ? ` · ${hunterStatus.searchesAvailable} búsquedas disponibles`
                  : ""}
              </p>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-2 shrink-0">
            <Button
              onClick={() => handleScan("hunter")}
              disabled={scanning || !hunterStatus?.configured || (stats?.scannable ?? 0) === 0}
              className="bg-violet-600 hover:bg-violet-500 text-white font-semibold"
            >
              {scanning && scanProvider === "hunter" ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Hunter…
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Hunter (25)
                </>
              )}
            </Button>
            <Button
              onClick={() => handleScan("scraper")}
              disabled={scanning || (stats?.scannable ?? 0) === 0}
              variant="outline"
              className="border-slate-300 dark:border-slate-700"
            >
              {scanning && scanProvider === "scraper" ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Escaneando…
                </>
              ) : (
                <>
                  <ScanSearch className="w-4 h-4 mr-2" />
                  Sitio web (25)
                </>
              )}
            </Button>
          </div>
        </div>

        {!hunterStatus?.configured && (
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-3">
            Hunter.io no configurado. Agregá HUNTER_API_KEY en las variables de entorno.
          </p>
        )}

        {hunterStatus?.error && (
          <p className="text-xs text-red-500 mt-3">{hunterStatus.error}</p>
        )}

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

        {scanning && stats && (
          <p className="text-xs text-cyan-600 dark:text-cyan-400 mt-3">
            {scanProvider === "hunter" ? "Hunter" : "Escaneo web"} en curso — {stats.pendingReview}{" "}
            propuesta{stats.pendingReview === 1 ? "" : "s"} detectada
            {stats.pendingReview === 1 ? "" : "s"} hasta ahora. La lista se actualiza automáticamente.
          </p>
        )}

        {lastScan && !scanning && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 font-mono">
            Último {lastScan.provider === "hunter" ? "Hunter" : "escaneo web"}: {lastScan.scanned}{" "}
            procesados · {lastScan.found} propuestas · {lastScan.errors.length} sin resultado
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
  const hunter = parseHunterSourceUrl(sponsor.emailSourceUrl);

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
          {hunter.isHunter && (
            <Badge className="text-[10px] bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300 border-violet-200 dark:border-violet-500/30">
              Hunter{hunter.confidence ? ` ${hunter.confidence}%` : ""}
            </Badge>
          )}
          {!hunter.isHunter && sponsor.emailSourceUrl && (
            <Badge variant="outline" className="text-[10px]">
              Sitio web
            </Badge>
          )}
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
          {hunter.webUrl ? (
            <a
              href={hunter.webUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-slate-500 hover:text-violet-500 inline-flex items-center gap-1"
            >
              Hunter <ExternalLink className="w-3 h-3" />
            </a>
          ) : sponsor.emailSourceUrl && !hunter.isHunter ? (
            <a
              href={sponsor.emailSourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-slate-500 hover:text-cyan-500 inline-flex items-center gap-1"
            >
              Fuente <ExternalLink className="w-3 h-3" />
            </a>
          ) : null}
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
