export type LineMessage = {
  type: "text";
  text: string;
};

export type LinePushRequest = {
  to: string;
  messages: LineMessage[];
};

export type LineWebhookSource =
  | {
      type: "group";
      groupId: string;
    }
  | {
      type: "user";
      userId: string;
    }
  | {
      type: "room";
      roomId: string;
    };

export type LineWebhookMessageEvent = {
  type: "message";
  message: {
    type: string;
    text?: string;
  };
  source?: LineWebhookSource;
};

export type LineWebhookEvent = LineWebhookMessageEvent | { type: string; source?: LineWebhookSource };

export type LineWebhookPayload = {
  destination?: string;
  events?: LineWebhookEvent[];
};

export type LineOrderNotificationItem = {
  productName: string;
  boxes: number;
};

export type LineOrderNotificationInput = {
  orderId: string;
  orderNo: string;
  memberCompanyName: string;
  items: LineOrderNotificationItem[];
  total: number;
  createdAt: Date;
};

export type LineNotificationResult =
  | {
      status: "skipped";
      reason: "disabled" | "missing_env";
    }
  | {
      status: "sent";
      httpStatus: number;
      retryKey: string;
    }
  | {
      status: "failed";
      category: "line_http" | "line_rate_limit" | "timeout" | "network" | "invalid_config";
      httpStatus?: number;
      retryKey?: string;
    };
