import {
  pgTable,
  text,
  integer,
  numeric,
  boolean,
  timestamp,
  jsonb,
  pgEnum,
  serial,
  varchar,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ─── Enums ────────────────────────────────────────────────────────────────────

export const memberStatusEnum = pgEnum("member_status", [
  "pending",
  "approved",
  "rejected",
  "suspended",
]);

export const orderStatusEnum = pgEnum("order_status", [
  "pending",
  "confirmed",
  "shipped",
  "delivered",
  "cancelled",
]);

export const actorRoleEnum = pgEnum("actor_role", ["admin", "member"]);

// ─── member_ranks ─────────────────────────────────────────────────────────────

export const memberRanks = pgTable("member_ranks", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull().unique(),
  rate: numeric("rate", { precision: 4, scale: 2 }).notNull(),
  minMonthlyBoxes: integer("min_monthly_boxes").notNull().default(0),
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ─── members ──────────────────────────────────────────────────────────────────

export const members = pgTable(
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
    status: memberStatusEnum("status").notNull().default("pending"),
    rankId: text("rank_id").notNull().references(() => memberRanks.id),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [uniqueIndex("members_email_idx").on(t.email)]
);

// ─── admins ───────────────────────────────────────────────────────────────────

export const admins = pgTable(
  "admins",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    email: text("email").notNull(),
    password: text("password").notNull(),
    name: text("name").notNull(),
    role: text("role").notNull().default("editor"), // superadmin | editor | viewer
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [uniqueIndex("admins_email_idx").on(t.email)]
);

// ─── shipping_addresses ───────────────────────────────────────────────────────

export const shippingAddresses = pgTable("shipping_addresses", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  memberId: text("member_id").notNull().references(() => members.id),
  label: text("label").notNull(),
  recipientName: text("recipient_name").notNull(),
  postalCode: varchar("postal_code", { length: 8 }).notNull(),
  prefecture: text("prefecture").notNull(),
  address1: text("address1").notNull(),
  address2: text("address2"),
  phone: text("phone").notNull(),
  isDefault: boolean("is_default").notNull().default(false),
  deletedAt: timestamp("deleted_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── products ─────────────────────────────────────────────────────────────────

export const products = pgTable("products", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  description: text("description"),
  imageUrl: text("image_url"),
  retailPrice: integer("retail_price").notNull().default(3880),
  bottlesPerBox: integer("bottles_per_box").notNull().default(24),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ─── inventory ────────────────────────────────────────────────────────────────

export const inventory = pgTable("inventory", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  productId: text("product_id")
    .notNull()
    .unique()
    .references(() => products.id),
  availableBoxes: integer("available_boxes").notNull().default(0),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  updatedBy: text("updated_by"),
});

// ─── orders ───────────────────────────────────────────────────────────────────

export const orders = pgTable(
  "orders",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    orderNo: text("order_no").notNull(),
    memberId: text("member_id").notNull().references(() => members.id),
    shippingAddressId: text("shipping_address_id")
      .notNull()
      .references(() => shippingAddresses.id),
    status: orderStatusEnum("status").notNull().default("pending"),
    subtotal: integer("subtotal").notNull(),
    taxRate: numeric("tax_rate", { precision: 4, scale: 2 }).notNull().default("0.10"),
    taxAmount: integer("tax_amount").notNull().default(0),
    total: integer("total").notNull(),
    paymentStatus: text("payment_status").notNull().default("unpaid"),
    paymentDueDate: timestamp("payment_due_date"),
    trackingNumber: text("tracking_number"),
    cancelReason: text("cancel_reason"),
    memo: text("memo"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("orders_order_no_idx").on(t.orderNo),
    index("orders_member_id_idx").on(t.memberId),
    index("orders_status_idx").on(t.status),
  ]
);

// ─── order_items ──────────────────────────────────────────────────────────────

export const orderItems = pgTable("order_items", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  orderId: text("order_id").notNull().references(() => orders.id),
  productId: text("product_id").notNull().references(() => products.id),
  productName: text("product_name").notNull(),
  boxes: integer("boxes").notNull(),
  bottlesPerBox: integer("bottles_per_box").notNull(),
  unitPricePerBox: integer("unit_price_per_box").notNull(),
  rateApplied: numeric("rate_applied", { precision: 4, scale: 2 }).notNull(),
  subtotal: integer("subtotal").notNull(),
});

// ─── audit_logs ───────────────────────────────────────────────────────────────

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    actorId: text("actor_id").notNull(),
    actorRole: actorRoleEnum("actor_role").notNull(),
    action: text("action").notNull(),
    targetType: text("target_type").notNull(),
    targetId: text("target_id"),
    beforeValue: jsonb("before_value"),
    afterValue: jsonb("after_value"),
    ipAddress: text("ip_address"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("audit_logs_actor_idx").on(t.actorId),
    index("audit_logs_target_idx").on(t.targetType, t.targetId),
    index("audit_logs_created_at_idx").on(t.createdAt),
  ]
);

// ─── inventory_receipts ───────────────────────────────────────────────────────

export const inventoryReceipts = pgTable("inventory_receipts", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  productId: text("product_id").notNull().references(() => products.id),
  boxes: integer("boxes").notNull(),
  previousBoxes: integer("previous_boxes").notNull(),
  newBoxes: integer("new_boxes").notNull(),
  note: text("note"),
  receivedBy: text("received_by").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── monthly_invoices ─────────────────────────────────────────────────────────

export const monthlyInvoices = pgTable("monthly_invoices", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  invoiceNo: text("invoice_no").notNull().unique(),
  memberId: text("member_id").notNull().references(() => members.id),
  year: integer("year").notNull(),
  month: integer("month").notNull(),
  subtotal: integer("subtotal").notNull().default(0),
  taxAmount: integer("tax_amount").notNull().default(0),
  total: integer("total").notNull().default(0),
  paymentStatus: text("payment_status").notNull().default("unpaid"),
  paymentDueDate: timestamp("payment_due_date"),
  note: text("note"),
  issuedAt: timestamp("issued_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ─── terms ────────────────────────────────────────────────────────────────────

export const terms = pgTable("terms", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  content: text("content").notNull().default(""),
  isPublished: boolean("is_published").notNull().default(false),
  publishedAt: timestamp("published_at"),
  version: integer("version").notNull().default(1),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
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

export const inventoryReceiptsRelations = relations(inventoryReceipts, ({ one }) => ({
  product: one(products, {
    fields: [inventoryReceipts.productId],
    references: [products.id],
  }),
}));

export const monthlyInvoicesRelations = relations(monthlyInvoices, ({ one }) => ({
  member: one(members, {
    fields: [monthlyInvoices.memberId],
    references: [members.id],
  }),
}));
