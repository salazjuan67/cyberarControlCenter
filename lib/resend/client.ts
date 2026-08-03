import { Resend } from "resend";

export type ResendChannel = "sponsors" | "attendees";

const FROM_ENV: Record<ResendChannel, string> = {
  sponsors: "RESEND_FROM_EMAIL",
  attendees: "RESEND_FROM_EMAIL_ATTENDEES",
};

let resendClient: Resend | null = null;

export function isResendConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}

export function getResendFromEmail(channel: ResendChannel = "sponsors"): string | null {
  const from = process.env[FROM_ENV[channel]]?.trim();
  return from || null;
}

export function getResendFromEmailIssue(
  from: string | null,
  envName = "RESEND_FROM_EMAIL"
): string | null {
  if (!from) return `${envName} no configurada`;
  if (/tudominio\.com|example\.com|yourdomain|placeholder/i.test(from)) {
    return "El remitente usa un dominio placeholder. Configurá un email de un dominio verificado en Resend.";
  }
  if (!from.includes("@")) {
    return `${envName} no parece un email válido`;
  }
  return null;
}

export function getResendClient(): Resend {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("RESEND_API_KEY no configurada");
  }

  if (!resendClient) {
    resendClient = new Resend(apiKey);
  }

  return resendClient;
}

export function assertResendReady(channel: ResendChannel = "sponsors"): { from: string } {
  const envName = FROM_ENV[channel];
  const from = getResendFromEmail(channel);
  if (!isResendConfigured()) {
    throw new Error("RESEND_API_KEY no configurada");
  }
  if (!from) {
    throw new Error(`${envName} no configurada`);
  }
  const fromIssue = getResendFromEmailIssue(from, envName);
  if (fromIssue) {
    throw new Error(fromIssue);
  }
  return { from };
}
