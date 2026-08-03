import { createSupabaseServer } from "@/lib/supabase/server";
import {
  eventTimestamp,
  statusFromResendEvent,
} from "@/lib/newsletter/campaigns";
import { verifyResendWebhook, type ResendWebhookEvent } from "@/lib/resend/webhook";
import type { NewsletterDeliveryStatus } from "@/types/newsletter";

const STATUS_RANK: Record<NewsletterDeliveryStatus, number> = {
  pending: 0,
  sent: 1,
  delayed: 2,
  delivered: 3,
  bounced: 3,
  failed: 3,
};

function buildDeliveryUpdate(event: ResendWebhookEvent) {
  const status = statusFromResendEvent(event.type);
  if (!status) return null;

  const at = eventTimestamp(event);
  const update: Record<string, unknown> = {
    status,
    last_event_at: at,
  };

  if (status === "sent") update.sent_at = at;
  if (status === "delivered") update.delivered_at = at;
  if (status === "bounced") {
    update.bounced_at = at;
    update.bounce_reason =
      event.data?.bounce?.message ??
      event.data?.bounce?.type ??
      "Rebote permanente";
  }
  if (status === "failed") update.failed_at = at;

  return update;
}

export async function POST(request: Request) {
  const payload = await request.text();

  let event: ResendWebhookEvent;
  try {
    event = verifyResendWebhook(payload, request.headers);
  } catch (err) {
    console.error("Resend webhook verification failed:", err);
    return Response.json({ error: "Invalid webhook signature" }, { status: 401 });
  }

  const emailId = event.data?.email_id;
  if (!emailId) {
    return Response.json({ ok: true, ignored: true });
  }

  const update = buildDeliveryUpdate(event);
  if (!update) {
    return Response.json({ ok: true, ignored: true });
  }

  const supabase = createSupabaseServer();

  const { data: existing, error: fetchError } = await supabase
    .from("newsletter_deliveries")
    .select("status")
    .eq("resend_email_id", emailId)
    .maybeSingle();

  if (fetchError) {
    console.error("Failed to load newsletter delivery:", fetchError.message);
    return Response.json({ error: "Database lookup failed" }, { status: 500 });
  }

  if (!existing) {
    return Response.json({ ok: true, ignored: true });
  }

  const currentStatus = existing.status as NewsletterDeliveryStatus;
  const nextStatus = update.status as NewsletterDeliveryStatus;
  if (STATUS_RANK[nextStatus] < STATUS_RANK[currentStatus]) {
    return Response.json({ ok: true, ignored: true });
  }

  const { error } = await supabase
    .from("newsletter_deliveries")
    .update(update)
    .eq("resend_email_id", emailId);

  if (error) {
    console.error("Failed to update newsletter delivery:", error.message);
    return Response.json({ error: "Database update failed" }, { status: 500 });
  }

  return Response.json({ ok: true });
}
