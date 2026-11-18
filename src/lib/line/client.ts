import type { LineNotificationResult, LinePushRequest } from "./types";

const LINE_PUSH_ENDPOINT = "https://api.line.me/v2/bot/message/push";
const DEFAULT_TIMEOUT_MS = 2_500;

export type LineClientConfig = {
  channelAccessToken?: string;
  groupId?: string;
  pushEndpoint?: string;
  timeoutMs?: number;
};

export type PushTextMessageParams = {
  text: string;
  retryKey: string;
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableStatus(status: number): boolean {
  return status >= 500 && status < 600;
}

function isValidConfig(config: LineClientConfig): config is Required<Pick<LineClientConfig, "channelAccessToken" | "groupId">> &
  LineClientConfig {
  return Boolean(config.channelAccessToken && config.groupId);
}

export async function pushTextMessage(
  params: PushTextMessageParams,
  config: LineClientConfig = {
    channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
    groupId: process.env.LINE_ORDER_NOTIFICATION_GROUP_ID,
  }
): Promise<LineNotificationResult> {
  if (!isValidConfig(config)) {
    return { status: "failed", category: "invalid_config", retryKey: params.retryKey };
  }

  const endpoint = config.pushEndpoint ?? LINE_PUSH_ENDPOINT;
  const timeoutMs = config.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const body: LinePushRequest = {
    to: config.groupId,
    messages: [{ type: "text", text: params.text }],
  };

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.channelAccessToken}`,
          "Content-Type": "application/json",
          "X-Line-Retry-Key": params.retryKey,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (response.ok) {
        return { status: "sent", httpStatus: response.status, retryKey: params.retryKey };
      }

      if (response.status === 429) {
        return {
          status: "failed",
          category: "line_rate_limit",
          httpStatus: response.status,
          retryKey: params.retryKey,
        };
      }

      if (!isRetryableStatus(response.status) || attempt === 2) {
        return {
          status: "failed",
          category: "line_http",
          httpStatus: response.status,
          retryKey: params.retryKey,
        };
      }
    } catch (error) {
      const category = error instanceof DOMException && error.name === "AbortError" ? "timeout" : "network";
      if (attempt === 2) {
        return { status: "failed", category, retryKey: params.retryKey };
      }
    } finally {
      clearTimeout(timeout);
    }

    await sleep(100 * 2 ** attempt);
  }

  return { status: "failed", category: "network", retryKey: params.retryKey };
}

export async function getLineQuota(channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN) {
  if (!channelAccessToken) return null;
  const response = await fetch("https://api.line.me/v2/bot/message/quota", {
    headers: { Authorization: `Bearer ${channelAccessToken}` },
  });
  return response.ok ? response.json() : null;
}

export async function getLineQuotaConsumption(channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN) {
  if (!channelAccessToken) return null;
  const response = await fetch("https://api.line.me/v2/bot/message/quota/consumption", {
    headers: { Authorization: `Bearer ${channelAccessToken}` },
  });
  return response.ok ? response.json() : null;
}
