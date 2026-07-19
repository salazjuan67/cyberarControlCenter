import type {
  FinanceSummary,
  FinanceSummaryFetchOptions,
} from "@/types/finance-summary";

const DEFAULT_API_URL =
  "https://lgupizxwgjeyduinfghh.supabase.co/functions/v1/finance-summary";

function getApiConfig() {
  const apiKey = process.env.CYBERAR_FINANCE_API_KEY;
  if (!apiKey) {
    throw new Error(
      "CYBERAR_FINANCE_API_KEY no está configurada. Agregala en Vercel o .env.local."
    );
  }

  return {
    url: process.env.CYBERAR_FINANCE_API_URL ?? DEFAULT_API_URL,
    apiKey,
  };
}

function buildUrl(baseUrl: string, options?: FinanceSummaryFetchOptions): string {
  const params = new URLSearchParams();
  if (options?.from) params.set("from", options.from);
  if (options?.to) params.set("to", options.to);
  if (options?.includeTest) params.set("include_test", "1");
  const qs = params.toString();
  return qs ? `${baseUrl}?${qs}` : baseUrl;
}

function parseFinanceSummary(data: unknown): FinanceSummary {
  if (!data || typeof data !== "object") {
    throw new Error("Respuesta inválida del API de CYBER.AR");
  }

  const payload = data as Record<string, unknown>;
  if (payload.ok !== true) {
    const message =
      typeof payload.error === "string"
        ? payload.error
        : "El API de CYBER.AR devolvió un error";
    throw new Error(message);
  }

  return {
    ok: true,
    generated_at: String(payload.generated_at ?? new Date().toISOString()),
    filters: {
      from: (payload.filters as FinanceSummary["filters"])?.from ?? null,
      to: (payload.filters as FinanceSummary["filters"])?.to ?? null,
      include_test:
        (payload.filters as FinanceSummary["filters"])?.include_test ?? false,
    },
    currency_totals:
      (payload.currency_totals as FinanceSummary["currency_totals"]) ?? {},
    participants: (payload.participants as FinanceSummary["participants"]) ?? {
      total: 0,
      by_categoria: {},
      by_modalidad: {},
      by_categoria_modalidad: {},
    },
  };
}

export async function fetchFinanceSummaryFromApi(
  options?: FinanceSummaryFetchOptions
): Promise<FinanceSummary> {
  const { url, apiKey } = getApiConfig();
  const target = buildUrl(url, options);

  const response = await fetch(target, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (response.status === 401) {
    throw new Error("API key de CYBER.AR inválida o ausente (401)");
  }

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(
      `Error al consultar finance-summary (${response.status})${body ? `: ${body.slice(0, 200)}` : ""}`
    );
  }

  const json: unknown = await response.json();
  return parseFinanceSummary(json);
}

export function isFinanceSummaryConfigured(): boolean {
  return Boolean(process.env.CYBERAR_FINANCE_API_KEY);
}
