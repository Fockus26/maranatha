import { type SQL, sql } from "drizzle-orm";
import {
  boolean,
  check,
  customType,
  date,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  pgView,
  smallint,
  text,
  time,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

/**
 * Esquema de la base en el Postgres del VPS (D082). Es el mismo que tenían
 * las migraciones de `supabase/migrations/`, sin lo que solo existía en
 * Supabase: RLS sin políticas (aquí la única puerta es el servidor), grants a
 * `anon`/`authenticated`/`service_role` y `storage.*` (los comprobantes viven
 * en `payment_receipts`). Las funciones y triggers van en una migración SQL a
 * mano (`drizzle/0001_*`), porque Drizzle no los modela.
 *
 * Las tablas de Better Auth van al final, con columnas en snake_case.
 */

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
};

// ─── Pagos ──────────────────────────────────────────────────────────────

export const payments = pgTable(
  "payments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ...timestamps,

    purpose: text("purpose").notNull(),
    projectSlug: text("project_slug"),
    frequency: text("frequency").notNull().default("once"),

    /** Monto comprometido en USD (lo que se suma al recaudado). */
    amountUsd: numeric("amount_usd", { precision: 12, scale: 2 }).notNull(),
    /** Monto efectivamente pagado en la moneda del método. */
    amountPaid: numeric("amount_paid", { precision: 14, scale: 2 }),
    currency: text("currency").notNull().default("USD"),
    exchangeRate: numeric("exchange_rate", { precision: 14, scale: 4 }),

    method: text("method").notNull(),
    status: text("status").notNull().default("pending"),

    donorName: text("donor_name").notNull(),
    donorEmail: text("donor_email").notNull(),

    // Pagos manuales
    reference: text("reference"),
    paidAt: date("paid_at"),
    receiptPath: text("receipt_path"),
    referenceNorm: text("reference_norm").generatedAlwaysAs(
      (): SQL => sql`upper(regexp_replace(reference, '[\\s._-]', '', 'g'))`,
    ),

    // Pasarelas (PayPal, Binance Pay)
    providerOrderId: text("provider_order_id").unique(),
    providerCaptureId: text("provider_capture_id").unique(),
    providerSubscriptionId: text("provider_subscription_id"),

    confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
    confirmedBy: text("confirmed_by"),
    notes: text("notes"),
  },
  (t) => [
    check(
      "payments_purpose_check",
      sql`${t.purpose} in ('diezmo', 'ofrenda', 'proyecto')`,
    ),
    check(
      "payments_frequency_check",
      sql`${t.frequency} in ('once', 'monthly')`,
    ),
    check("payments_amount_usd_check", sql`${t.amountUsd} > 0`),
    check(
      "payments_currency_check",
      sql`${t.currency} in ('USD', 'VES', 'COP', 'USDT')`,
    ),
    check(
      "payments_method_check",
      sql`${t.method} in ('paypal', 'pagomovil', 'zelle', 'bancolombia', 'binance', 'zinli', 'wally')`,
    ),
    check(
      "payments_status_check",
      sql`${t.status} in ('pending', 'confirmed', 'rejected', 'cancelled')`,
    ),
    check(
      "payments_donor_name_check",
      sql`char_length(${t.donorName}) between 1 and 120`,
    ),
    check(
      "payments_donor_email_check",
      sql`char_length(${t.donorEmail}) between 3 and 254`,
    ),
    check(
      "payments_reference_check",
      sql`${t.reference} is null or char_length(${t.reference}) between 3 and 64`,
    ),
    check(
      "payments_project_slug_required",
      sql`(${t.purpose} = 'proyecto') = (${t.projectSlug} is not null)`,
    ),
    check(
      "payments_monthly_only_paypal",
      sql`${t.frequency} = 'once' or ${t.method} = 'paypal'`,
    ),
    // Manual = con referencia; pasarela = sin ella (D081).
    check(
      "payments_manual_requires_reference",
      sql`${t.method} = 'paypal' or ${t.reference} is not null or (${t.method} = 'binance' and ${t.paidAt} is null)`,
    ),
    // Una referencia no se reporta dos veces en el mismo método; un reporte
    // rechazado ya no la bloquea.
    uniqueIndex("payments_method_reference_norm_key")
      .on(t.method, t.referenceNorm)
      .where(sql`reference_norm is not null and status <> 'rejected'`),
    index("payments_status_created_idx").on(t.status, t.createdAt.desc()),
    index("payments_project_confirmed_idx")
      .on(t.projectSlug)
      .where(sql`status = 'confirmed'`),
  ],
);

/** Suma de lo confirmado por proyecto (lo lee el sitio público vía servidor). */
export const projectRaised = pgView("project_raised", {
  projectSlug: text("project_slug"),
  raisedUsd: numeric("raised_usd", { precision: 12, scale: 2 }),
  contributions: integer("contributions"),
}).existing();

/** Planes de suscripción de PayPal por monto (se crean al vuelo y se reutilizan). */
export const paypalPlans = pgTable("paypal_plans", {
  amountUsd: numeric("amount_usd", { precision: 12, scale: 2 }).primaryKey(),
  planId: text("plan_id").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/** Ajustes editables desde el dashboard (ej. tasa de cambio de respaldo). */
export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

const bytea = customType<{ data: Buffer; driverData: Buffer }>({
  dataType: () => "bytea",
});

/**
 * Comprobantes subidos por los donantes (antes, bucket privado `receipts` de
 * Supabase Storage). En la base, para que entren en el respaldo nocturno del
 * VPS sin un bucket propio (D082). `path` es el mismo valor que guarda
 * `payments.receipt_path` (`2026-10/<uuid>.jpg`).
 */
export const paymentReceipts = pgTable(
  "payment_receipts",
  {
    path: text("path").primaryKey(),
    mime: text("mime").notNull(),
    size: integer("size").notNull(),
    bytes: bytea("bytes").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    check(
      "payment_receipts_mime_check",
      sql`${t.mime} in ('image/jpeg', 'image/png', 'image/webp', 'application/pdf')`,
    ),
    // 5 MB, el mismo límite que tenía el bucket.
    check("payment_receipts_size_check", sql`${t.size} between 1 and 5242880`),
  ],
);

/** Rate limit por clave (IP hasheada + acción); lo usa `hit_rate_limit()`. */
export const rateLimitHits = pgTable(
  "rate_limit_hits",
  {
    key: text("key").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("rate_limit_hits_key_created_idx").on(t.key, t.createdAt)],
);

// ─── Agenda ─────────────────────────────────────────────────────────────

export const agendaEvents = pgTable(
  "agenda_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ...timestamps,
    kind: text("kind").notNull(),
    weekday: smallint("weekday"),
    eventDate: date("event_date"),
    startTime: time("start_time").notNull(),
    title: text("title").notNull(),
    location: text("location").notNull(),
  },
  (t) => [
    check(
      "agenda_events_kind_check",
      sql`${t.kind} in ('recurring', 'one_time')`,
    ),
    check("agenda_events_weekday_check", sql`${t.weekday} between 0 and 6`),
    check(
      "agenda_events_title_check",
      sql`char_length(${t.title}) between 1 and 120`,
    ),
    check(
      "agenda_events_location_check",
      sql`char_length(${t.location}) between 1 and 120`,
    ),
    check(
      "agenda_events_kind_fields",
      sql`(${t.kind} = 'recurring' and ${t.weekday} is not null and ${t.eventDate} is null) or (${t.kind} = 'one_time' and ${t.eventDate} is not null and ${t.weekday} is null)`,
    ),
    index("agenda_events_event_date_idx")
      .on(t.eventDate)
      .where(sql`kind = 'one_time'`),
  ],
);

// ─── Better Auth (solo el dashboard) ────────────────────────────────────
// Ids uuid (`advanced.database.generateId: "uuid"`): los admins importados
// de Supabase conservan su id.

export const user = pgTable("user", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  ...timestamps,
});

export const session = pgTable(
  "session",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    token: text("token").notNull().unique(),
    ...timestamps,
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (t) => [index("session_user_id_idx").on(t.userId)],
);

export const account = pgTable(
  "account",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", {
      withTimezone: true,
    }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", {
      withTimezone: true,
    }),
    scope: text("scope"),
    /** Hash scrypt de Better Auth, o bcrypt (`$2a$`/`$2b$`) si viene de Supabase. */
    password: text("password"),
    ...timestamps,
  },
  (t) => [index("account_user_id_idx").on(t.userId)],
);

export const verification = pgTable(
  "verification",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    ...timestamps,
  },
  (t) => [index("verification_identifier_idx").on(t.identifier)],
);
