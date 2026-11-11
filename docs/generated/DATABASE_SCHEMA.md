# Generated PostgreSQL Schema Inventory

> Auto-generated from `src/lib/db/schema-pg.ts`. Raw Drizzle expressions are preserved for review.

## Enums

- `member_status` (`memberStatusEnum`): `pending`, `approved`, `rejected`, `suspended`
- `order_status` (`orderStatusEnum`): `pending`, `confirmed`, `shipped`, `delivered`, `cancelled`, `cancel_requested`
- `actor_role` (`actorRoleEnum`): `admin`, `member`

## Tables

### `member_ranks`

Source export: `memberRanks`

| Property | DB column | Drizzle definition |
|---|---|---|
| `id` | `id` | `text("id").primaryKey().$defaultFn(() => crypto.randomUUID())` |
| `name` | `name` | `text("name").notNull().unique()` |
| `rate` | `rate` | `numeric("rate", { precision: 4, scale: 2 }).notNull()` |
| `minMonthlyBoxes` | `min_monthly_boxes` | `integer("min_monthly_boxes").notNull().default(0)` |
| `description` | `description` | `text("description")` |
| `createdAt` | `created_at` | `timestamp("created_at").notNull().defaultNow()` |
| `updatedAt` | `updated_at` | `timestamp("updated_at").notNull().defaultNow()` |

### `members`

Source export: `members`

| Property | DB column | Drizzle definition |
|---|---|---|
| `id` | `id` | `text("id").primaryKey().$defaultFn(() => crypto.randomUUID())` |
| `email` | `email` | `text("email").notNull()` |
| `password` | `password` | `text("password").notNull()` |
| `companyName` | `company_name` | `text("company_name").notNull()` |
| `contactName` | `contact_name` | `text("contact_name").notNull()` |
| `phone` | `phone` | `text("phone").notNull()` |
| `address` | `address` | `text("address").notNull()` |
| `businessDescription` | `business_description` | `text("business_description")` |
| `status` | `status` | `memberStatusEnum("status").notNull().default("pending")` |
| `rankId` | `rank_id` | `text("rank_id").notNull().references(() => memberRanks.id)` |
| `createdAt` | `created_at` | `timestamp("created_at").notNull().defaultNow()` |
| `updatedAt` | `updated_at` | `timestamp("updated_at").notNull().defaultNow()` |

### `admins`

Source export: `admins`

| Property | DB column | Drizzle definition |
|---|---|---|
| `id` | `id` | `text("id").primaryKey().$defaultFn(() => crypto.randomUUID())` |
| `email` | `email` | `text("email").notNull()` |
| `password` | `password` | `text("password").notNull()` |
| `name` | `name` | `text("name").notNull()` |
| `role` | `role` | `text("role").notNull().default("editor")` |
| `createdAt` | `created_at` | `timestamp("created_at").notNull().defaultNow()` |
| `updatedAt` | `updated_at` | `timestamp("updated_at").notNull().defaultNow()` |

### `shipping_addresses`

Source export: `shippingAddresses`

| Property | DB column | Drizzle definition |
|---|---|---|
| `id` | `id` | `text("id").primaryKey().$defaultFn(() => crypto.randomUUID())` |
| `memberId` | `member_id` | `text("member_id").notNull().references(() => members.id)` |
| `label` | `label` | `text("label").notNull()` |
| `recipientName` | `recipient_name` | `text("recipient_name").notNull()` |
| `postalCode` | `postal_code` | `varchar("postal_code", { length: 8 }).notNull()` |
| `prefecture` | `prefecture` | `text("prefecture").notNull()` |
| `address1` | `address1` | `text("address1").notNull()` |
| `address2` | `address2` | `text("address2")` |
| `phone` | `phone` | `text("phone").notNull()` |
| `isDefault` | `is_default` | `boolean("is_default").notNull().default(false)` |
| `deletedAt` | `deleted_at` | `timestamp("deleted_at")` |
| `createdAt` | `created_at` | `timestamp("created_at").notNull().defaultNow()` |

### `products`

Source export: `products`

| Property | DB column | Drizzle definition |
|---|---|---|
| `id` | `id` | `text("id").primaryKey().$defaultFn(() => crypto.randomUUID())` |
| `name` | `name` | `text("name").notNull()` |
| `description` | `description` | `text("description")` |
| `imageUrl` | `image_url` | `text("image_url")` |
| `retailPrice` | `retail_price` | `integer("retail_price").notNull().default(3880)` |
| `bottlesPerBox` | `bottles_per_box` | `integer("bottles_per_box").notNull().default(24)` |
| `isActive` | `is_active` | `boolean("is_active").notNull().default(true)` |
| `createdAt` | `created_at` | `timestamp("created_at").notNull().defaultNow()` |
| `updatedAt` | `updated_at` | `timestamp("updated_at").notNull().defaultNow()` |

### `inventory`

Source export: `inventory`

| Property | DB column | Drizzle definition |
|---|---|---|
| `id` | `id` | `text("id").primaryKey().$defaultFn(() => crypto.randomUUID())` |
| `productId` | `product_id` | `text("product_id") .notNull() .unique() .references(() => products.id)` |
| `availableBoxes` | `available_boxes` | `integer("available_boxes").notNull().default(0)` |
| `updatedAt` | `updated_at` | `timestamp("updated_at").notNull().defaultNow()` |
| `updatedBy` | `updated_by` | `text("updated_by")` |

### `orders`

Source export: `orders`

| Property | DB column | Drizzle definition |
|---|---|---|
| `id` | `id` | `text("id").primaryKey().$defaultFn(() => crypto.randomUUID())` |
| `orderNo` | `order_no` | `text("order_no").notNull()` |
| `memberId` | `member_id` | `text("member_id").notNull().references(() => members.id)` |
| `shippingAddressId` | `shipping_address_id` | `text("shipping_address_id") .notNull() .references(() => shippingAddresses.id)` |
| `status` | `status` | `orderStatusEnum("status").notNull().default("pending")` |
| `subtotal` | `subtotal` | `integer("subtotal").notNull()` |
| `taxRate` | `tax_rate` | `numeric("tax_rate", { precision: 4, scale: 2 }).notNull().default("0.10")` |
| `taxAmount` | `tax_amount` | `integer("tax_amount").notNull().default(0)` |
| `total` | `total` | `integer("total").notNull()` |
| `paymentStatus` | `payment_status` | `text("payment_status").notNull().default("unpaid")` |
| `paymentDueDate` | `payment_due_date` | `timestamp("payment_due_date")` |
| `shippingFee` | `shipping_fee` | `integer("shipping_fee").notNull().default(0)` |
| `trackingNumber` | `tracking_number` | `text("tracking_number")` |
| `cancelReason` | `cancel_reason` | `text("cancel_reason")` |
| `cancelBeforeStatus` | `cancel_before_status` | `text("cancel_before_status")` |
| `memo` | `memo` | `text("memo")` |
| `deliveredAt` | `delivered_at` | `timestamp("delivered_at")` |
| `lastStatusChangedAt` | `last_status_changed_at` | `timestamp("last_status_changed_at")` |
| `lastStatusChangedBy` | `last_status_changed_by` | `text("last_status_changed_by")` |
| `createdAt` | `created_at` | `timestamp("created_at").notNull().defaultNow()` |
| `updatedAt` | `updated_at` | `timestamp("updated_at").notNull().defaultNow()` |

### `order_items`

Source export: `orderItems`

| Property | DB column | Drizzle definition |
|---|---|---|
| `id` | `id` | `text("id").primaryKey().$defaultFn(() => crypto.randomUUID())` |
| `orderId` | `order_id` | `text("order_id").notNull().references(() => orders.id)` |
| `productId` | `product_id` | `text("product_id").notNull().references(() => products.id)` |
| `productName` | `product_name` | `text("product_name").notNull()` |
| `boxes` | `boxes` | `integer("boxes").notNull()` |
| `bottlesPerBox` | `bottles_per_box` | `integer("bottles_per_box").notNull()` |
| `unitPricePerBox` | `unit_price_per_box` | `integer("unit_price_per_box").notNull()` |
| `rateApplied` | `rate_applied` | `numeric("rate_applied", { precision: 4, scale: 2 }).notNull()` |
| `subtotal` | `subtotal` | `integer("subtotal").notNull()` |

### `audit_logs`

Source export: `auditLogs`

| Property | DB column | Drizzle definition |
|---|---|---|
| `id` | `id` | `text("id").primaryKey().$defaultFn(() => crypto.randomUUID())` |
| `actorId` | `actor_id` | `text("actor_id").notNull()` |
| `actorRole` | `actor_role` | `actorRoleEnum("actor_role").notNull()` |
| `action` | `action` | `text("action").notNull()` |
| `targetType` | `target_type` | `text("target_type").notNull()` |
| `targetId` | `target_id` | `text("target_id")` |
| `beforeValue` | `before_value` | `jsonb("before_value")` |
| `afterValue` | `after_value` | `jsonb("after_value")` |
| `ipAddress` | `ip_address` | `text("ip_address")` |
| `createdAt` | `created_at` | `timestamp("created_at").notNull().defaultNow()` |

### `inventory_receipts`

Source export: `inventoryReceipts`

| Property | DB column | Drizzle definition |
|---|---|---|
| `id` | `id` | `text("id").primaryKey().$defaultFn(() => crypto.randomUUID())` |
| `productId` | `product_id` | `text("product_id").notNull().references(() => products.id)` |
| `boxes` | `boxes` | `integer("boxes").notNull()` |
| `previousBoxes` | `previous_boxes` | `integer("previous_boxes").notNull()` |
| `newBoxes` | `new_boxes` | `integer("new_boxes").notNull()` |
| `note` | `note` | `text("note")` |
| `receivedBy` | `received_by` | `text("received_by").notNull()` |
| `createdAt` | `created_at` | `timestamp("created_at").notNull().defaultNow()` |

### `monthly_invoices`

Source export: `monthlyInvoices`

| Property | DB column | Drizzle definition |
|---|---|---|
| `id` | `id` | `text("id").primaryKey().$defaultFn(() => crypto.randomUUID())` |
| `invoiceNo` | `invoice_no` | `text("invoice_no").notNull().unique()` |
| `memberId` | `member_id` | `text("member_id").notNull().references(() => members.id)` |
| `year` | `year` | `integer("year").notNull()` |
| `month` | `month` | `integer("month").notNull()` |
| `subtotal` | `subtotal` | `integer("subtotal").notNull().default(0)` |
| `taxAmount` | `tax_amount` | `integer("tax_amount").notNull().default(0)` |
| `total` | `total` | `integer("total").notNull().default(0)` |
| `paymentStatus` | `payment_status` | `text("payment_status").notNull().default("unpaid")` |
| `paymentDueDate` | `payment_due_date` | `timestamp("payment_due_date")` |
| `note` | `note` | `text("note")` |
| `issuedAt` | `issued_at` | `timestamp("issued_at").notNull().defaultNow()` |
| `createdAt` | `created_at` | `timestamp("created_at").notNull().defaultNow()` |
| `updatedAt` | `updated_at` | `timestamp("updated_at").notNull().defaultNow()` |

### `invoice_orders`

Source export: `invoiceOrders`

| Property | DB column | Drizzle definition |
|---|---|---|
| `id` | `id` | `text("id").primaryKey().$defaultFn(() => crypto.randomUUID())` |
| `invoiceId` | `invoice_id` | `text("invoice_id").notNull().references(() => monthlyInvoices.id)` |
| `orderId` | `order_id` | `text("order_id").notNull().references(() => orders.id)` |
| `createdAt` | `created_at` | `timestamp("created_at").notNull().defaultNow()` |

### `system_settings`

Source export: `systemSettings`

| Property | DB column | Drizzle definition |
|---|---|---|
| `id` | `id` | `text("id").primaryKey().default("singleton")` |
| `companyName` | `company_name` | `text("company_name").notNull().default("")` |
| `companyPostalCode` | `company_postal_code` | `text("company_postal_code").notNull().default("")` |
| `companyAddress` | `company_address` | `text("company_address").notNull().default("")` |
| `companyTel` | `company_tel` | `text("company_tel").notNull().default("")` |
| `companyEmail` | `company_email` | `text("company_email").notNull().default("")` |
| `invoiceRegistrationNo` | `invoice_registration_no` | `text("invoice_registration_no").notNull().default("")` |
| `supportEmail` | `support_email` | `text("support_email").notNull().default("")` |
| `lowStockThreshold` | `low_stock_threshold` | `integer("low_stock_threshold").notNull().default(10)` |
| `updatedAt` | `updated_at` | `timestamp("updated_at").notNull().defaultNow()` |
| `updatedBy` | `updated_by` | `text("updated_by")` |

### `terms`

Source export: `terms`

| Property | DB column | Drizzle definition |
|---|---|---|
| `id` | `id` | `text("id").primaryKey().$defaultFn(() => crypto.randomUUID())` |
| `content` | `content` | `text("content").notNull().default("")` |
| `isPublished` | `is_published` | `boolean("is_published").notNull().default(false)` |
| `publishedAt` | `published_at` | `timestamp("published_at")` |
| `version` | `version` | `integer("version").notNull().default(1)` |
| `createdAt` | `created_at` | `timestamp("created_at").notNull().defaultNow()` |
| `updatedAt` | `updated_at` | `timestamp("updated_at").notNull().defaultNow()` |
| `updatedBy` | `updated_by` | `text("updated_by").notNull().default("system")` |

### `inventory_movements`

Source export: `inventoryMovements`

| Property | DB column | Drizzle definition |
|---|---|---|
| `id` | `id` | `text("id").primaryKey().$defaultFn(() => crypto.randomUUID())` |
| `productId` | `product_id` | `text("product_id").notNull().references(() => products.id)` |
| `orderId` | `order_id` | `text("order_id").references(() => orders.id)` |
| `movementType` | `movement_type` | `text("movement_type").notNull()` |
| `quantityDelta` | `quantity_delta` | `integer("quantity_delta").notNull()` |
| `quantityBefore` | `quantity_before` | `integer("quantity_before").notNull()` |
| `quantityAfter` | `quantity_after` | `integer("quantity_after").notNull()` |
| `reason` | `reason` | `text("reason").notNull()` |
| `actorId` | `actor_id` | `text("actor_id").notNull()` |
| `actorRole` | `actor_role` | `text("actor_role").notNull()` |
| `createdAt` | `created_at` | `timestamp("created_at").notNull().defaultNow()` |

### `order_status_histories`

Source export: `orderStatusHistories`

| Property | DB column | Drizzle definition |
|---|---|---|
| `id` | `id` | `text("id").primaryKey().$defaultFn(() => crypto.randomUUID())` |
| `orderId` | `order_id` | `text("order_id").notNull().references(() => orders.id)` |
| `fromStatus` | `from_status` | `text("from_status")` |
| `toStatus` | `to_status` | `text("to_status").notNull()` |
| `reason` | `reason` | `text("reason")` |
| `actorId` | `actor_id` | `text("actor_id").notNull()` |
| `actorRole` | `actor_role` | `text("actor_role").notNull()` |
| `createdAt` | `created_at` | `timestamp("created_at").notNull().defaultNow()` |

### `member_terms_consents`

Source export: `memberTermsConsents`

| Property | DB column | Drizzle definition |
|---|---|---|
| `id` | `id` | `text("id").primaryKey().$defaultFn(() => crypto.randomUUID())` |
| `memberId` | `member_id` | `text("member_id").notNull().references(() => members.id)` |
| `termsId` | `terms_id` | `text("terms_id").notNull().references(() => terms.id)` |
| `version` | `version` | `integer("version").notNull()` |
| `requestId` | `request_id` | `text("request_id")` |
| `ipAddress` | `ip_address` | `text("ip_address")` |
| `agreedAt` | `agreed_at` | `timestamp("agreed_at").notNull().defaultNow()` |

### `password_reset_tokens`

Source export: `passwordResetTokens`

| Property | DB column | Drizzle definition |
|---|---|---|
| `id` | `id` | `text("id").primaryKey().$defaultFn(() => crypto.randomUUID())` |
| `userType` | `user_type` | `text("user_type").notNull()` |
| `userId` | `user_id` | `text("user_id").notNull()` |
| `tokenHash` | `token_hash` | `text("token_hash").notNull()` |
| `expiresAt` | `expires_at` | `timestamp("expires_at").notNull()` |
| `usedAt` | `used_at` | `timestamp("used_at")` |
| `createdAt` | `created_at` | `timestamp("created_at").notNull().defaultNow()` |

### `invoices`

Source export: `invoices`

| Property | DB column | Drizzle definition |
|---|---|---|
| `id` | `id` | `text("id").primaryKey().$defaultFn(() => crypto.randomUUID())` |
| `invoiceNo` | `invoice_no` | `text("invoice_no").notNull()` |
| `orderId` | `order_id` | `text("order_id").notNull().references(() => orders.id)` |
| `memberId` | `member_id` | `text("member_id").notNull().references(() => members.id)` |
| `status` | `status` | `text("status").notNull().default("draft")` |
| `issueDate` | `issue_date` | `timestamp("issue_date")` |
| `dueDate` | `due_date` | `timestamp("due_date")` |
| `subtotal` | `subtotal` | `integer("subtotal").notNull().default(0)` |
| `shippingFee` | `shipping_fee` | `integer("shipping_fee").notNull().default(0)` |
| `discount` | `discount` | `integer("discount").notNull().default(0)` |
| `adjustment` | `adjustment` | `integer("adjustment").notNull().default(0)` |
| `taxAmount` | `tax_amount` | `integer("tax_amount").notNull().default(0)` |
| `total` | `total` | `integer("total").notNull().default(0)` |
| `recipientName` | `recipient_name` | `text("recipient_name").notNull()` |
| `recipientAddress` | `recipient_address` | `text("recipient_address").notNull()` |
| `issuerName` | `issuer_name` | `text("issuer_name").notNull()` |
| `issuerAddress` | `issuer_address` | `text("issuer_address").notNull()` |
| `issuerRegistrationNumber` | `issuer_registration_number` | `text("issuer_registration_number")` |
| `bankInformation` | `bank_information` | `text("bank_information")` |
| `notes` | `notes` | `text("notes")` |
| `version` | `version` | `integer("version").notNull().default(1)` |
| `issuedAt` | `issued_at` | `timestamp("issued_at")` |
| `sentAt` | `sent_at` | `timestamp("sent_at")` |
| `paidAt` | `paid_at` | `timestamp("paid_at")` |
| `cancelledAt` | `cancelled_at` | `timestamp("cancelled_at")` |
| `createdBy` | `created_by` | `text("created_by").notNull()` |
| `createdAt` | `created_at` | `timestamp("created_at").notNull().defaultNow()` |
| `updatedAt` | `updated_at` | `timestamp("updated_at").notNull().defaultNow()` |

### `invoice_items`

Source export: `invoiceItems`

| Property | DB column | Drizzle definition |
|---|---|---|
| `id` | `id` | `text("id").primaryKey().$defaultFn(() => crypto.randomUUID())` |
| `invoiceId` | `invoice_id` | `text("invoice_id").notNull().references(() => invoices.id)` |
| `description` | `description` | `text("description").notNull()` |
| `quantity` | `quantity` | `integer("quantity").notNull()` |
| `unit` | `unit` | `text("unit").notNull().default("箱")` |
| `unitPrice` | `unit_price` | `integer("unit_price").notNull()` |
| `taxRate` | `tax_rate` | `numeric("tax_rate", { precision: 4, scale: 2 }).notNull().default("0.10")` |
| `subtotal` | `subtotal` | `integer("subtotal").notNull()` |
| `sortOrder` | `sort_order` | `integer("sort_order").notNull().default(0)` |

### `payments`

Source export: `payments`

| Property | DB column | Drizzle definition |
|---|---|---|
| `id` | `id` | `text("id").primaryKey().$defaultFn(() => crypto.randomUUID())` |
| `invoiceId` | `invoice_id` | `text("invoice_id").notNull().references(() => invoices.id)` |
| `amount` | `amount` | `integer("amount").notNull()` |
| `paymentDate` | `payment_date` | `timestamp("payment_date").notNull()` |
| `method` | `method` | `text("method").notNull()` |
| `note` | `note` | `text("note")` |
| `createdBy` | `created_by` | `text("created_by").notNull()` |
| `createdAt` | `created_at` | `timestamp("created_at").notNull().defaultNow()` |

### `feature_flags`

Source export: `featureFlags`

| Property | DB column | Drizzle definition |
|---|---|---|
| `key` | `key` | `text("key").primaryKey()` |
| `enabled` | `enabled` | `boolean("enabled").notNull().default(false)` |
| `updatedAt` | `updated_at` | `timestamp("updated_at").notNull().defaultNow()` |
| `updatedBy` | `updated_by` | `text("updated_by")` |

### `notifications`

Source export: `notifications`

| Property | DB column | Drizzle definition |
|---|---|---|
| `id` | `id` | `text("id").primaryKey().$defaultFn(() => crypto.randomUUID())` |
| `memberId` | `member_id` | `text("member_id").notNull().references(() => members.id)` |
| `type` | `type` | `text("type").notNull()` |
| `message` | `message` | `text("message").notNull()` |
| `orderId` | `order_id` | `text("order_id").references(() => orders.id)` |
| `isRead` | `is_read` | `boolean("is_read").notNull().default(false)` |
| `createdAt` | `created_at` | `timestamp("created_at").notNull().defaultNow()` |

### `announcements`

Source export: `announcements`

| Property | DB column | Drizzle definition |
|---|---|---|
| `id` | `id` | `text("id").primaryKey().$defaultFn(() => crypto.randomUUID())` |
| `title` | `title` | `text("title").notNull()` |
| `body` | `body` | `text("body").notNull()` |
| `type` | `type` | `text("type").notNull().default("all")` |
| `targetMemberId` | `target_member_id` | `text("target_member_id").references(() => members.id)` |
| `createdBy` | `created_by` | `text("created_by").notNull().references(() => admins.id)` |
| `createdAt` | `created_at` | `timestamp("created_at").notNull().defaultNow()` |
| `expiresAt` | `expires_at` | `timestamp("expires_at")` |

### `announcement_reads`

Source export: `announcementReads`

| Property | DB column | Drizzle definition |
|---|---|---|
| `id` | `id` | `text("id").primaryKey().$defaultFn(() => crypto.randomUUID())` |
| `announcementId` | `announcement_id` | `text("announcement_id").notNull().references(() => announcements.id)` |
| `memberId` | `member_id` | `text("member_id").notNull().references(() => members.id)` |
| `readAt` | `read_at` | `timestamp("read_at").notNull().defaultNow()` |

