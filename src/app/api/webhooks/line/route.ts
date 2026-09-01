import { NextRequest, NextResponse } from "next/server";
import { verifyLineSignature } from "@/lib/line/verify-signature";
import type { LineWebhookEvent, LineWebhookPayload } from "@/lib/line/types";

export const runtime = "nodejs";

function isLineWebhookPayload(value: unknown): value is LineWebhookPayload {
  if (!value || typeof value !== "object") return false;
  const payload = value as { events?: unknown };
  return payload.events === undefined || Array.isArray(payload.events);
}

function maskGroupId(groupId: string): string {
  if (groupId.length <= 8) return "****";
  return `${groupId.slice(0, 4)}...${groupId.slice(-4)}`;
}

function isTextMessageGroupEvent(event: LineWebhookEvent): event is {
  type: "message";
  message: { type: "text"; text: string };
  source: { type: "group"; groupId: string };
} {
  return (
    event.type === "message" &&
    event.source?.type === "group" &&
    "message" in event &&
    event.message.type === "text" &&
    typeof event.message.text === "string"
  );
}

function maybeLogSetupGroupId(payload: LineWebhookPayload) {
  const setupToken = process.env.LINE_GROUP_SETUP_TOKEN;
  if (!setupToken) return;

  for (const event of payload.events ?? []) {
    if (isTextMessageGroupEvent(event) && event.message.text === `#cami-setup ${setupToken}`) {
      console.info("line_group_setup_matched", {
        groupId: event.source.groupId,
        maskedGroupId: maskGroupId(event.source.groupId),
      });
    }
  }
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-line-signature");

  const valid = await verifyLineSignature({
    body: rawBody,
    channelSecret: process.env.LINE_CHANNEL_SECRET,
    signature,
  });

  if (!valid) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  if (!isLineWebhookPayload(payload)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  maybeLogSetupGroupId(payload);

  return NextResponse.json({ ok: true });
}
