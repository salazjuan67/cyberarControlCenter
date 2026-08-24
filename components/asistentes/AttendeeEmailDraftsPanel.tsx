"use client";

import { useCallback, useEffect, useState } from "react";
import { FileEdit, Loader2, Pencil, RefreshCw } from "lucide-react";
import { getAttendeeEmailDrafts } from "@/app/actions/attendee-email";
import { Button } from "@/components/ui/button";
import type { AttendeeEmailDraft } from "@/types/asistentes";

const recommendedDateFormatter = new Intl.DateTimeFormat("es-AR", {
  timeZone: "America/Argentina/Buenos_Aires",
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

interface AttendeeEmailDraftsPanelProps {
  activeDraftId: string | null;
  refreshKey: number;
  onEdit: (draft: AttendeeEmailDraft) => void;
  onError: (message: string) => void;
}

export function AttendeeEmailDraftsPanel({
  activeDraftId,
  refreshKey,
  onEdit,
  onError,
}: AttendeeEmailDraftsPanelProps) {
  const [drafts, setDrafts] = useState<AttendeeEmailDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      setDrafts(await getAttendeeEmailDrafts());
    } catch (err) {
      onError(err instanceof Error ? err.message : "No se pudieron cargar los borradores");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [onError]);

  useEffect(() => {
    let active = true;
    getAttendeeEmailDrafts()
      .then((nextDrafts) => {
        if (!active) return;
        setDrafts(nextDrafts);
        setLoading(false);
      })
      .catch((err) => {
        if (!active) return;
        setLoading(false);
        onError(err instanceof Error ? err.message : "No se pudieron cargar los borradores");
      });
    return () => {
      active = false;
    };
  }, [onError, refreshKey]);

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <FileEdit className="h-4 w-4 text-cyan-500" />
          <div>
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              Borradores
            </h3>
            <p className="text-xs text-slate-500">
              Secuencia editorial para potenciales no confirmados ni pagados.
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
          Cargando borradores...
        </div>
      ) : drafts.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-200 px-4 py-8 text-center dark:border-slate-700">
          <FileEdit className="mx-auto mb-2 h-6 w-6 text-slate-300 dark:text-slate-600" />
          <p className="text-sm text-slate-500">No hay borradores guardados.</p>
        </div>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {drafts.map((draft) => {
            const active = draft.id === activeDraftId;
            return (
              <article
                key={draft.id}
                className={`rounded-lg border p-4 transition-colors ${
                  active
                    ? "border-cyan-400 bg-cyan-50 ring-1 ring-cyan-200 dark:border-cyan-500/50 dark:bg-cyan-500/10 dark:ring-cyan-500/20"
                    : "border-slate-200 bg-slate-50/60 dark:border-slate-700 dark:bg-slate-800/40"
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-900 font-mono text-xs font-bold text-white dark:bg-cyan-500 dark:text-slate-950">
                    {String(draft.sortOrder).padStart(2, "0")}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                      {draft.name}
                    </p>
                    <p className="mt-1 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">
                      {draft.subject}
                    </p>
                    <p className="mt-2 text-[11px] font-medium text-cyan-700 dark:text-cyan-300">
                      Fecha recomendada:{" "}
                      {recommendedDateFormatter.format(new Date(draft.recommendedFor))}
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant={active ? "default" : "outline"}
                  size="sm"
                  onClick={() => onEdit(draft)}
                  className={`mt-3 w-full gap-2 ${
                    active ? "bg-cyan-600 text-white hover:bg-cyan-500" : ""
                  }`}
                >
                  <Pencil className="h-3.5 w-3.5" />
                  {active ? "Editando este borrador" : "Editar borrador"}
                </Button>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
