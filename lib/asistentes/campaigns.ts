import type {
  AttendeeDeliveryStatus,
  AttendeeEmailCampaign,
  AttendeeEmailCampaignStats,
  AttendeeEmailDeliveryRow,
} from "@/types/asistentes";

export function mapAttendeeCampaign(row: Record<string, unknown>): AttendeeEmailCampaign {
  return {
    id: row.id as string,
    subject: row.subject as string,
    audience: row.audience as AttendeeEmailCampaign["audience"],
    fromEmail: row.from_email as string,
    totalRecipients: Number(row.total_recipients),
    sentCount: Number(row.sent_count),
    failedCount: Number(row.failed_count),
    createdAt: (row.created_at as string) ?? "",
    html: (row.html as string) ?? "",
  };
}

export function mapAttendeeDelivery(row: Record<string, unknown>): AttendeeEmailDeliveryRow {
  return {
    id: row.id as string,
    campaignId: row.campaign_id as string,
    resendEmailId: (row.resend_email_id as string) ?? "",
    attendeeId: (row.attendee_id as string) ?? "",
    recipientEmail: row.recipient_email as string,
    recipientName: (row.recipient_name as string) ?? "",
    organizacion: (row.organizacion as string) ?? "",
    status: row.status as AttendeeDeliveryStatus,
    sentAt: (row.sent_at as string) ?? "",
    deliveredAt: (row.delivered_at as string) ?? "",
    bouncedAt: (row.bounced_at as string) ?? "",
    failedAt: (row.failed_at as string) ?? "",
    bounceReason: (row.bounce_reason as string) ?? "",
    lastEventAt: (row.last_event_at as string) ?? "",
  };
}

export function buildAttendeeCampaignStats(
  campaign: AttendeeEmailCampaign,
  deliveries: AttendeeEmailDeliveryRow[]
): AttendeeEmailCampaignStats {
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
