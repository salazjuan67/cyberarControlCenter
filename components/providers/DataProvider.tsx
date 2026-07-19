"use client";

import { useEffect, useState } from "react";
import { Loader2, AlertTriangle } from "lucide-react";
import { useStore } from "@/store/useStore";
import { fetchAllData } from "@/app/actions/data";
import {
  getFinanceSummaryStatus,
  loadFinanceSummary,
  syncFinanceSummary,
} from "@/app/actions/finance-summary";

export function DataProvider({ children }: { children: React.ReactNode }) {
  const {
    isHydrated,
    isLoading,
    hydrate,
    setLoading,
    setFinanceSummary,
    setFinanceSummaryMeta,
  } = useStore();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isHydrated) return;

    setLoading(true);
    fetchAllData()
      .then(async (data) => {
        setError(null);
        hydrate(data);

        const [status, cached] = await Promise.all([
          getFinanceSummaryStatus(),
          loadFinanceSummary(),
        ]);

        setFinanceSummaryMeta({ configured: status.configured });
        if (cached) setFinanceSummary(cached);

        if (status.configured) {
          setFinanceSummaryMeta({ loading: true });
          const result = await syncFinanceSummary();
          if (result.summary) setFinanceSummary(result.summary);
          setFinanceSummaryMeta({
            loading: false,
            error: result.error ?? null,
          });
        }
      })
      .catch((err: Error) => {
        setLoading(false);
        setError(err.message || "Error al cargar datos desde Supabase");
      });
  }, [isHydrated, hydrate, setLoading, setFinanceSummary, setFinanceSummaryMeta]);

  if (!isHydrated && isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3 text-slate-400 dark:text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
          <p className="text-sm font-mono">Cargando datos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh] p-6">
        <div className="max-w-md text-center space-y-3">
          <AlertTriangle className="w-10 h-10 text-red-500 mx-auto" />
          <p className="text-slate-700 dark:text-slate-200 font-semibold">
            No se pudieron cargar los datos
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400">{error}</p>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            Verificá que las variables de Supabase estén configuradas y que
            ejecutaste el schema SQL.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
