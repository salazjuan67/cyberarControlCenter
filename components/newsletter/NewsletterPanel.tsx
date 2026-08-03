"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  Loader2,
  Mail,
  Send,
  Sparkles,
  Users,
} from "lucide-react";
import { useStore } from "@/store/useStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  buildNewsletterSummaryDraft,
  getNewsletterStatus,
  previewNewsletterRecipients,
  sendNewsletter,
  sendTestNewsletter,
} from "@/app/actions/newsletter";
import { NewsletterHtmlPreview } from "@/components/newsletter/NewsletterHtmlPreview";
import { NewsletterTrackingPanel } from "@/components/newsletter/NewsletterTrackingPanel";
import type { NewsletterAudience } from "@/types/newsletter";

const inputCls =
  "bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-200";
const selectContentCls =
  "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700";
const selectItemCls =
  "text-slate-700 dark:text-slate-200 focus:bg-slate-100 dark:focus:bg-slate-700";

const audienceLabels: Record<NewsletterAudience, string> = {
  all_sponsors: "Todos los sponsors con email",
  confirmed_sponsors: "Solo sponsors confirmados",
};

export function NewsletterPanel() {
  const { sponsors } = useStore();
  const [configured, setConfigured] = useState(false);
  const [fromEmail, setFromEmail] = useState<string | null>(null);
  const [fromEmailWarning, setFromEmailWarning] = useState<string | null>(null);
  const [audience, setAudience] = useState<NewsletterAudience>("all_sponsors");
  const [recipientCount, setRecipientCount] = useState(0);
  const [skippedCount, setSkippedCount] = useState(0);
  const [subject, setSubject] = useState("");
  const [customBody, setCustomBody] = useState("");
  const [html, setHtml] = useState("");
  const [testEmail, setTestEmail] = useState("");
  const [loadingDraft, setLoadingDraft] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refreshRecipients = useCallback(async (nextAudience: NewsletterAudience) => {
    setLoadingPreview(true);
    try {
      const preview = await previewNewsletterRecipients(nextAudience);
      setRecipientCount(preview.recipients.length);
      setSkippedCount(preview.skipped);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cargar destinatarios");
    } finally {
      setLoadingPreview(false);
    }
  }, []);

  useEffect(() => {
    getNewsletterStatus().then((status) => {
      setConfigured(status.configured && !status.fromEmailWarning);
      setFromEmail(status.fromEmail);
      setFromEmailWarning(status.fromEmailWarning);
    });
  }, []);

  useEffect(() => {
    refreshRecipients(audience);
  }, [audience, sponsors.length, refreshRecipients]);

  useEffect(() => {
    if (message || error) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [message, error]);

  async function handleGenerateDraft() {
    setLoadingDraft(true);
    setError(null);
    setMessage(null);
    try {
      const draft = await buildNewsletterSummaryDraft(customBody.trim() || undefined);
      setSubject(draft.subject);
      setHtml(draft.html);
      setMessage("Borrador generado con KPIs del dashboard.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo generar el borrador");
    } finally {
      setLoadingDraft(false);
    }
  }

  async function handleSendTest() {
    if (!html.trim()) {
      setError("Generá o pegá el HTML antes de enviar una prueba.");
      return;
    }
    if (!testEmail.trim()) {
      setError("Ingresá un email de prueba.");
      return;
    }

    setSendingTest(true);
    setError(null);
    setMessage(null);
    try {
      const result = await sendTestNewsletter({
        subject: subject || "Newsletter CYBER.AR",
        html,
        to: testEmail.trim(),
      });
      if (!result.ok) {
        setError(result.error ?? "Error al enviar prueba");
        return;
      }
      const parts = [
        `Email de prueba enviado a ${testEmail.trim()}.`,
        result.emailId ? `ID Resend: ${result.emailId}` : null,
        result.hint ?? null,
      ].filter(Boolean);
      setMessage(parts.join("\n"));
    } finally {
      setSendingTest(false);
    }
  }

  async function handleSendNewsletter() {
    if (!html.trim()) {
      setError("Generá o pegá el HTML antes de enviar.");
      return;
    }
    if (recipientCount === 0) {
      setError("No hay destinatarios válidos para esta audiencia.");
      return;
    }

    const confirmed = window.confirm(
      `¿Enviar newsletter a ${recipientCount} destinatario(s)? Esta acción no se puede deshacer.`
    );
    if (!confirmed) return;

    setSending(true);
    setError(null);
    setMessage(null);
    try {
      const result = await sendNewsletter({
        subject: subject || "Newsletter CYBER.AR",
        html,
        audience,
      });

      if (result.errors.length > 0 && result.sent === 0) {
        setError(result.errors.join(" · "));
        return;
      }

      const partial =
        result.failed > 0
          ? ` (${result.failed} fallaron)`
          : "";
      setMessage(
        `Newsletter enviada: ${result.sent} correo(s)${partial}.` +
          (result.campaignId ? " Seguí las métricas abajo." : "")
      );
      if (result.errors.length > 0) {
        setError(result.errors.slice(0, 3).join(" · "));
      }
    } finally {
      setSending(false);
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
          <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
              {fromEmailWarning ?? "Resend no está configurado"}
            </p>
            <p className="text-xs text-amber-800/80 dark:text-amber-300/80 mt-1 leading-relaxed">
              Configurá <code className="font-mono">RESEND_API_KEY</code> y{" "}
              <code className="font-mono">RESEND_FROM_EMAIL</code> en Vercel con un dominio
              verificado en{" "}
              <a
                href="https://resend.com/domains"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                Resend
              </a>
              . En plan Free solo podés enviar a emails verificados de tu cuenta.
            </p>
          </div>
        </div>
      )}

      {resendReady && fromEmail && (
        <div className="rounded-xl border border-cyan-200 dark:border-cyan-500/20 bg-cyan-50 dark:bg-cyan-500/10 px-4 py-3 text-sm text-cyan-900 dark:text-cyan-100">
          Remitente: <span className="font-medium">{fromEmail}</span>
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-2 xl:items-start">
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              <h3 className="text-slate-700 dark:text-slate-200 font-semibold text-sm">
                Contenido
              </h3>
            </div>

            <div>
              <label className="text-xs text-slate-500 dark:text-slate-400 mb-1.5 block">
                Asunto
              </label>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Actualización CYBER.AR 2026"
                className={inputCls}
              />
            </div>

            <div>
              <label className="text-xs text-slate-500 dark:text-slate-400 mb-1.5 block">
                Mensaje introductorio (opcional)
              </label>
              <Textarea
                value={customBody}
                onChange={(e) => setCustomBody(e.target.value)}
                placeholder="Hola, compartimos el estado del evento..."
                rows={3}
                className={inputCls}
              />
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                Se incluye en el borrador automático junto con KPIs del dashboard.
              </p>
            </div>

            <Button
              type="button"
              onClick={handleGenerateDraft}
              disabled={loadingDraft}
              className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold gap-2"
            >
              {loadingDraft ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              Generar borrador
            </Button>

            <div>
              <label className="text-xs text-slate-500 dark:text-slate-400 mb-1.5 block">
                HTML del email
              </label>
              <Textarea
                value={html}
                onChange={(e) => setHtml(e.target.value)}
                placeholder="Generá un borrador o pegá HTML personalizado (incluye <!doctype html> si ya lo tenés)..."
                rows={14}
                className={`${inputCls} font-mono text-xs`}
              />
            </div>
          </div>

          <NewsletterHtmlPreview html={html} subject={subject} />
        </div>

        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              <h3 className="text-slate-700 dark:text-slate-200 font-semibold text-sm">
                Destinatarios
              </h3>
            </div>

            <div>
              <label className="text-xs text-slate-500 dark:text-slate-400 mb-1.5 block">
                Audiencia
              </label>
              <Select
                value={audience}
                onValueChange={(v) => v && setAudience(v as NewsletterAudience)}
              >
                <SelectTrigger className={inputCls}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className={selectContentCls}>
                  {(Object.keys(audienceLabels) as NewsletterAudience[]).map((key) => (
                    <SelectItem key={key} value={key} className={selectItemCls}>
                      {audienceLabels[key]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 px-4 py-3 text-sm">
              <p className="text-slate-700 dark:text-slate-200">
                {loadingPreview ? (
                  "Calculando destinatarios..."
                ) : (
                  <>
                    <span className="font-semibold">{recipientCount}</span> destinatario(s)
                    {skippedCount > 0 && (
                      <span className="text-slate-500 dark:text-slate-400">
                        {" "}
                        · {skippedCount} omitido(s) sin email válido
                      </span>
                    )}
                  </>
                )}
              </p>
            </div>

            <div>
              <label className="text-xs text-slate-500 dark:text-slate-400 mb-1.5 block">
                Email de prueba
              </label>
              <Input
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="tu@email.com"
                className={inputCls}
              />
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={handleSendTest}
              disabled={!resendReady || sendingTest}
              className="w-full gap-2 border-slate-300 dark:border-slate-700"
            >
              {sendingTest ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              Enviar prueba
            </Button>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
            <Button
              type="button"
              onClick={handleSendNewsletter}
              disabled={!resendReady || sending || recipientCount === 0}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold gap-2"
            >
              {sending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Mail className="w-4 h-4" />
              )}
              Enviar newsletter
            </Button>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-3 leading-relaxed">
              Los emails se toman del CRM de sponsors. Asegurate de tener emails cargados y un
              dominio verificado en Resend.
            </p>
          </div>
        </div>
      </div>

      <NewsletterTrackingPanel />
    </div>
  );
}
