import { Webhook } from "svix";

export interface ResendWebhookEvent {
  type: string;
  created_at?: string;
  data?: {
    email_id?: string;
    to?: string[];
    bounce?: {
      message?: string;
      type?: string;
      subType?: string;
    };
  };
}

export function verifyResendWebhook(
  payload: string,
  headers: Headers
): ResendWebhookEvent {
  const secret = process.env.RESEND_WEBHOOK_SECRET?.trim();

  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("RESEND_WEBHOOK_SECRET no configurada");
    }
    return JSON.parse(payload) as ResendWebhookEvent;
  }

  const wh = new Webhook(secret);
  return wh.verify(payload, {
    "svix-id": headers.get("svix-id") ?? "",
    "svix-timestamp": headers.get("svix-timestamp") ?? "",
    "svix-signature": headers.get("svix-signature") ?? "",
  }) as ResendWebhookEvent;
}
