import { NextResponse } from "next/server";
import { processIncomingCustomerMessage } from "@/lib/data-store";
import { normalizePhone } from "@/lib/utils";

interface WhatsAppWebhookPayload {
  from?: string;
  name?: string;
  text?: string;
  timestamp?: string;
}

export async function POST(request: Request) {
  const body = (await request.json()) as WhatsAppWebhookPayload;

  if (!body.from || !body.text) {
    return NextResponse.json(
      { error: "Missing required fields: from, text" },
      { status: 400 },
    );
  }

  const result = await processIncomingCustomerMessage({
    phone: normalizePhone(body.from),
    name: body.name ?? null,
    text: body.text,
    timestamp: body.timestamp ?? new Date().toISOString(),
    source: "whatsapp_future",
  });

  return NextResponse.json({
    ok: true,
    conversationId: result.conversation.id,
    orderId: result.order?.id ?? null,
    status: result.order?.status ?? null,
    suggestedReply: result.parsed.suggestedReply,
    humanReviewRequired: result.parsed.humanReviewRequired,
  });
}
