import { timingSafeEqual } from "node:crypto";
import { createSupabaseServer } from "@/lib/supabase/server";
import { assertResendReady, getResendClient } from "@/lib/resend/client";

export const runtime = "nodejs";
export const maxDuration = 300;

const BATCH_SIZE = 100;
const PAID_STATUSES = new Set(["aprobado", "approved", "paid"]);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface Recipient {
  attendeeId: string;
  email: string;
  name: string;
  organization: string;
}

interface Operation {
  campaignId: string;
  draftId: string;
  subject: string;
  scheduledFor: string | null;
}

interface BatchProxyInput {
  mode: "batch";
  campaignId: string;
  batchIndex: number;
  attempt?: number;
  html: string;
  recipients: string[];
}

const OPERATIONS: Operation[] = [
  {
    campaignId: "aec-20260914-two-days",
    draftId: "draft-potential-06-tres-dias",
    subject: "En 2 días comienza CYBER.AR 2026",
    scheduledFor: null,
  },
  {
    campaignId: "aec-20260915-tomorrow",
    draftId: "draft-potential-07-manana",
    subject: "Mañana comienza CYBER.AR 2026",
    scheduledFor: "2026-09-15T13:00:00.000Z",
  },
];

function authorized(request: Request): boolean {
  const expected = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const provided = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();
  if (!expected || !provided) return false;
  const expectedBuffer = Buffer.from(expected);
  const providedBuffer = Buffer.from(provided);
  return (
    expectedBuffer.length === providedBuffer.length &&
    timingSafeEqual(expectedBuffer, providedBuffer)
  );
}

async function loadAllRows(
  table: string,
  select: string,
  options: { equals?: [string, string]; orders?: string[] } = {}
): Promise<Record<string, unknown>[]> {
  const supabase = createSupabaseServer();
  const rows: Record<string, unknown>[] = [];
  for (let from = 0; ; from += 1000) {
    let query = supabase.from(table).select(select);
    if (options.equals) query = query.eq(options.equals[0], options.equals[1]);
    for (const column of options.orders ?? []) query = query.order(column);
    const { data, error } = await query.range(from, from + 999);
    if (error) throw new Error(error.message);
    rows.push(...((data ?? []) as unknown as Record<string, unknown>[]));
    if (!data || data.length < 1000) return rows;
  }
}

async function writeChunks(
  table: string,
  rows: Record<string, unknown>[],
  mode: "insert" | "upsert"
) {
  const supabase = createSupabaseServer();
  for (let index = 0; index < rows.length; index += 500) {
    const chunk = rows.slice(index, index + 500);
    const query =
      mode === "upsert"
        ? supabase.from(table).upsert(chunk, { onConflict: "id" })
        : supabase.from(table).insert(chunk);
    const { error } = await query;
    if (error) throw new Error(error.message);
  }
}

async function resolveRecipients(): Promise<Recipient[]> {
  const [attendees, bouncedRows] = await Promise.all([
    loadAllRows(
      "asistentes_potenciales",
      "id,nombre,apellido,organizacion,email,registration_status,payment_status",
      { orders: ["created_at", "id"] }
    ),
    loadAllRows("attendee_email_deliveries", "recipient_email", {
      equals: ["status", "bounced"],
    }),
  ]);
  const bounced = new Set(
    bouncedRows.map((row) => String(row.recipient_email ?? "").trim().toLowerCase())
  );
  const seen = new Set<string>();
  const recipients: Recipient[] = [];

  for (const attendee of attendees) {
    const email = String(attendee.email ?? "").trim().toLowerCase();
    const registrationStatus = String(attendee.registration_status ?? "").trim().toLowerCase();
    const paymentStatus = String(attendee.payment_status ?? "").trim().toLowerCase();
    if (
      !EMAIL_RE.test(email) ||
      seen.has(email) ||
      bounced.has(email) ||
      registrationStatus === "confirmed" ||
      PAID_STATUSES.has(paymentStatus)
    ) {
      continue;
    }
    seen.add(email);
    const name = [attendee.nombre, attendee.apellido].filter(Boolean).join(" ").trim();
    recipients.push({
      attendeeId: String(attendee.id),
      email,
      name: name || String(attendee.organizacion ?? "").trim() || "Asistente",
      organization: String(attendee.organizacion ?? "").trim() || "—",
    });
  }
  return recipients;
}

async function markInvited(attendeeIds: string[]) {
  const supabase = createSupabaseServer();
  for (let index = 0; index < attendeeIds.length; index += 500) {
    const { error } = await supabase
      .from("asistentes_potenciales")
      .update({
        estado: "Invitación enviada",
        ultimo_contacto: new Date().toISOString().slice(0, 10),
        proxima_accion: "Dar seguimiento a la invitación",
      })
      .in("id", attendeeIds.slice(index, index + 500))
      .in("estado", ["Lead", "Contactado"]);
    if (error) throw new Error(error.message);
  }
}

async function executeOperation(operation: Operation, recipients: Recipient[]) {
  const supabase = createSupabaseServer();
  const { data: draft, error: draftError } = await supabase
    .from("attendee_email_drafts")
    .select("html")
    .eq("id", operation.draftId)
    .single();
  if (draftError) throw new Error(draftError.message);
  const html = String(draft.html ?? "").trim();
  if (!html) throw new Error(`El borrador ${operation.draftId} no tiene HTML`);

  const { data: existingCampaign, error: existingError } = await supabase
    .from("attendee_email_campaigns")
    .select("id")
    .eq("id", operation.campaignId)
    .maybeSingle();
  if (existingError) throw new Error(existingError.message);

  if (!existingCampaign) {
    const { from } = assertResendReady("attendees");
    const { error } = await supabase.from("attendee_email_campaigns").insert({
      id: operation.campaignId,
      subject: operation.subject,
      audience: "unconfirmed_unpaid",
      from_email: from,
      total_recipients: recipients.length,
      sent_count: 0,
      failed_count: 0,
      html,
      scheduled_for: operation.scheduledFor,
    });
    if (error) throw new Error(error.message);

    const snapshotRows = recipients.map((recipient, index) => ({
      id: `${operation.campaignId}-d${String(index).padStart(5, "0")}`,
      campaign_id: operation.campaignId,
      resend_email_id: null,
      attendee_id: recipient.attendeeId,
      recipient_email: recipient.email,
      recipient_name: recipient.name,
      organizacion: recipient.organization,
      status: "pending",
      sent_at: null,
      failed_at: null,
      last_event_at: null,
    }));
    await writeChunks("attendee_email_deliveries", snapshotRows, "insert");
  }

  const deliveryRows = await loadAllRows(
    "attendee_email_deliveries",
    "id,campaign_id,attendee_id,recipient_email,recipient_name,organizacion,status,resend_email_id",
    { equals: ["campaign_id", operation.campaignId], orders: ["id"] }
  );
  const resend = getResendClient();
  const { from } = assertResendReady("attendees");
  const acceptedAttendeeIds = new Set<string>();
  const errors: string[] = [];

  for (let index = 0; index < deliveryRows.length; index += BATCH_SIZE) {
    const chunk = deliveryRows.slice(index, index + BATCH_SIZE);
    if (chunk.every((row) => row.resend_email_id)) {
      chunk.forEach((row) => acceptedAttendeeIds.add(String(row.attendee_id)));
      continue;
    }
    const payload = chunk.map((row) => ({
      from,
      to: [String(row.recipient_email)],
      subject: operation.subject,
      html,
      tags: [{ name: "campaign_id", value: operation.campaignId }],
      ...(operation.scheduledFor ? { scheduledAt: operation.scheduledFor } : {}),
    }));
    const result = await resend.batch.send(payload, {
      idempotencyKey: `${operation.campaignId}-batch-${index / BATCH_SIZE}`,
    });
    const eventAt = new Date().toISOString();
    if (result.error) {
      errors.push(result.error.message);
      await writeChunks(
        "attendee_email_deliveries",
        chunk.map((row) => ({
          ...row,
          status: "failed",
          failed_at: eventAt,
          last_event_at: eventAt,
        })),
        "upsert"
      );
      continue;
    }

    const emailIds = result.data?.data ?? [];
    await writeChunks(
      "attendee_email_deliveries",
      chunk.map((row, chunkIndex) => {
        const resendEmailId = emailIds[chunkIndex]?.id ?? null;
        if (resendEmailId) acceptedAttendeeIds.add(String(row.attendee_id));
        return {
          ...row,
          resend_email_id: resendEmailId,
          status: resendEmailId ? (operation.scheduledFor ? "pending" : "sent") : "failed",
          sent_at: resendEmailId && !operation.scheduledFor ? eventAt : null,
          failed_at: resendEmailId ? null : eventAt,
          last_event_at: eventAt,
        };
      }),
      "upsert"
    );
  }

  const finalRows = await loadAllRows(
    "attendee_email_deliveries",
    "status,resend_email_id",
    { equals: ["campaign_id", operation.campaignId] }
  );
  const sent = finalRows.filter((row) =>
    ["sent", "delivered", "bounced", "delayed"].includes(String(row.status))
  ).length;
  const failed = finalRows.filter((row) => row.status === "failed").length;
  const accepted = finalRows.filter((row) => row.resend_email_id).length;
  const { error: countError } = await supabase
    .from("attendee_email_campaigns")
    .update({ sent_count: sent, failed_count: failed })
    .eq("id", operation.campaignId);
  if (countError) throw new Error(countError.message);

  if (!operation.scheduledFor) {
    await markInvited([...acceptedAttendeeIds]);
  }

  return {
    campaignId: operation.campaignId,
    subject: operation.subject,
    scheduledFor: operation.scheduledFor,
    recipients: finalRows.length,
    accepted,
    sent,
    failed,
    errors: [...new Set(errors)].slice(0, 5),
  };
}

export async function POST(request: Request) {
  if (!authorized(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const input = (await request.json().catch(() => null)) as BatchProxyInput | null;
    if (input?.mode === "batch") {
      const operation = OPERATIONS.find((item) => item.campaignId === input.campaignId);
      if (
        !operation ||
        !Number.isInteger(input.batchIndex) ||
        input.batchIndex < 0 ||
        !Number.isInteger(input.attempt ?? 0) ||
        (input.attempt ?? 0) < 0 ||
        (input.attempt ?? 0) > 5 ||
        !input.html?.includes("CYBER.AR") ||
        input.html.length > 200_000 ||
        !Array.isArray(input.recipients) ||
        input.recipients.length === 0 ||
        input.recipients.length > BATCH_SIZE ||
        input.recipients.some((email) => !EMAIL_RE.test(String(email).trim()))
      ) {
        return Response.json({ error: "Invalid batch payload" }, { status: 400 });
      }
      const { from } = assertResendReady("attendees");
      const result = await getResendClient().batch.send(
        input.recipients.map((email) => ({
          from,
          to: [email],
          subject: operation.subject,
          html: input.html,
          tags: [{ name: "campaign_id", value: operation.campaignId }],
          ...(operation.scheduledFor ? { scheduledAt: operation.scheduledFor } : {}),
        })),
        {
          idempotencyKey:
            (input.attempt ?? 0) === 0
              ? `${operation.campaignId}-batch-${input.batchIndex}`
              : `${operation.campaignId}-batch-${input.batchIndex}-attempt-${input.attempt}`,
        }
      );
      if (result.error) {
        return Response.json({ error: result.error.message }, { status: 502 });
      }
      return Response.json({ ids: (result.data?.data ?? []).map((item) => item.id) });
    }

    const recipients = await resolveRecipients();
    const results = [];
    for (const operation of OPERATIONS) {
      results.push(await executeOperation(operation, recipients));
    }
    return Response.json({ recipientsResolved: recipients.length, results });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 }
    );
  }
}
