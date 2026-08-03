"use client";

import { useEffect, useState } from "react";
import { Loader2, Mail } from "lucide-react";
import { getSponsorEmailHistory } from "@/app/actions/newsletter";
import { DeliveryStatusBadge, formatNewsletterDate } from "@/lib/newsletter/display";
import type { SponsorEmailHistoryEntry } from "@/types/newsletter";

interface SponsorEmailHistoryProps {
  sponsorId: string;
  email?: string;
}

export function SponsorEmailHistory({ sponsorId, email }: SponsorEmailHistoryProps) {
  const [history, setHistory] = useState<SponsorEmailHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sponsorId) return;

    setLoading(true);
    setError(null);
    getSponsorEmailHistory(sponsorId, email)
      .then(setHistory)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [sponsorId, email]);

  return (
    <div className="col-span-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Mail className="w-4 h-4 text-cyan-500" />
        <h4 className="text-sm font-medium text-slate-800 dark:text-slate-200">
          Historial de emails enviados
        </h4>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-xs text-slate-500 py-2">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          Cargando historial...
        </div>
      ) : error ? (
        <p className="text-xs text-red-500">{error}</p>
      ) : history.length === 0 ? (
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Todavía no recibió envíos masivos registrados desde el newsletter.
        </p>
      ) : (
        <ul className="space-y-2 max-h-48 overflow-y-auto pr-1">
          {history.map((entry) => (
            <li
              key={entry.deliveryId}
              className="rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/60 px-3 py-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                    {entry.subject}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {formatNewsletterDate(entry.sentAt || entry.campaignDate)}
                    {entry.recipientEmail ? ` · ${entry.recipientEmail}` : ""}
                  </p>
                  {entry.bounceReason && (
                    <p className="text-[10px] text-red-500 mt-1">{entry.bounceReason}</p>
                  )}
                </div>
                <DeliveryStatusBadge status={entry.status} />
              </div>
              <p className="text-[10px] text-slate-400 font-mono mt-1">{entry.campaignId}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
