"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertCircle, CalendarClock, Loader2, Mail, Send, Sparkles, Users } from "lucide-react";
import { useStore } from "@/store/useStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  getAttendeeEmailStatus,
  previewAttendeeEmailRecipients,
  scheduleAttendeeEmail,
  sendAttendeeEmail,
  sendAttendeeTestEmail,
} from "@/app/actions/attendee-email";
import { NewsletterHtmlPreview } from "@/components/newsletter/NewsletterHtmlPreview";
import { AttendeeEmailTrackingPanel } from "@/components/asistentes/AttendeeEmailTrackingPanel";
import { ScheduledAttendeeEmailsPanel } from "@/components/asistentes/ScheduledAttendeeEmailsPanel";
import { buildRegisteredAttendeeSocialTemplate } from "@/lib/asistentes/registered-social-template";
import type { AttendeeEmailAudience } from "@/types/asistentes";

const inputCls = "bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-200";
const selectContentCls = "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700";
const selectItemCls = "text-slate-700 dark:text-slate-200 focus:bg-slate-100 dark:focus:bg-slate-700";

const audienceLabels: Record<AttendeeEmailAudience, string> = {
  all: "Todos con email",
  with_email: "Todos con email",
  interested: "En pipeline (Lead → Interesado)",
  bairescode: "Base BairesCode",
  not_registered_safe: "No inscriptos · excluir rebotes",
  registered_confirmed: "Todos los inscriptos",
  registered_pending: "Inscripción pendiente",
  registered_rejected: "Inscripción rechazada",
};

export function AttendeeEmailPanel() {
  const { asistentesPotenciales } = useStore();
  const [configured, setConfigured] = useState(false);
  const [fromEmail, setFromEmail] = useState<string | null>(null);
  const [fromEmailWarning, setFromEmailWarning] = useState<string | null>(null);
  const [audience, setAudience] = useState<AttendeeEmailAudience>("interested");
  const [recipientCount, setRecipientCount] = useState(0);
  const [skippedCount, setSkippedCount] = useState(0);
  const [subject, setSubject] = useState("");
  const [html, setHtml] = useState("");
  const [testEmail, setTestEmail] = useState("");
  const [scheduledFor, setScheduledFor] = useState("");
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const [sending, setSending] = useState(false);
  const [scheduling, setScheduling] = useState(false);
  const [scheduledRefreshKey, setScheduledRefreshKey] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refreshRecipients = useCallback(async (nextAudience: AttendeeEmailAudience) => {
    setLoadingPreview(true);
    try {
      const preview = await previewAttendeeEmailRecipients(nextAudience);
      setRecipientCount(preview.recipients.length);
      setSkippedCount(preview.skipped);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cargar destinatarios");
    } finally {
      setLoadingPreview(false);
    }
  }, []);

  useEffect(() => {
    getAttendeeEmailStatus().then((status) => {
      setConfigured(status.configured && !status.fromEmailWarning);
      setFromEmail(status.fromEmail);
      setFromEmailWarning(status.fromEmailWarning);
    });
  }, []);

  useEffect(() => {
    refreshRecipients(audience);
  }, [audience, asistentesPotenciales.length, refreshRecipients]);

  useEffect(() => {
    if (message || error) window.scrollTo({ top: 0, behavior: "smooth" });
  }, [message, error]);

  const handleScheduledResult = useCallback(
    (nextMessage: string | null, nextError: string | null) => {
      setMessage(nextMessage);
      setError(nextError);
    },
    []
  );

  function handleGenerateTemplate() {
    if (
      html.trim() &&
      !window.confirm("Esto reemplazará el asunto y el HTML actual. ¿Querés continuar?")
    ) {
      return;
    }

    const template = buildRegisteredAttendeeSocialTemplate();
    setSubject(template.subject);
    setHtml(template.html);
    setAudience("registered_confirmed");
    setError(null);
    setMessage("Template generado. Editá los textos, la imagen y los enlaces marcados en el HTML.");
  }

  async function handleSendTest() {
    if (!html.trim() || !testEmail.trim()) {
      setError("Completá HTML y email de prueba.");
      return;
    }
    setSendingTest(true);
    setError(null);
    setMessage(null);
    try {
      const result = await sendAttendeeTestEmail({
        subject: subject || "CYBER.AR 2026",
        html,
        to: testEmail.trim(),
      });
      if (!result.ok) {
        setError(result.error ?? "Error al enviar prueba");
        return;
      }
      setMessage(
        [`Prueba enviada a ${testEmail.trim()}.`, result.emailId ? `ID: ${result.emailId}` : null, result.hint ?? null]
          .filter(Boolean)
          .join("\n")
      );
    } finally {
      setSendingTest(false);
    }
  }

  async function handleSend() {
    if (!html.trim() || recipientCount === 0) {
      setError("Completá HTML y asegurate de tener destinatarios.");
      return;
    }
    if (!window.confirm(`¿Enviar a ${recipientCount} asistente(s)?`)) return;

    setSending(true);
    setError(null);
    setMessage(null);
    try {
      const result = await sendAttendeeEmail({
        subject: subject || "CYBER.AR 2026",
        html,
        audience,
      });
      if (result.errors.length > 0 && result.sent === 0) {
        setError(result.errors.join(" · "));
        return;
      }
      if (result.acceptedAttendeeIds?.length) {
        const acceptedIds = new Set(result.acceptedAttendeeIds);
        const today = new Date().toISOString().slice(0, 10);
        useStore.setState((state) => ({
          asistentesPotenciales: state.asistentesPotenciales.map((attendee) =>
            acceptedIds.has(attendee.id) && ["Lead", "Contactado"].includes(attendee.estado)
              ? {
                  ...attendee,
                  estado: "Invitación enviada",
                  ultimoContacto: today,
                  proximaAccion: "Dar seguimiento a la invitación",
                }
              : attendee
          ),
        }));
      }
      setMessage(
        `Enviado a ${result.sent} contacto(s)${result.failed ? ` (${result.failed} fallaron)` : ""}.` +
          (result.campaignId ? " Historial actualizado abajo." : "")
      );
    } finally {
      setSending(false);
    }
  }

  async function handleSchedule() {
    if (!html.trim() || recipientCount === 0 || !scheduledFor) {
      setError("Completá HTML, destinatarios y fecha de programación.");
      return;
    }
    const scheduledDate = new Date(scheduledFor);
    if (!Number.isFinite(scheduledDate.getTime())) {
      setError("La fecha de programación no es válida.");
      return;
    }
    if (
      !window.confirm(
        `¿Programar este newsletter para ${recipientCount} asistente(s) el ${scheduledDate.toLocaleString("es-AR")}?`
      )
    ) {
      return;
    }

    setScheduling(true);
    setError(null);
    setMessage(null);
    try {
      const result = await scheduleAttendeeEmail({
        subject: subject || "CYBER.AR 2026",
        html,
        audience,
        scheduledFor: scheduledDate.toISOString(),
      });
      if (!result.ok) {
        setError(result.errors.join(" · ") || "No se pudo programar el envío.");
        return;
      }
      setMessage(
        `Newsletter programado para ${scheduledDate.toLocaleString("es-AR")} · ${result.sent} destinatario(s).`
      );
      setScheduledFor("");
      setScheduledRefreshKey((value) => value + 1);
    } finally {
      setScheduling(false);
    }
  }

  const resendReady = configured && !fromEmailWarning;

  return (
    <div className="space-y-4 md:space-y-6">
      {message && (
        <div className="rounded-xl border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 px-4 py-3 text-sm text-emerald-800 dark:text-emerald-200 whitespace-pre-line">
          {message}
        </div>
      )}
      {error && (
        <div className="rounded-xl border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-300 whitespace-pre-line">
          {error}
        </div>
      )}

      {(!configured || fromEmailWarning) && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 p-4">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
              {fromEmailWarning ?? "Resend no configurado para asistentes"}
            </p>
            <p className="text-xs text-amber-800/80 mt-1">
              Configurá <code className="font-mono">RESEND_FROM_EMAIL_ATTENDEES</code> con{" "}
              <code className="font-mono">info@cyberar.fie.undef.edu.ar</code> en Vercel.
            </p>
          </div>
        </div>
      )}

      {resendReady && fromEmail && (
        <div className="rounded-xl border border-violet-200 dark:border-violet-500/20 bg-violet-50 dark:bg-violet-500/10 px-4 py-3 text-sm text-violet-900 dark:text-violet-100">
          Remitente asistentes: <span className="font-medium">{fromEmail}</span>
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-2 xl:items-start">
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-violet-500" />
                <h3 className="font-semibold text-sm text-slate-700 dark:text-slate-200">Contenido</h3>
              </div>
              <Button
                type="button"
                onClick={handleGenerateTemplate}
                className="w-full sm:w-auto bg-violet-600 hover:bg-violet-500 text-white font-semibold gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Cargar template para inscriptos
              </Button>
            </div>
            <p className="rounded-lg border border-violet-200 bg-violet-50 px-3 py-2 text-xs text-violet-800 dark:border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-200">
              Carga el email de novedades con redes sociales, auspiciantes y selecciona
              automáticamente “Todos los inscriptos”.
            </p>
            <div>
              <label className="text-xs text-slate-500 mb-1.5 block">Asunto</label>
              <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Invitación CYBER.AR 2026" className={inputCls} />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1.5 block">HTML del email</label>
              <Textarea value={html} onChange={(e) => setHtml(e.target.value)} rows={14} className={`${inputCls} font-mono text-xs`} placeholder="Pegá el HTML de la invitación..." />
            </div>
          </div>
          <NewsletterHtmlPreview html={html} subject={subject} />
        </div>

        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-violet-500" />
              <h3 className="font-semibold text-sm text-slate-700 dark:text-slate-200">Destinatarios</h3>
            </div>
            <Select value={audience} onValueChange={(v) => v && setAudience(v as AttendeeEmailAudience)}>
              <SelectTrigger className={inputCls}><SelectValue /></SelectTrigger>
              <SelectContent className={selectContentCls}>
                {(Object.keys(audienceLabels) as AttendeeEmailAudience[])
                  .filter((k) => k !== "with_email")
                  .map((key) => (
                    <SelectItem key={key} value={key} className={selectItemCls}>{audienceLabels[key]}</SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 border px-4 py-3 text-sm">
              {loadingPreview ? "Calculando..." : (
                <>
                  <span className="font-semibold">{recipientCount}</span> destinatario(s)
                  {skippedCount > 0 && <span className="text-slate-500"> · {skippedCount} omitidos</span>}
                </>
              )}
            </div>
            <Input value={testEmail} onChange={(e) => setTestEmail(e.target.value)} placeholder="Email de prueba" className={inputCls} />
            <Button type="button" variant="outline" onClick={handleSendTest} disabled={!resendReady || sendingTest} className="w-full gap-2">
              {sendingTest ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Enviar prueba
            </Button>
            <Button type="button" onClick={handleSend} disabled={!resendReady || sending || scheduling || recipientCount === 0} className="w-full bg-violet-600 hover:bg-violet-500 text-white font-semibold gap-2">
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
              Enviar comunicación masiva
            </Button>
            <div className="space-y-3 border-t border-slate-200 pt-4 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <CalendarClock className="h-4 w-4 text-amber-500" />
                <div>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Programar newsletter
                  </p>
                  <p className="text-xs text-slate-400">
                    Hasta 30 días de anticipación.
                  </p>
                </div>
              </div>
              <Input
                type="datetime-local"
                value={scheduledFor}
                onChange={(event) => setScheduledFor(event.target.value)}
                min={new Date(
                  Date.now() + 5 * 60 * 1000 - new Date().getTimezoneOffset() * 60 * 1000
                )
                  .toISOString()
                  .slice(0, 16)}
                className={inputCls}
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleSchedule}
                disabled={
                  !resendReady ||
                  scheduling ||
                  sending ||
                  recipientCount === 0 ||
                  !scheduledFor
                }
                className="w-full gap-2 border-amber-300 text-amber-700 hover:bg-amber-50 hover:text-amber-800 dark:border-amber-500/40 dark:text-amber-300 dark:hover:bg-amber-500/10"
              >
                {scheduling ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CalendarClock className="h-4 w-4" />
                )}
                Programar envío
              </Button>
            </div>
          </div>
        </div>
      </div>

      <ScheduledAttendeeEmailsPanel
        refreshKey={scheduledRefreshKey}
        onResult={handleScheduledResult}
      />

      <AttendeeEmailTrackingPanel
        html={html}
        subject={subject}
        onRetryResult={(retryMessage, retryError) => {
          if (retryMessage) setMessage(retryMessage);
          if (retryError) setError(retryError);
        }}
      />
    </div>
  );
}
