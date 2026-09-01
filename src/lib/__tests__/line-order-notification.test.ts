import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { POST as lineWebhookPost } from "../../app/api/webhooks/line/route";
import { pushTextMessage } from "../line/client";
import { buildOrderNotificationText, lineRetryKeyForOrder, notifyNewOrder } from "../line/order-notification";
import { createLineSignature, verifyLineSignature } from "../line/verify-signature";
import { sendOrderPostCommitNotifications } from "../orders/post-commit-notifications";
import type { LineNotificationResult, LineOrderNotificationInput } from "../line/types";

const originalEnv = { ...process.env };
const originalFetch = globalThis.fetch;
const originalError = console.error;

function restore() {
  process.env = { ...originalEnv };
  globalThis.fetch = originalFetch;
  console.error = originalError;
}

function sampleOrder(): LineOrderNotificationInput {
  return {
    orderId: "123e4567-e89b-12d3-a456-426614174000",
    orderNo: "ORD-20260901-0001",
    memberCompanyName: "Cami 表参道店",
    items: [
      { productName: "Cami Oil Smooth", boxes: 2 },
      { productName: "Cami Oil Rich", boxes: 1 },
    ],
    total: 51216,
    createdAt: new Date("2026-09-01T01:30:00.000Z"),
  };
}

async function testSignature() {
  restore();
  const body = JSON.stringify({ destination: "Uxxx", events: [] });
  const secret = "test-channel-secret";
  const signature = await createLineSignature(body, secret);

  assert.equal(await verifyLineSignature({ body, channelSecret: secret, signature }), true);
  assert.equal(await verifyLineSignature({ body: `${body} `, channelSecret: secret, signature }), false);
  assert.equal(await verifyLineSignature({ body, channelSecret: secret, signature: "invalid" }), false);

  process.env.LINE_CHANNEL_SECRET = secret;
  const accepted = await lineWebhookPost(
    new NextRequest("https://example.test/api/webhooks/line", {
      method: "POST",
      body,
      headers: { "x-line-signature": signature },
    })
  );
  assert.equal(accepted.status, 200);

  const rejected = await lineWebhookPost(
    new NextRequest("https://example.test/api/webhooks/line", {
      method: "POST",
      body,
      headers: { "x-line-signature": "invalid" },
    })
  );
  assert.equal(rejected.status, 401);
}

async function testEnvAndDisabledSkip() {
  restore();
  process.env.LINE_ORDER_NOTIFICATIONS_ENABLED = "false";
  const disabled = await notifyNewOrder(sampleOrder());
  assert.deepEqual(disabled, { status: "skipped", reason: "disabled" });

  process.env.LINE_ORDER_NOTIFICATIONS_ENABLED = "true";
  delete process.env.LINE_CHANNEL_ACCESS_TOKEN;
  delete process.env.LINE_ORDER_NOTIFICATION_GROUP_ID;
  const missing = await notifyNewOrder(sampleOrder());
  assert.deepEqual(missing, { status: "skipped", reason: "missing_env" });
}

async function testMessageAndRetryKey() {
  restore();
  process.env.NEXT_PUBLIC_SITE_URL = "https://cami-order-system-production.cami-order-system.workers.dev";
  const text = buildOrderNotificationText(sampleOrder());

  assert.match(text, /【Cami 新規注文】/);
  assert.match(text, /注文番号：ORD-20260901-0001/);
  assert.match(text, /販売店：Cami 表参道店/);
  assert.match(text, /合計：￥51,216/);
  assert.match(text, /\/admin\/orders\/123e4567-e89b-12d3-a456-426614174000/);
  assert.equal(lineRetryKeyForOrder(sampleOrder().orderId), sampleOrder().orderId);
  assert.equal(lineRetryKeyForOrder("non-uuid-order"), lineRetryKeyForOrder("non-uuid-order"));
  assert.match(lineRetryKeyForOrder("non-uuid-order"), /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
}

async function testRetryAndFailureIsolation() {
  restore();
  const retryKeys: string[] = [];
  let attempts = 0;

  globalThis.fetch = (async (_input: RequestInfo | URL, init?: RequestInit) => {
    attempts += 1;
    retryKeys.push(String((init?.headers as Record<string, string>)["X-Line-Retry-Key"]));
    return new Response("temporary error", { status: attempts < 3 ? 500 : 200 });
  }) as typeof fetch;

  const result = await pushTextMessage(
    { text: "hello", retryKey: "123e4567-e89b-12d3-a456-426614174000" },
    {
      channelAccessToken: "token",
      groupId: "group",
      pushEndpoint: "https://example.test/push",
      timeoutMs: 100,
    }
  );

  assert.equal(result.status, "sent");
  assert.equal(attempts, 3);
  assert.deepEqual(new Set(retryKeys), new Set(["123e4567-e89b-12d3-a456-426614174000"]));

  let emailCalls = 0;
  let lineCalls = 0;
  await sendOrderPostCommitNotifications(
    {
      isDuplicate: false,
      email: { to: "member@example.test", companyName: "Cami 表参道店", orderNo: "ORD-1", total: 1000 },
      line: sampleOrder(),
    },
    {
      sendEmail: async () => {
        emailCalls += 1;
      },
      notifyLine: async () => {
        lineCalls += 1;
        return { status: "failed", category: "line_http", httpStatus: 500 } satisfies LineNotificationResult;
      },
      logger: { error: () => undefined },
    }
  );

  assert.equal(emailCalls, 1);
  assert.equal(lineCalls, 1);

  await sendOrderPostCommitNotifications(
    {
      isDuplicate: true,
      email: { to: "member@example.test", companyName: "Cami 表参道店", orderNo: "ORD-1", total: 1000 },
      line: sampleOrder(),
    },
    {
      sendEmail: async () => {
        throw new Error("duplicate should skip");
      },
      notifyLine: async () => {
        throw new Error("duplicate should skip");
      },
    }
  );
}

async function testTimeoutAndLogSafety() {
  restore();
  const logs: unknown[][] = [];
  console.error = (...args: unknown[]) => {
    logs.push(args);
  };
  process.env.LINE_ORDER_NOTIFICATIONS_ENABLED = "true";

  globalThis.fetch = (async (_input: RequestInfo | URL, init?: RequestInit) => {
    await new Promise((resolve, reject) => {
      init?.signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
      setTimeout(resolve, 1_000);
    });
    return new Response(null, { status: 200 });
  }) as typeof fetch;

  const result = await notifyNewOrder(sampleOrder(), {
    channelAccessToken: "super-secret-token",
    groupId: "very-secret-group-id",
    pushEndpoint: "https://example.test/push",
    timeoutMs: 10,
  });

  assert.equal(result.status, "failed");
  const serializedLogs = JSON.stringify(logs);
  assert.equal(serializedLogs.includes("super-secret-token"), false);
  assert.equal(serializedLogs.includes("very-secret-group-id"), false);
  assert.equal(serializedLogs.includes("ORD-20260901-0001"), true);
}

async function main() {
  await testSignature();
  await testEnvAndDisabledSkip();
  await testMessageAndRetryKey();
  await testRetryAndFailureIsolation();
  await testTimeoutAndLogSafety();
  restore();

  console.log("line order notification ok");
}

main().catch((error: unknown) => {
  restore();
  throw error;
});
