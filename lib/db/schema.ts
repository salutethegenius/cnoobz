import {
  boolean,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

/**
 * App-specific tables only.
 * Better Auth owns `user`, `session`, `account`, and `verification` — do not redefine them here.
 */

export const paymentLinks = pgTable("payment_links", {
  id: uuid("id").primaryKey().defaultRandom(),
  label: text("label").notNull(),
  amountCents: integer("amount_cents").notNull(),
  status: text("status").notNull().default("pending"),
  linkToken: text("link_token").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  kind: text("kind").notNull().default("invoice"),
  salesEndAt: timestamp("sales_end_at", { withTimezone: true }),
  capacity: integer("capacity"),
  soldCount: integer("sold_count").notNull().default(0),
});

export const transactions = pgTable("transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  linkId: uuid("link_id").references(() => paymentLinks.id),
  customerRef: text("customer_ref"),
  /** Gross — what the customer paid (CNG `amount`). */
  amountCents: integer("amount_cents").notNull(),
  status: text("status").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  rawPayload: jsonb("raw_payload"),
  cngPaymentId: text("cng_payment_id"),
  orderNumber: text("order_number"),
  /** PayLanes fee (CNG `fee`). */
  feeCents: integer("fee_cents"),
  /** Merchant net after fees (CNG `total`). */
  netCents: integer("net_cents"),
  payerEmail: text("payer_email"),
  payerPhone: text("payer_phone"),
  paymentMethod: text("payment_method"),
  cardType: text("card_type"),
  processed: boolean("processed"),
  cngCreatedAt: timestamp("cng_created_at", { withTimezone: true }),
  syncedAt: timestamp("synced_at", { withTimezone: true }),
});

export const settings = pgTable("settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  key: text("key").notNull().unique(),
  value: text("value"),
});

export const checkoutSessions = pgTable("checkout_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  linkId: uuid("link_id")
    .notNull()
    .references(() => paymentLinks.id),
  orderNumber: text("order_number").notNull().unique(),
  expectedAmountCents: integer("expected_amount_cents").notNull(),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  singleUse: boolean("single_use").notNull().default(true),
});

export const subscribers = pgTable("subscribers", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  status: text("status").notNull().default("active"),
  source: text("source").notNull().default("pay"),
  unsubscribeToken: text("unsubscribe_token").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  unsubscribedAt: timestamp("unsubscribed_at", { withTimezone: true }),
});

export const newsletters = pgTable("newsletters", {
  id: uuid("id").primaryKey().defaultRandom(),
  subject: text("subject").notNull(),
  headline: text("headline"),
  body: text("body"),
  heroImagePath: text("hero_image_path"),
  extraImages: jsonb("extra_images").$type<string[]>().notNull().default([]),
  ctaLabel: text("cta_label"),
  ctaUrl: text("cta_url"),
  status: text("status").notNull().default("draft"),
  sentAt: timestamp("sent_at", { withTimezone: true }),
  recipientCount: integer("recipient_count").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type PaymentLink = typeof paymentLinks.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
export type Setting = typeof settings.$inferSelect;
export type CheckoutSession = typeof checkoutSessions.$inferSelect;
export type Subscriber = typeof subscribers.$inferSelect;
export type Newsletter = typeof newsletters.$inferSelect;

/** Known settings keys. Sensitive values marked encrypted are AES-GCM via lib/crypto.ts */
export const SETTINGS_KEYS = {
  businessName: "business_name",
  contactEmail: "contact_email",
  logoPath: "logo_path",
  cngMerchantId: "cng_merchant_id",
  cngApiKey: "cng_api_key", // encrypted
  cngEnvironment: "cng_environment", // 'qa' | 'prod'
  cngEndpointOverride: "cng_endpoint_override",
  cngLastSyncAt: "cng_last_sync_at",
  promoCode: "promo_code",
  promoPercent: "promo_percent",
} as const;
