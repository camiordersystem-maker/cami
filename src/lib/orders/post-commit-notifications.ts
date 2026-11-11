import { sendOrderConfirmation } from "@/lib/email";
import { notifyNewOrder } from "@/lib/line/order-notification";
import type { LineNotificationResult, LineOrderNotificationInput } from "@/lib/line/types";

export type OrderEmailNotificationInput = {
  to: string;
  companyName: string;
  orderNo: string;
  total: number;
};

export type OrderPostCommitNotificationInput = {
  isDuplicate: boolean;
  email: OrderEmailNotificationInput;
  line: LineOrderNotificationInput;
};

export type OrderPostCommitNotificationDeps = {
  sendEmail?: (input: OrderEmailNotificationInput) => Promise<void>;
  notifyLine?: (input: LineOrderNotificationInput) => Promise<LineNotificationResult>;
  logger?: Pick<Console, "error">;
};

export async function sendOrderPostCommitNotifications(
  input: OrderPostCommitNotificationInput,
  deps: OrderPostCommitNotificationDeps = {}
): Promise<void> {
  if (input.isDuplicate) return;

  const sendEmail = deps.sendEmail ?? sendOrderConfirmation;
  const notifyLine = deps.notifyLine ?? notifyNewOrder;
  const logger = deps.logger ?? console;

  try {
    await sendEmail(input.email);
  } catch (error) {
    logger.error("Order confirmation email failed:", error);
  }

  try {
    await notifyLine(input.line);
  } catch (error) {
    logger.error("line_order_notification_unhandled", {
      orderId: input.line.orderId,
      orderNo: input.line.orderNo,
      category: "unexpected",
      error: error instanceof Error ? error.name : "UnknownError",
    });
  }
}
