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

  const supabase = createSupabaseServer();

  if (event.type === "email.opened") {
    const at = eventTimestamp(event);
    for (const table of ["newsletter_deliveries", "attendee_email_deliveries"] as const) {
      const { data: existing, error: fetchError } = await supabase
        .from(table)
        .select("opened_at")
        .eq("resend_email_id", emailId)
        .maybeSingle();

      if (fetchError) {
        console.error(`Failed to load ${table}:`, fetchError.message);
        continue;
      }
      if (!existing || existing.opened_at) continue;

      const { error } = await supabase
        .from(table)
        .update({ opened_at: at, last_event_at: at })
        .eq("resend_email_id", emailId);

      if (error) {
        console.error(`Failed to update ${table} open:`, error.message);
        return Response.json({ error: "Database update failed" }, { status: 500 });
      }

      return Response.json({ ok: true });
    }

    return Response.json({ ok: true, ignored: true });
  }

  const update = buildDeliveryUpdate(event);
  if (!update) {
    return Response.json({ ok: true, ignored: true });
  }

  for (const table of ["newsletter_deliveries", "attendee_email_deliveries"] as const) {
    const { data: existing, error: fetchError } = await supabase
      .from(table)
      .select("status")
      .eq("resend_email_id", emailId)
      .maybeSingle();

    if (fetchError) {
      console.error(`Failed to load ${table}:`, fetchError.message);
      continue;
    }

    if (!existing) continue;

    const currentStatus = existing.status as NewsletterDeliveryStatus;
    const nextStatus = update.status as NewsletterDeliveryStatus;
    if (STATUS_RANK[nextStatus] < STATUS_RANK[currentStatus]) {
      return Response.json({ ok: true, ignored: true });
    }

    const { error } = await supabase
      .from(table)
      .update(update)
      .eq("resend_email_id", emailId);

    if (error) {
      console.error(`Failed to update ${table}:`, error.message);
      return Response.json({ error: "Database update failed" }, { status: 500 });
    }

    return Response.json({ ok: true });
  }

  return Response.json({ ok: true, ignored: true });
}
