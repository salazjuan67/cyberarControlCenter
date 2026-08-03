import { formatCurrency, formatDate, formatNumber } from "@/lib/formatters";
import type { EventConfig, KPIs, Moneda } from "@/types";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function kpiRow(label: string, value: string): string {
  return `
    <tr>
      <td style="padding:10px 0;color:#64748b;font-size:14px;border-bottom:1px solid #e2e8f0;">${label}</td>
      <td style="padding:10px 0;color:#0f172a;font-size:14px;font-weight:600;text-align:right;border-bottom:1px solid #e2e8f0;">${value}</td>
    </tr>
  `;
}

export function buildNewsletterHtml(options: {
  config: EventConfig;
  kpis: KPIs;
  customBody?: string;
}): string {
  const { config, kpis, customBody } = options;
  const eventTitle = escapeHtml(config.nombreEvento || "CYBER.AR");
  const bodyContent = customBody
    ? escapeHtml(customBody).replace(/\n/g, "<br />")
    : "";

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${eventTitle}</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f1f5f9;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
          <tr>
            <td style="background:linear-gradient(135deg,#0f172a 0%,#164e63 100%);padding:28px 32px;">
              <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:#67e8f9;">Newsletter</p>
              <h1 style="margin:0;color:#ffffff;font-size:24px;line-height:1.3;">${eventTitle} ${config.anio}</h1>
              <p style="margin:12px 0 0;color:#cbd5e1;font-size:14px;">Actualización del comité organizador</p>
            </td>
          </tr>
          ${
            bodyContent
              ? `<tr><td style="padding:24px 32px 0;color:#334155;font-size:15px;line-height:1.6;">${bodyContent}</td></tr>`
              : ""
          }
          <tr>
            <td style="padding:24px 32px;">
              <h2 style="margin:0 0 16px;font-size:16px;color:#0f172a;">Resumen financiero (${kpis.moneda})</h2>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                ${kpiRow("Ingresos confirmados", formatCurrency(kpis.ingresosConfirmados, kpis.moneda))}
                ${kpiRow("Ingresos proyectados", formatCurrency(kpis.ingresosProyectados, kpis.moneda))}
                ${kpiRow("Gastos confirmados", formatCurrency(kpis.gastosConfirmados, kpis.moneda))}
                ${kpiRow("Resultado neto proyectado", formatCurrency(kpis.resultadoNeto, kpis.moneda))}
                ${kpiRow("Sponsors confirmados", formatNumber(kpis.sponsorsConfirmados))}
                ${kpiRow("Inscriptos presenciales", formatNumber(kpis.inscripcionesPresenciales))}
                ${kpiRow("Inscriptos virtuales", formatNumber(kpis.inscripcionesVirtuales))}
                ${kpiRow("Avance break even", `${kpis.avanceBreakEven.toFixed(1)}%`)}
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 24px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f8fafc;border-radius:12px;">
                <tr>
                  <td style="padding:16px 20px;">
                    <p style="margin:0 0 8px;font-size:13px;color:#64748b;">Fechas del evento</p>
                    <p style="margin:0;font-size:14px;color:#0f172a;">
                      Inicio: ${formatDate(config.fechaInicio)} · Cierre inscripciones: ${formatDate(config.fechaCierreInscripciones)}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px 28px;border-top:1px solid #e2e8f0;">
              <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.5;">
                Enviado desde CYBER.AR Control Center. Este correo es informativo para sponsors y aliados del evento.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function buildNewsletterSubject(config: EventConfig): string {
  const name = config.nombreEvento?.trim() || "CYBER.AR";
  return `Actualización ${name} ${config.anio}`;
}

export function wrapCustomHtml(bodyHtml: string, config: EventConfig): string {
  const eventTitle = escapeHtml(config.nombreEvento || "CYBER.AR");

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${eventTitle}</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f1f5f9;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
          <tr>
            <td style="background:linear-gradient(135deg,#0f172a 0%,#164e63 100%);padding:28px 32px;">
              <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:#67e8f9;">Newsletter</p>
              <h1 style="margin:0;color:#ffffff;font-size:24px;line-height:1.3;">${eventTitle} ${config.anio}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 32px;color:#334155;font-size:15px;line-height:1.6;">
              ${bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px 28px;border-top:1px solid #e2e8f0;">
              <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.5;">
                Enviado desde CYBER.AR Control Center.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function getPrimaryMoneda(config: EventConfig): Moneda {
  return config.breakEvenMoneda || config.moneda || "ARS";
}
