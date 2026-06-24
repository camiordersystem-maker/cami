export const TAX_RATE = 0.10;
export const INVENTORY_WARNING_THRESHOLD = 10;

export const NOTIFICATION_TYPES = {
  INVOICE_ISSUED: "invoice_issued",
  ORDER_CONFIRMED: "order_confirmed",
  ORDER_SHIPPED: "order_shipped",
} as const;

export type NotificationType = typeof NOTIFICATION_TYPES[keyof typeof NOTIFICATION_TYPES];
export type AnnouncementType = "all" | "individual";
