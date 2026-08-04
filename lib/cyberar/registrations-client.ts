import type {
  ExternalRegistration,
  RegistrationExportPage,
  RegistrationStatus,
} from "@/types/registration-sync";

const DEFAULT_API_URL =
  "https://lgupizxwgjeyduinfghh.supabase.co/functions/v1/registrations-export";

function getApiConfig() {
  const apiKey = process.env.FINANCE_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("FINANCE_API_KEY no está configurada.");
  }

  const financeUrl = process.env.CYBERAR_FINANCE_API_URL;
  const derivedUrl = financeUrl
    ? financeUrl.replace(/\/finance-summary\/?$/, "/registrations-export")
    : DEFAULT_API_URL;

  return {
    url: process.env.CYBERAR_REGISTRATIONS_API_URL ?? derivedUrl,
    apiKey,
  };
}

function text(value: unknown): string {
  return String(value ?? "").trim();
}

function registrationStatus(value: unknown): RegistrationStatus {
  if (value === "confirmed" || value === "rejected") return value;
  return "pending";
}

function parseRegistration(value: unknown): ExternalRegistration | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  const id = text(row.id);
  const email = text(row.email).toLowerCase();
  if (!id || !email) return null;

  return {
    id,
    email,
    fullName: text(row.full_name),
    phone: text(row.phone),
    organization: text(row.organization),
    category: text(row.category),
    modality: text(row.modality),
    registrationStatus: registrationStatus(row.registration_status),
    paymentStatus: text(row.payment_status),
    paymentMethod: text(row.payment_method),
    accessType: text(row.access_type),
    registeredAt: text(row.registered_at),
    paidAt: text(row.paid_at),
    studentCertificateStatus: text(row.student_certificate_status),
    isTest: row.is_test === true,
  };
}

export async function fetchRegistrationsPage(
  cursor: string | null = null,
  limit = 500
): Promise<RegistrationExportPage> {
  const { url, apiKey } = getApiConfig();
  const target = new URL(url);
  target.searchParams.set("limit", String(limit));
  target.searchParams.set("include_test", "0");
  if (cursor) target.searchParams.set("cursor", cursor);

  const response = await fetch(target, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (response.status === 401) {
    throw new Error("API key de inscripciones inválida o ausente (401)");
  }
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(
      `Error al consultar inscripciones (${response.status})${
        body ? `: ${body.slice(0, 200)}` : ""
      }`
    );
  }

  const payload = (await response.json()) as Record<string, unknown>;
  if (payload.ok !== true || !Array.isArray(payload.registrations)) {
    throw new Error("Respuesta inválida del API de inscripciones");
  }

  return {
    generatedAt: text(payload.generated_at),
    nextCursor: payload.next_cursor ? text(payload.next_cursor) : null,
    registrations: payload.registrations
      .map(parseRegistration)
      .filter((row): row is ExternalRegistration => Boolean(row)),
  };
}

export async function fetchAllRegistrations(): Promise<{
  generatedAt: string;
  registrations: ExternalRegistration[];
}> {
  const registrations: ExternalRegistration[] = [];
  let generatedAt = "";
  let cursor: string | null = null;

  for (let pageNumber = 0; pageNumber < 100; pageNumber += 1) {
    const page = await fetchRegistrationsPage(cursor);
    generatedAt = page.generatedAt || generatedAt;
    registrations.push(...page.registrations);
    cursor = page.nextCursor;
    if (!cursor) return { generatedAt, registrations };
  }

  throw new Error("La API de inscripciones superó el límite de paginación");
}

export function isRegistrationSyncConfigured(): boolean {
  return Boolean(process.env.FINANCE_API_KEY?.trim());
}
