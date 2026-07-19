"use client";

import { DollarSign, TrendingUp, TrendingDown, Target, Building2, Users, Monitor, Handshake } from "lucide-react";
import { useStore } from "@/store/useStore";
import {
  calcKPIsByMoneda,
  calcSponsorsConfirmados,
  calcTotalInscripcionesProyectado,
  getActiveMonedas,
} from "@/lib/calculations";
import { formatCurrency, formatNumber, MONEDA_LABELS } from "@/lib/formatters";
import { Header } from "@/components/layout/Header";
import { KPICard } from "@/components/dashboard/KPICard";
import { CyberarFinancePanel } from "@/components/dashboard/CyberarFinancePanel";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { SponsorStatusChart, IngresosFuenteChart, InscripcionesModalidadChart } from "@/components/dashboard/DistributionCharts";
import { ExecutiveSummary } from "@/components/dashboard/ExecutiveSummary";
import type { Moneda } from "@/types";

export default function DashboardPage() {
  const {
    sponsors,
    inscripciones,
    gastos,
    config,
    financeSummary,
    financeSummaryLoading,
    financeSummaryError,
    financeSummaryConfigured,
    refreshFinanceSummary,
  } = useStore();
  const activeMonedas = getActiveMonedas(sponsors, inscripciones, gastos);
  const kpisByMoneda = calcKPIsByMoneda(
    sponsors,
    inscripciones,
    gastos,
    config.breakEven,
    config.breakEvenMoneda
  );

  if (activeMonedas.length === 0) {
    return (
      <div className="flex flex-col flex-1">
        <Header title="Dashboard Ejecutivo" subtitle="CYBER.AR 2026 — Vista financiera consolidada" badge="Tiempo real" />
        <div className="p-4 md:p-6">
          <CyberarFinancePanel
            summary={financeSummary}
            loading={financeSummaryLoading}
            error={financeSummaryError}
            configured={financeSummaryConfigured}
            onRefresh={() => void refreshFinanceSummary()}
          />
          {!financeSummary && !financeSummaryLoading && (
            <p className="mt-6 text-center text-slate-500 dark:text-slate-400 text-sm">
              No hay importes manuales cargados. Agregá sponsors, inscripciones o gastos para ver proyecciones internas.
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1">
      <Header title="Dashboard Ejecutivo" subtitle="CYBER.AR 2026 — Vista financiera consolidada" badge="Tiempo real" />
      <div className="p-4 md:p-6 space-y-8 md:space-y-10">
        <CyberarFinancePanel
          summary={financeSummary}
          loading={financeSummaryLoading}
          error={financeSummaryError}
          configured={financeSummaryConfigured}
          onRefresh={() => void refreshFinanceSummary()}
        />

        {activeMonedas.map((moneda) => {
          const kpis = kpisByMoneda[moneda]!;
          const sponsorsIngresos = calcSponsorsConfirmados(sponsors, moneda);
          const inscripcionesProyTotal = calcTotalInscripcionesProyectado(inscripciones, moneda);
          const inscripcionesConfTotal = kpis.ingresosConfirmados - sponsorsIngresos;
          const sponsorsProyTotal = kpis.ingresosProyectados - inscripcionesProyTotal;

          return (
            <section key={moneda} className="space-y-4 md:space-y-6">
              <div className="flex items-center gap-3">
                <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">
                  Vista {MONEDA_LABELS[moneda]}
                </h2>
                <span className="text-xs font-mono px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400">
                  {moneda}
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                <KPICard title="Ingresos Confirmados" value={formatCurrency(kpis.ingresosConfirmados, moneda)}
                  subtitle="Sponsors + Inscripciones" icon={DollarSign} accent="emerald" trend="up"
                  trendLabel={kpis.breakEven > 0 ? `${((kpis.ingresosConfirmados / kpis.breakEven) * 100).toFixed(0)}% del break even` : "Sin meta BE"} />
                <KPICard title="Ingresos Proyectados" value={formatCurrency(kpis.ingresosProyectados, moneda)}
                  subtitle="Incluye sponsors ponderados" icon={TrendingUp} accent="cyan" trend="up" trendLabel="Escenario esperado" />
                <KPICard title="Gastos Proyectados" value={formatCurrency(kpis.gastosProyectados, moneda)}
                  subtitle={`Confirmados: ${formatCurrency(kpis.gastosConfirmados, moneda)}`} icon={TrendingDown} accent="red" trend="neutral" trendLabel="Presupuesto base" />
                <KPICard title="Resultado Neto Proy." value={formatCurrency(kpis.resultadoNeto, moneda)}
                  subtitle={kpis.resultadoNeto >= 0 ? "Superávit proyectado" : "Déficit proyectado"}
                  icon={Target} accent={kpis.resultadoNeto >= 0 ? "emerald" : "red"}
                  trend={kpis.resultadoNeto >= 0 ? "up" : "down"}
                  trendLabel={kpis.ingresosProyectados > 0 ? `Margen: ${((kpis.resultadoNeto / kpis.ingresosProyectados) * 100).toFixed(1)}%` : "—"} />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                <KPICard title="Sponsors Confirmados" value={String(kpis.sponsorsConfirmados)}
                  subtitle={`${formatCurrency(sponsorsIngresos, moneda)} recaudados`} icon={Building2} accent="purple" trend="up"
                  trendLabel={`${kpis.sponsorsNegociacion} en negociación`} />
                <KPICard title="Sponsors en Gestión" value={String(kpis.sponsorsNegociacion)}
                  subtitle="Leads + Propuestas activas" icon={Handshake} accent="yellow" trend="neutral" trendLabel="Seguimiento activo" />
                <KPICard title="Inscripciones Presenciales" value={formatNumber(kpis.inscripcionesPresenciales)}
                  subtitle={`Meta: ${formatNumber(config.metaPresencial)}`} icon={Users} accent="blue"
                  trend={kpis.inscripcionesPresenciales >= config.metaPresencial * 0.7 ? "up" : "neutral"}
                  trendLabel={`${((kpis.inscripcionesPresenciales / config.metaPresencial) * 100).toFixed(0)}% de meta`} />
                <KPICard title="Inscripciones Virtuales" value={formatNumber(kpis.inscripcionesVirtuales)}
                  subtitle={`Meta: ${formatNumber(config.metaVirtual)}`} icon={Monitor} accent="cyan"
                  trend={kpis.inscripcionesVirtuales >= config.metaVirtual * 0.5 ? "up" : "neutral"}
                  trendLabel={`${((kpis.inscripcionesVirtuales / config.metaVirtual) * 100).toFixed(0)}% de meta`} />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-1">
                  <RevenueChart moneda={moneda}
                    ingresosConfirmados={kpis.ingresosConfirmados}
                    ingresosProyectados={kpis.ingresosProyectados}
                    gastosConfirmados={kpis.gastosConfirmados}
                    gastosProyectados={kpis.gastosProyectados} />
                </div>
                <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <IngresosFuenteChart moneda={moneda}
                    inscripcionesTotal={inscripcionesProyTotal}
                    sponsorsTotal={Math.max(0, sponsorsProyTotal)} />
                  <SponsorStatusChart sponsors={sponsors.filter((s) => s.moneda === moneda)} />
                  <InscripcionesModalidadChart inscripciones={inscripciones} moneda={moneda} />
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2">
                  <ExecutiveSummary kpis={kpis} eventoNombre={config.nombreEvento} />
                </div>
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
                  <h3 className="text-slate-700 dark:text-slate-200 font-semibold text-sm mb-4">
                    Desglose de Ingresos ({moneda})
                  </h3>
                  <div className="space-y-3">
                    {[
                      { label: "Sponsors confirmados", value: sponsorsIngresos, color: "bg-purple-500",
                        pct: kpis.ingresosProyectados > 0 ? (sponsorsIngresos / kpis.ingresosProyectados) * 100 : 0 },
                      { label: "Inscripciones confirmadas", value: inscripcionesConfTotal, color: "bg-cyan-500",
                        pct: kpis.ingresosProyectados > 0 ? (inscripcionesConfTotal / kpis.ingresosProyectados) * 100 : 0 },
                      { label: "Proyección inscripciones", value: Math.max(0, inscripcionesProyTotal - inscripcionesConfTotal), color: "bg-blue-500",
                        pct: kpis.ingresosProyectados > 0 ? (Math.max(0, inscripcionesProyTotal - inscripcionesConfTotal) / kpis.ingresosProyectados) * 100 : 0 },
                    ].map((item) => (
                      <div key={item.label}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-slate-500 dark:text-slate-400">{item.label}</span>
                          <span className="text-xs font-medium text-slate-700 dark:text-white">{formatCurrency(item.value, moneda)}</span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5">
                          <div className={`h-1.5 rounded-full ${item.color}`} style={{ width: `${Math.max(0, Math.min(item.pct, 100))}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
