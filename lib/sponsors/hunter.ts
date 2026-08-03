const HUNTER_BASE = "https://api.hunter.io/v2";

const BLOCKED_LOCALPARTS = new Set([
  "noreply",
  "no-reply",
  "donotreply",
  "ir",
  "investor",
  "press",
  "pr",
  "learn",
  "training",
  "newsletter",
  "jobs",
  "careers",
  "hr",
  "recruiting",
]);

const PREFERRED_LOCALPARTS = [
  "contacto",
  "contact",
  "info",
  "comercial",
  "ventas",
  "sales",
  "hello",
  "hola",
  "atencion",
  "soporte",
  "support",
  "marketing",
  "administracion",
];

const PREFERRED_DEPARTMENTS = new Set([
  "communication",
  "sales",
  "support",
  "management",
  "executive",
  "marketing",
]);

export interface HunterEmail {
  value: string;
  type: string;
  confidence: number;
  position?: string | null;
  department?: string | null;
  first_name?: string | null;
  last_name?: string | null;
}

export interface HunterDomainSearchResult {
  domain: string;
  organization?: string;
  emails: HunterEmail[];
  error?: string;
}

export interface HunterVerifyResult {
  email: string;
  status: "valid" | "invalid" | "accept_all" | "webmail" | "disposable" | "unknown";
  score: number;
  error?: string;
}

export interface HunterAccountInfo {
  configured: boolean;
  searchesAvailable?: number;
  verificationsAvailable?: number;
  planName?: string;
  error?: string;
}

function getApiKey(): string {
  const key = process.env.HUNTER_API_KEY?.trim();
  if (!key) {
    throw new Error("HUNTER_API_KEY no configurada");
  }
  return key;
}

export function isHunterConfigured(): boolean {
  return Boolean(process.env.HUNTER_API_KEY?.trim());
}

async function hunterFetch<T>(path: string, params: Record<string, string>): Promise<T> {
  const url = new URL(`${HUNTER_BASE}${path}`);
  url.searchParams.set("api_key", getApiKey());
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const response = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });

  const json = (await response.json()) as {
    data?: T;
    errors?: Array<{ id?: string; details?: string; code?: number }>;
  };

  if (!response.ok) {
    const message =
      json.errors?.[0]?.details ??
      json.errors?.[0]?.id ??
      `Hunter API error (${response.status})`;
    throw new Error(message);
  }

  return json.data as T;
}

export async function getHunterAccount(): Promise<HunterAccountInfo> {
  if (!isHunterConfigured()) {
    return { configured: false };
  }

  try {
    const data = await hunterFetch<{
      plan_name?: string;
      requests?: {
        credits?: { remaining?: number; available?: number };
        searches?: { available?: number };
      };
    }>("/account", {});

    const credits =
      data.requests?.credits?.remaining ?? data.requests?.credits?.available;

    return {
      configured: true,
      planName: data.plan_name,
      searchesAvailable: credits ?? data.requests?.searches?.available,
    };
  } catch (err) {
    return {
      configured: true,
      error: err instanceof Error ? err.message : "Error al consultar cuenta Hunter",
    };
  }
}

export async function hunterDomainSearch(domain: string): Promise<HunterDomainSearchResult> {
  try {
    const data = await hunterFetch<{
      domain: string;
      organization?: string;
      emails?: HunterEmail[];
    }>("/domain-search", {
      domain,
      limit: "10",
    });

    return {
      domain: data.domain ?? domain,
      organization: data.organization,
      emails: data.emails ?? [],
    };
  } catch (err) {
    return {
      domain,
      emails: [],
      error: err instanceof Error ? err.message : "Error en Domain Search",
    };
  }
}

export async function hunterVerifyEmail(email: string): Promise<HunterVerifyResult> {
  try {
    const data = await hunterFetch<{
      status: HunterVerifyResult["status"];
      score: number;
      email: string;
    }>("/email-verifier", { email });

    return {
      email: data.email ?? email,
      status: data.status ?? "unknown",
      score: data.score ?? 0,
    };
  } catch (err) {
    return {
      email,
      status: "unknown",
      score: 0,
      error: err instanceof Error ? err.message : "Error al verificar email",
    };
  }
}

function localPart(email: string): string {
  return email.split("@")[0]?.toLowerCase() ?? "";
}

function scoreHunterEmail(email: HunterEmail, domain: string): number {
  let score = email.confidence ?? 0;
  const local = localPart(email.value);
  const emailDomain = email.value.split("@")[1]?.toLowerCase() ?? "";

  if (emailDomain !== domain.toLowerCase() && !emailDomain.endsWith(`.${domain.toLowerCase()}`)) {
    score -= 30;
  }

  if (BLOCKED_LOCALPARTS.has(local) || [...BLOCKED_LOCALPARTS].some((b) => local.includes(b))) {
    score -= 50;
  }

  const preferredIdx = PREFERRED_LOCALPARTS.findIndex(
    (part) => local === part || local.startsWith(`${part}.`) || local.includes(part)
  );
  if (preferredIdx >= 0) {
    score += 25 - preferredIdx;
  }

  if (email.type === "generic") score += 10;
  if (email.department && PREFERRED_DEPARTMENTS.has(email.department)) score += 8;

  return score;
}

export function pickBestHunterEmail(
  emails: HunterEmail[],
  domain: string
): (HunterEmail & { rankScore: number }) | null {
  if (emails.length === 0) return null;

  const ranked = emails
    .map((email) => ({ ...email, rankScore: scoreHunterEmail(email, domain) }))
    .sort((a, b) => b.rankScore - a.rankScore);

  const best = ranked[0];
  if (!best || best.rankScore < 20) return null;

  return best;
}

export function formatHunterSourceUrl(domain: string, confidence: number, position?: string | null): string {
  const params = new URLSearchParams({
    confidence: String(confidence),
    via: "cyberar",
  });
  if (position?.trim()) params.set("position", position.trim());
  return `https://hunter.io/domain-search/${encodeURIComponent(domain)}?${params.toString()}`;
}

export function parseHunterSourceUrl(sourceUrl: string): {
  isHunter: boolean;
  domain?: string;
  confidence?: number;
  position?: string;
  webUrl?: string;
} {
  if (!sourceUrl.includes("hunter.io/domain-search")) {
    return { isHunter: false };
  }

  try {
    const url = new URL(sourceUrl);
    const domain = decodeURIComponent(
      url.pathname.replace(/^\/domain-search\/?/, "").replace(/^\//, "")
    );
    const confidence = Number(url.searchParams.get("confidence") ?? "");
    const position = url.searchParams.get("position") ?? undefined;

    return {
      isHunter: true,
      domain: domain || undefined,
      confidence: Number.isFinite(confidence) ? confidence : undefined,
      position,
      webUrl: sourceUrl.split("?")[0] || sourceUrl,
    };
  } catch {
    return { isHunter: true, webUrl: sourceUrl };
  }
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
