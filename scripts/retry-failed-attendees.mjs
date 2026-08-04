import fs from "fs";
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { normalizeNewsletterHtml } from "../lib/newsletter/html.ts";

config({ path: ".env.local" });

const campaignId = process.argv[2];
const htmlPath = process.argv[3];

if (!campaignId || !htmlPath) {
  console.error("Uso: npx tsx scripts/retry-failed-attendees.mjs <campaignId> <ruta-al-html>");
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const apiKey = process.env.RESEND_API_KEY?.trim();
const from =
  process.env.RESEND_FROM_EMAIL_ATTENDEES?.trim() ||
  process.env.RESEND_FROM_EMAIL?.trim();

if (!url || !key || !apiKey || !from) {
  console.error("Faltan variables de Supabase o Resend en .env.local");
  process.exit(1);
}

if (!fs.existsSync(htmlPath)) {
  console.error("No se encontró el archivo HTML:", htmlPath);
  process.exit(1);
}

const BATCH_SIZE = 100;
const supabase = createClient(url, key, { auth: { persistSession: false } });
const resend = new Resend(apiKey);
const html = normalizeNewsletterHtml(fs.readFileSync(htmlPath, "utf8"));

const { data: campaign, error: campaignError } = await supabase
  .from("attendee_email_campaigns")
  .select("*")
  .eq("id", campaignId)
  .maybeSingle();

if (campaignError || !campaign) {
  console.error("Campaña no encontrada:", campaignError?.message);
  process.exit(1);
}

const { data: failedRows, error: failedError } = await supabase
  .from("attendee_email_deliveries")
  .select("*")
  .eq("campaign_id", campaignId)
  .eq("status", "failed")
  .order("recipient_email");

if (failedError) {
  console.error(failedError.message);
  process.exit(1);
}

const deliveries = failedRows ?? [];
console.log(`Campaña: ${campaign.subject}`);
console.log(`Fallidos a reenviar: ${deliveries.length}`);

if (deliveries.length === 0) {
  console.log("Nada que reenviar.");
  process.exit(0);
}

let sent = 0;
let failed = 0;

for (let i = 0; i < deliveries.length; i += BATCH_SIZE) {
  const chunk = deliveries.slice(i, i + BATCH_SIZE);
  const payload = chunk.map((row) => ({
    from,
    to: [row.recipient_email],
    subject: campaign.subject,
    html,
    tags: [{ name: "campaign_id", value: campaignId }],
  }));

  const { data, error } = await resend.batch.send(payload);
  const now = new Date().toISOString();

  if (error) {
    failed += chunk.length;
    console.error(`Batch ${i / BATCH_SIZE + 1} error:`, error.message);
    continue;
  }

  const emailIds = data?.data ?? [];
  for (let index = 0; index < chunk.length; index++) {
    const row = chunk[index];
    const resendEmailId = emailIds[index]?.id ?? null;
    const accepted = Boolean(resendEmailId);
    if (accepted) sent += 1;
    else failed += 1;

    await supabase
      .from("attendee_email_deliveries")
      .update({
        resend_email_id: resendEmailId,
        status: accepted ? "sent" : "failed",
        sent_at: accepted ? now : null,
        failed_at: accepted ? null : now,
        last_event_at: now,
      })
      .eq("id", row.id);
  }

  console.log(`  · ${Math.min(i + BATCH_SIZE, deliveries.length)}/${deliveries.length}`);
}

await supabase.from("attendee_email_campaigns").update({ html }).eq("id", campaignId);

const { data: allDeliveries } = await supabase
  .from("attendee_email_deliveries")
  .select("status")
  .eq("campaign_id", campaignId);

const sentCount = (allDeliveries ?? []).filter((row) =>
  ["sent", "delivered", "bounced", "delayed"].includes(String(row.status))
).length;
const failedCount = (allDeliveries ?? []).filter((row) => row.status === "failed").length;

await supabase
  .from("attendee_email_campaigns")
  .update({ sent_count: sentCount, failed_count: failedCount })
  .eq("id", campaignId);

console.log(`Listo. Reenviados: ${sent} · Siguen fallidos: ${failed}`);
console.log(`Campaña actualizada → enviados: ${sentCount}, fallidos: ${failedCount}`);
