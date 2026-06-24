// Runtime schema router — selects PostgreSQL or SQLite schema based on DATABASE_URL.
// This replaces the unreliable webpack alias approach: Vercel may not expose
// DATABASE_URL at next build time, causing the alias to silently fall back to
// the SQLite schema and sending Unix-second integers to PostgreSQL timestamps.

const isPg =
  (process.env.DATABASE_URL ?? "").startsWith("postgresql://") ||
  (process.env.DATABASE_URL ?? "").startsWith("postgres://");

/* eslint-disable @typescript-eslint/no-require-imports */
const schemaModule = isPg
  ? (require("./schema-pg") as typeof import("./schema-pg"))
  : (require("./schema-sqlite") as unknown as typeof import("./schema-pg"));
/* eslint-enable @typescript-eslint/no-require-imports */

export const {
  memberRanks,
  members,
  admins,
  shippingAddresses,
  products,
  inventory,
  inventoryReceipts,
  orders,
  orderItems,
  monthlyInvoices,
  auditLogs,
  terms,
  systemSettings,
  notifications,
  announcements,
  announcementReads,
  memberRanksRelations,
  membersRelations,
  shippingAddressesRelations,
  productsRelations,
  inventoryRelations,
  inventoryReceiptsRelations,
  ordersRelations,
  orderItemsRelations,
  monthlyInvoicesRelations,
  notificationsRelations,
  announcementsRelations,
  announcementReadsRelations,
} = schemaModule;

// ─── Type aliases (DB-agnostic) ───────────────────────────────────────────────

export type MemberStatus = "pending" | "approved" | "rejected" | "suspended";
export type OrderStatus = "pending" | "confirmed" | "shipped" | "delivered" | "cancelled" | "cancel_requested";
export type ActorRole = "admin" | "member";

// ─── Inferred types (PG-based for production accuracy) ────────────────────────

export type MemberRank = typeof memberRanks.$inferSelect;
export type NewMemberRank = typeof memberRanks.$inferInsert;
export type Admin = typeof admins.$inferSelect;
export type NewAdmin = typeof admins.$inferInsert;
export type Member = typeof members.$inferSelect;
export type NewMember = typeof members.$inferInsert;
export type ShippingAddress = typeof shippingAddresses.$inferSelect;
export type NewShippingAddress = typeof shippingAddresses.$inferInsert;
export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
export type Inventory = typeof inventory.$inferSelect;
export type NewInventory = typeof inventory.$inferInsert;
export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
export type OrderItem = typeof orderItems.$inferSelect;
export type NewOrderItem = typeof orderItems.$inferInsert;
export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;
export type Terms = typeof terms.$inferSelect;
export type NewTerms = typeof terms.$inferInsert;
export type InventoryReceipt = typeof inventoryReceipts.$inferSelect;
export type NewInventoryReceipt = typeof inventoryReceipts.$inferInsert;
export type MonthlyInvoice = typeof monthlyInvoices.$inferSelect;
export type NewMonthlyInvoice = typeof monthlyInvoices.$inferInsert;
export type SystemSettings = typeof systemSettings.$inferSelect;
export type NewSystemSettings = typeof systemSettings.$inferInsert;
export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
export type Announcement = typeof announcements.$inferSelect;
export type NewAnnouncement = typeof announcements.$inferInsert;
export type AnnouncementRead = typeof announcementReads.$inferSelect;
