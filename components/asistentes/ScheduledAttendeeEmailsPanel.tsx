"use client";

import { useCallback, useEffect, useState } from "react";
import { CalendarClock, Loader2, RefreshCw, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  cancelScheduledAttendeeEmail,
  getScheduledAttendeeEmailCampaigns,
} from "@/app/actions/attendee-email";
import { formatNewsletterDate } from "@/lib/newsletter/display";
import type { AttendeeEmailCampaign } from "@/types/asistentes";

const AUDIENCE_LABELS: Record<string, string> = {
  all: "Todos con email",
  with_email: "Todos con email",
  interested: "En pipeline",
  bairescode: "Base BairesCode",
  not_registered_safe: "No inscriptos · sin rebotes",
  registered_confirmed: "Todos los inscriptos",
  registered_pending: "Inscripción pendiente",
  registered_rejected: "Inscripción rechazada",
};

interface ScheduledAttendeeEmailsPanelProps {
  refreshKey: number;
  onResult: (message: string | null, error: string | null) => void;
}

export function ScheduledAttendeeEmailsPanel({
  refreshKey,
  onResult,
}: ScheduledAttendeeEmailsPanelProps) {
  const [campaigns, setCampaigns] = useState<AttendeeEmailCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      setCampaigns(await getScheduledAttendeeEmailCampaigns());
    } catch (err) {
      onResult(null, err instanceof Error ? err.message : "No se pudieron cargar los programados");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [onResult]);

  useEffect(() => {
    refresh();
  }, [refresh, refreshKey]);

  async function handleCancel(campaign: AttendeeEmailCampaign) {
    if (
      !window.confirm(
        `¿Cancelar “${campaign.subject}” para ${campaign.totalRecipients} destinatario(s)?`
      )
    ) {
      return;
    }
    setCancellingId(campaign.id);
    const result = await cancelScheduledAttendeeEmail(campaign.id);
    if (result.ok) {
      onResult(`Programación cancelada para ${result.cancelled} email(s).`, null);
      await refresh();
    } else {
      onResult(
        null,
        result.errors.join(" · ") ||
          `Se cancelaron ${result.cancelled}; ${result.failed} no pudieron cancelarse.`
      );
    }
    setCancellingId(null);
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <CalendarClock className="h-4 w-4 text-amber-500" />
          <div>
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              Programados
            </h3>
            <p className="text-xs text-slate-500">
              Campañas que Resend enviará automáticamente.
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={refresh}
          disabled={refreshing}
          className="gap-2"
        >
          {refreshing ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5" />
          )}
          Actualizar
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-8 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Cargando programados...
        </div>
      ) : campaigns.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-200 px-4 py-8 text-center dark:border-slate-700">
          <CalendarClock className="mx-auto mb-2 h-6 w-6 text-slate-300 dark:text-slate-600" />
          <p className="text-sm text-slate-500">No hay newsletters programados.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {campaigns.map((campaign) => (
            <article
              key={campaign.id}
              className="flex flex-col gap-3 rounded-lg border border-amber-200 bg-amber-50/60 p-4 dark:border-amber-500/20 dark:bg-amber-500/5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                  {campaign.subject}
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {formatNewsletterDate(campaign.scheduledFor)} ·{" "}
                  {AUDIENCE_LABELS[campaign.audience] ?? campaign.audience} ·{" "}
                  {campaign.totalRecipients} destinatario(s)
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleCancel(campaign)}
                disabled={cancellingId === campaign.id}
                className="shrink-0 gap-2 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-500/30 dark:text-red-300"
              >
                {cancellingId === campaign.id ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <XCircle className="h-3.5 w-3.5" />
                )}
                Cancelar
              </Button>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
