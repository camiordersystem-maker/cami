import {
  pgTable,
  text,
  integer,
  numeric,
  boolean,
  timestamp,
  jsonb,
  pgEnum,
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
  "cancel_requested",
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
    shippingFee: integer("shipping_fee").notNull().default(0),
    trackingNumber: text("tracking_number"),
    cancelReason: text("cancel_reason"),
    cancelBeforeStatus: text("cancel_before_status"),
    memo: text("memo"),
    deliveredAt: timestamp("delivered_at"),
    lastStatusChangedAt: timestamp("last_status_changed_at"),
    lastStatusChangedBy: text("last_status_changed_by"),
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

// 請求書発行時点で対象となった注文を固定するスナップショット。
// orders.status は発行後も変わり得る（例: pending→confirmed）ため、
// このテーブルなしで期間+ステータスの動的再集計に頼ると、発行済み請求書の
// 内訳一覧と保存済みの合計金額が食い違うバグになる。
export const invoiceOrders = pgTable(
  "invoice_orders",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    invoiceId: text("invoice_id").notNull().references(() => monthlyInvoices.id),
    orderId: text("order_id").notNull().references(() => orders.id),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("invoice_orders_invoice_order_unique").on(t.invoiceId, t.orderId),
    index("invoice_orders_invoice_idx").on(t.invoiceId),
  ]
);

// ─── system_settings ──────────────────────────────────────────────────────────

export const systemSettings = pgTable("system_settings", {
  id: text("id").primaryKey().default("singleton"),
  companyName: text("company_name").notNull().default(""),
  companyPostalCode: text("company_postal_code").notNull().default(""),
  companyAddress: text("company_address").notNull().default(""),
  companyTel: text("company_tel").notNull().default(""),
  companyEmail: text("company_email").notNull().default(""),
  invoiceRegistrationNo: text("invoice_registration_no").notNull().default(""),
  supportEmail: text("support_email").notNull().default(""),
  lowStockThreshold: integer("low_stock_threshold").notNull().default(10),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  updatedBy: text("updated_by"),
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

// ─── inventory_movements ─────────────────────────────────────────────────────

export const inventoryMovements = pgTable(
  "inventory_movements",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    productId: text("product_id").notNull().references(() => products.id),
    orderId: text("order_id").references(() => orders.id),
    movementType: text("movement_type").notNull(),
    quantityDelta: integer("quantity_delta").notNull(),
    quantityBefore: integer("quantity_before").notNull(),
    quantityAfter: integer("quantity_after").notNull(),
    reason: text("reason").notNull(),
    actorId: text("actor_id").notNull(),
    actorRole: text("actor_role").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("inventory_movements_product_idx").on(t.productId),
    index("inventory_movements_order_idx").on(t.orderId),
    index("inventory_movements_created_at_idx").on(t.createdAt),
  ]
);

export const orderStatusHistories = pgTable(
  "order_status_histories",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    orderId: text("order_id").notNull().references(() => orders.id),
    fromStatus: text("from_status"),
    toStatus: text("to_status").notNull(),
    reason: text("reason"),
    actorId: text("actor_id").notNull(),
    actorRole: text("actor_role").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("order_status_histories_order_idx").on(t.orderId)]
);

export const memberTermsConsents = pgTable(
  "member_terms_consents",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    memberId: text("member_id").notNull().references(() => members.id),
    termsId: text("terms_id").notNull().references(() => terms.id),
    version: integer("version").notNull(),
    requestId: text("request_id"),
    ipAddress: text("ip_address"),
    agreedAt: timestamp("agreed_at").notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("member_terms_consents_member_terms_unique").on(t.memberId, t.termsId),
    index("member_terms_consents_member_idx").on(t.memberId),
  ]
);

export const passwordResetTokens = pgTable(
  "password_reset_tokens",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    userType: text("user_type").notNull(),
    userId: text("user_id").notNull(),
    tokenHash: text("token_hash").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    usedAt: timestamp("used_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("password_reset_tokens_hash_unique").on(t.tokenHash),
    index("password_reset_tokens_user_idx").on(t.userType, t.userId),
  ]
);

export const invoices = pgTable(
  "invoices",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    invoiceNo: text("invoice_no").notNull(),
    orderId: text("order_id").notNull().references(() => orders.id),
    memberId: text("member_id").notNull().references(() => members.id),
    status: text("status").notNull().default("draft"),
    issueDate: timestamp("issue_date"),
    dueDate: timestamp("due_date"),
    subtotal: integer("subtotal").notNull().default(0),
    shippingFee: integer("shipping_fee").notNull().default(0),
    discount: integer("discount").notNull().default(0),
    adjustment: integer("adjustment").notNull().default(0),
    taxAmount: integer("tax_amount").notNull().default(0),
    total: integer("total").notNull().default(0),
    recipientName: text("recipient_name").notNull(),
    recipientAddress: text("recipient_address").notNull(),
    issuerName: text("issuer_name").notNull(),
    issuerAddress: text("issuer_address").notNull(),
    issuerRegistrationNumber: text("issuer_registration_number"),
    bankInformation: text("bank_information"),
    notes: text("notes"),
    version: integer("version").notNull().default(1),
    issuedAt: timestamp("issued_at"),
    sentAt: timestamp("sent_at"),
    paidAt: timestamp("paid_at"),
    cancelledAt: timestamp("cancelled_at"),
    createdBy: text("created_by").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("invoices_invoice_no_unique").on(t.invoiceNo),
    index("invoices_order_idx").on(t.orderId),
    index("invoices_member_idx").on(t.memberId),
    index("invoices_status_idx").on(t.status),
  ]
);

export const invoiceItems = pgTable("invoice_items", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  invoiceId: text("invoice_id").notNull().references(() => invoices.id),
  description: text("description").notNull(),
  quantity: integer("quantity").notNull(),
  unit: text("unit").notNull().default("箱"),
  unitPrice: integer("unit_price").notNull(),
  taxRate: numeric("tax_rate", { precision: 4, scale: 2 }).notNull().default("0.10"),
  subtotal: integer("subtotal").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const payments = pgTable(
  "payments",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    invoiceId: text("invoice_id").notNull().references(() => invoices.id),
    amount: integer("amount").notNull(),
    paymentDate: timestamp("payment_date").notNull(),
    method: text("method").notNull(),
    note: text("note"),
    createdBy: text("created_by").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("payments_invoice_idx").on(t.invoiceId)]
);

// ─── feature_flags ────────────────────────────────────────────────────────────

export const featureFlags = pgTable("feature_flags", {
  key: text("key").primaryKey(),
  enabled: boolean("enabled").notNull().default(false),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  updatedBy: text("updated_by"),
});

// ─── notifications ────────────────────────────────────────────────────────────

export const notifications = pgTable("notifications", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  memberId: text("member_id").notNull().references(() => members.id),
  type: text("type").notNull(),
  message: text("message").notNull(),
  orderId: text("order_id").references(() => orders.id),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── announcements ────────────────────────────────────────────────────────────

export const announcements = pgTable("announcements", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: text("title").notNull(),
  body: text("body").notNull(),
  type: text("type").notNull().default("all"),
  targetMemberId: text("target_member_id").references(() => members.id),
  createdBy: text("created_by").notNull().references(() => admins.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  expiresAt: timestamp("expires_at"),
});

export const announcementReads = pgTable("announcement_reads", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  announcementId: text("announcement_id").notNull().references(() => announcements.id),
  memberId: text("member_id").notNull().references(() => members.id),
  readAt: timestamp("read_at").notNull().defaultNow(),
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

export const notificationsRelations = relations(notifications, ({ one }) => ({
  member: one(members, { fields: [notifications.memberId], references: [members.id] }),
  order: one(orders, { fields: [notifications.orderId], references: [orders.id] }),
}));

export const announcementsRelations = relations(announcements, ({ one, many }) => ({
  targetMember: one(members, { fields: [announcements.targetMemberId], references: [members.id] }),
  createdByAdmin: one(admins, { fields: [announcements.createdBy], references: [admins.id] }),
  reads: many(announcementReads),
}));

export const announcementReadsRelations = relations(announcementReads, ({ one }) => ({
  announcement: one(announcements, { fields: [announcementReads.announcementId], references: [announcements.id] }),
  member: one(members, { fields: [announcementReads.memberId], references: [members.id] }),
}));
