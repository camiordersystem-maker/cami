import type { OrderStatus } from "@/lib/db/schema";

export const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ["confirmed", "cancelled", "cancel_requested"],
  confirmed: ["shipped", "cancelled", "cancel_requested"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
  cancel_requested: ["cancelled"],
};

export function canTransitionOrder(from: string, to: string): boolean {
  return (ORDER_TRANSITIONS[from as OrderStatus] ?? []).includes(to as OrderStatus);
}
