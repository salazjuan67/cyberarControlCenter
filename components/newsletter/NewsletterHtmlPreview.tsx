"use client";

import { useMemo } from "react";
import { ExternalLink, Monitor, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { normalizeNewsletterHtml, estimateHtmlSizeKb } from "@/lib/newsletter/html";

interface NewsletterHtmlPreviewProps {
  html: string;
  subject?: string;
}

export function NewsletterHtmlPreview({ html, subject }: NewsletterHtmlPreviewProps) {
  const normalizedHtml = useMemo(() => normalizeNewsletterHtml(html), [html]);
  const sizeKb = useMemo(() => estimateHtmlSizeKb(normalizedHtml), [normalizedHtml]);

  function openInNewTab() {
    const blob = new Blob([normalizedHtml], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank", "noopener,noreferrer");
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }

  if (!normalizedHtml) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 min-h-[420px] flex items-center justify-center p-6 text-center">
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs">
          Pegá o generá HTML para ver la vista previa del email acá en vivo.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900 flex flex-col min-h-[420px]">
      <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
            Vista previa
          </p>
          {subject?.trim() && (
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
              Asunto: {subject.trim()}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
            {sizeKb} KB
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={openInNewTab}
            className="h-8 gap-1.5 border-slate-300 dark:border-slate-700"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Abrir
          </Button>
        </div>
      </div>

      <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3 text-[10px] uppercase tracking-wide text-slate-400">
        <span className="inline-flex items-center gap-1">
          <Monitor className="w-3 h-3" /> Desktop
        </span>
        <span className="inline-flex items-center gap-1 opacity-60">
          <Smartphone className="w-3 h-3" /> Responsive en clientes reales
        </span>
      </div>

      <div className="flex-1 bg-slate-100 dark:bg-slate-950 p-3">
        <iframe
          title="Newsletter HTML preview"
          srcDoc={normalizedHtml}
          className="w-full h-full min-h-[520px] rounded-lg border border-slate-200 dark:border-slate-700 bg-white"
          sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox"
        />
      </div>
    </div>
  );
}
