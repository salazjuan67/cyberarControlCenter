import type {
  NewsletterCampaign,
  NewsletterCampaignStats,
  NewsletterDeliveryRow,
  NewsletterDeliveryStatus,
} from "@/types/newsletter";

export function mapCampaign(row: Record<string, unknown>): NewsletterCampaign {
  return {
    id: row.id as string,
    subject: row.subject as string,
    audience: row.audience as NewsletterCampaign["audience"],
    fromEmail: row.from_email as string,
    totalRecipients: Number(row.total_recipients),
    sentCount: Number(row.sent_count),
    failedCount: Number(row.failed_count),
    createdAt: (row.created_at as string) ?? "",
  };
}

export function mapDelivery(row: Record<string, unknown>): NewsletterDeliveryRow {
  return {
    id: row.id as string,
    campaignId: row.campaign_id as string,
    resendEmailId: (row.resend_email_id as string) ?? "",
    sponsorId: (row.sponsor_id as string) ?? "",
    recipientEmail: row.recipient_email as string,
    recipientName: (row.recipient_name as string) ?? "",
    empresa: (row.empresa as string) ?? "",
    status: row.status as NewsletterDeliveryStatus,
    sentAt: (row.sent_at as string) ?? "",
    deliveredAt: (row.delivered_at as string) ?? "",
    bouncedAt: (row.bounced_at as string) ?? "",
    failedAt: (row.failed_at as string) ?? "",
    bounceReason: (row.bounce_reason as string) ?? "",
    lastEventAt: (row.last_event_at as string) ?? "",
  };
}

export function buildCampaignStats(
  campaign: NewsletterCampaign,
  deliveries: NewsletterDeliveryRow[]
): NewsletterCampaignStats {
  const total = deliveries.length || campaign.totalRecipients;
  const delivered = deliveries.filter((d) => d.status === "delivered").length;
  const bounced = deliveries.filter((d) => d.status === "bounced").length;
  const failed = deliveries.filter((d) => d.status === "failed").length;
  const sent = deliveries.filter((d) =>
    ["sent", "delivered", "bounced", "delayed"].includes(d.status)
  ).length;
  const pending = deliveries.filter((d) =>
    ["pending", "sent", "delayed"].includes(d.status)
  ).length;

  const resolved = delivered + bounced + failed;
  const deliveryRate = resolved > 0 ? Math.round((delivered / resolved) * 100) : 0;
  const bounceRate = resolved > 0 ? Math.round((bounced / resolved) * 100) : 0;

  return {
    campaignId: campaign.id,
    subject: campaign.subject,
    createdAt: campaign.createdAt,
    total,
    sent,
    delivered,
    bounced,
    failed,
    pending,
    deliveryRate,
    bounceRate,
  };
}

export function statusFromResendEvent(
  eventType: string
): NewsletterDeliveryStatus | null {
  switch (eventType) {
    case "email.sent":
      return "sent";
    case "email.delivered":
      return "delivered";
    case "email.bounced":
      return "bounced";
    case "email.failed":
      return "failed";
    case "email.delivery_delayed":
      return "delayed";
    default:
      return null;
  }
}

export function eventTimestamp(event: { created_at?: string }): string {
  return event.created_at ?? new Date().toISOString();
}
