import { Resend } from "resend";

let resendClient: Resend | null = null;

export function isResendConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}

export function getResendFromEmail(): string | null {
  const from = process.env.RESEND_FROM_EMAIL?.trim();
  return from || null;
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

export function assertResendReady(): { from: string } {
  const from = getResendFromEmail();
  if (!isResendConfigured()) {
    throw new Error("RESEND_API_KEY no configurada");
  }
  if (!from) {
    throw new Error("RESEND_FROM_EMAIL no configurada");
  }
  return { from };
}
