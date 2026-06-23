// SQLite schema（ローカル開発用）
// 本番 Neon PostgreSQL は schema.pg.ts を参照
import {
  sqliteTable,
  text,
  integer,
  real,
  index,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
import { relations, sql } from "drizzle-orm";

// ─── member_ranks ─────────────────────────────────────────────────────────────
// rate: 掛け率 (0.35 〜 1.00)

export const memberRanks = sqliteTable("member_ranks", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull().unique(),
  rate: real("rate").notNull(),
  minMonthlyBoxes: integer("min_monthly_boxes").notNull().default(0),
  description: text("description"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// ─── admins ───────────────────────────────────────────────────────────────────

export const admins = sqliteTable(
  "admins",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    email: text("email").notNull(),
    password: text("password").notNull(),
    name: text("name").notNull(),
    role: text("role").notNull().default("editor"), // superadmin | editor | viewer
    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [uniqueIndex("admins_email_idx").on(t.email)]
);

// ─── members ──────────────────────────────────────────────────────────────────
// status: 'pending' | 'approved' | 'rejected' | 'suspended'

export const members = sqliteTable(
  "members",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    email: text("email").notNull(),
    password: text("password").notNull(),
    companyName: text("company_name").notNull(),
    contactName: text("contact_name").notNull(),
    phone: text("phone").notNull(),
    address: text("address").notNull(),
    businessDescription: text("business_description"),
    status: text("status", {
      enum: ["pending", "approved", "rejected", "suspended"],
    })
      .notNull()
      .default("pending"),
    rankId: text("rank_id")
      .notNull()
      .references(() => memberRanks.id),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [uniqueIndex("members_email_idx").on(t.email)]
);

// ─── shipping_addresses ───────────────────────────────────────────────────────

export const shippingAddresses = sqliteTable("shipping_addresses", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  memberId: text("member_id")
    .notNull()
    .references(() => members.id),
  label: text("label").notNull(),
  recipientName: text("recipient_name").notNull(),
  postalCode: text("postal_code").notNull(),
  prefecture: text("prefecture").notNull(),
  address1: text("address1").notNull(),
  address2: text("address2"),
  phone: text("phone").notNull(),
  isDefault: integer("is_default", { mode: "boolean" }).notNull().default(false),
  deletedAt: integer("deleted_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// ─── products ─────────────────────────────────────────────────────────────────
// retailPrice: 定価（円）, bottlesPerBox: 箱あたり本数（24固定）

export const products = sqliteTable("products", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  description: text("description"),
  imageUrl: text("image_url"),
  retailPrice: integer("retail_price").notNull().default(3880),
  bottlesPerBox: integer("bottles_per_box").notNull().default(24),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// ─── inventory ────────────────────────────────────────────────────────────────

export const inventory = sqliteTable("inventory", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  productId: text("product_id")
    .notNull()
    .unique()
    .references(() => products.id),
  availableBoxes: integer("available_boxes").notNull().default(0),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedBy: text("updated_by"),
});

// ─── orders ───────────────────────────────────────────────────────────────────
// status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'

export const orders = sqliteTable(
  "orders",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    orderNo: text("order_no").notNull().unique(),
    memberId: text("member_id")
      .notNull()
      .references(() => members.id),
    shippingAddressId: text("shipping_address_id")
      .notNull()
      .references(() => shippingAddresses.id),
    status: text("status", {
      enum: ["pending", "confirmed", "shipped", "delivered", "cancelled"],
    })
      .notNull()
      .default("pending"),
    subtotal: integer("subtotal").notNull(),
    total: integer("total").notNull(),
    trackingNumber: text("tracking_number"),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [
    index("orders_member_id_idx").on(t.memberId),
    index("orders_status_idx").on(t.status),
  ]
);

// ─── order_items ──────────────────────────────────────────────────────────────

export const orderItems = sqliteTable("order_items", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  orderId: text("order_id")
    .notNull()
    .references(() => orders.id),
  productId: text("product_id")
    .notNull()
    .references(() => products.id),
  productName: text("product_name").notNull(),
  boxes: integer("boxes").notNull(),
  bottlesPerBox: integer("bottles_per_box").notNull(),
  unitPricePerBox: integer("unit_price_per_box").notNull(),
  rateApplied: real("rate_applied").notNull(),
  subtotal: integer("subtotal").notNull(),
});

// ─── audit_logs ───────────────────────────────────────────────────────────────
// beforeValue / afterValue: JSON 文字列として保存

export const auditLogs = sqliteTable(
  "audit_logs",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    actorId: text("actor_id").notNull(),
    actorRole: text("actor_role", { enum: ["admin", "member"] }).notNull(),
    action: text("action").notNull(),
    targetType: text("target_type").notNull(),
    targetId: text("target_id"),
    beforeValue: text("before_value"),
    afterValue: text("after_value"),
    ipAddress: text("ip_address"),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [
    index("audit_logs_actor_idx").on(t.actorId),
    index("audit_logs_created_at_idx").on(t.createdAt),
  ]
);

// ─── terms ────────────────────────────────────────────────────────────────────

export const terms = sqliteTable("terms", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  content: text("content").notNull().default(""),
  isPublished: integer("is_published", { mode: "boolean" }).notNull().default(false),
  publishedAt: integer("published_at", { mode: "timestamp" }),
  version: integer("version").notNull().default(1),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedBy: text("updated_by").notNull().default("system"),
});

// ─── Relations ────────────────────────────────────────────────────────────────

export const memberRanksRelations = relations(memberRanks, ({ many }) => ({
  members: many(members),
}));

export const membersRelations = relations(members, ({ one, many }) => ({
  rank: one(memberRanks, {
    fields: [members.rankId],
    references: [memberRanks.id],
  }),
  shippingAddresses: many(shippingAddresses),
  orders: many(orders),
}));

export const shippingAddressesRelations = relations(
  shippingAddresses,
  ({ one, many }) => ({
    member: one(members, {
      fields: [shippingAddresses.memberId],
      references: [members.id],
    }),
    orders: many(orders),
  })
);

export const productsRelations = relations(products, ({ one, many }) => ({
  inventory: one(inventory, {
    fields: [products.id],
    references: [inventory.productId],
  }),
  orderItems: many(orderItems),
}));

export const inventoryRelations = relations(inventory, ({ one }) => ({
  product: one(products, {
    fields: [inventory.productId],
    references: [products.id],
  }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  member: one(members, {
    fields: [orders.memberId],
    references: [members.id],
  }),
  shippingAddress: one(shippingAddresses, {
    fields: [orders.shippingAddressId],
    references: [shippingAddresses.id],
  }),
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));

// ─── Inferred Types ───────────────────────────────────────────────────────────

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

// ─── Status type aliases ──────────────────────────────────────────────────────

export type MemberStatus = "pending" | "approved" | "rejected" | "suspended";
export type OrderStatus = "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";
export type ActorRole = "admin" | "member";
