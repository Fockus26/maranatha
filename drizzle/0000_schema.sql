CREATE TABLE "account" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" uuid NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"password" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agenda_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"kind" text NOT NULL,
	"weekday" smallint,
	"event_date" date,
	"start_time" time NOT NULL,
	"title" text NOT NULL,
	"location" text NOT NULL,
	CONSTRAINT "agenda_events_kind_check" CHECK ("agenda_events"."kind" in ('recurring', 'one_time')),
	CONSTRAINT "agenda_events_weekday_check" CHECK ("agenda_events"."weekday" between 0 and 6),
	CONSTRAINT "agenda_events_title_check" CHECK (char_length("agenda_events"."title") between 1 and 120),
	CONSTRAINT "agenda_events_location_check" CHECK (char_length("agenda_events"."location") between 1 and 120),
	CONSTRAINT "agenda_events_kind_fields" CHECK (("agenda_events"."kind" = 'recurring' and "agenda_events"."weekday" is not null and "agenda_events"."event_date" is null) or ("agenda_events"."kind" = 'one_time' and "agenda_events"."event_date" is not null and "agenda_events"."weekday" is null))
);
--> statement-breakpoint
CREATE TABLE "payment_receipts" (
	"path" text PRIMARY KEY NOT NULL,
	"mime" text NOT NULL,
	"size" integer NOT NULL,
	"bytes" "bytea" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payment_receipts_mime_check" CHECK ("payment_receipts"."mime" in ('image/jpeg', 'image/png', 'image/webp', 'application/pdf')),
	CONSTRAINT "payment_receipts_size_check" CHECK ("payment_receipts"."size" between 1 and 5242880)
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"purpose" text NOT NULL,
	"project_slug" text,
	"frequency" text DEFAULT 'once' NOT NULL,
	"amount_usd" numeric(12, 2) NOT NULL,
	"amount_paid" numeric(14, 2),
	"currency" text DEFAULT 'USD' NOT NULL,
	"exchange_rate" numeric(14, 4),
	"method" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"donor_name" text NOT NULL,
	"donor_email" text NOT NULL,
	"reference" text,
	"paid_at" date,
	"receipt_path" text,
	"reference_norm" text GENERATED ALWAYS AS (upper(regexp_replace(reference, '[\s._-]', '', 'g'))) STORED,
	"provider_order_id" text,
	"provider_capture_id" text,
	"provider_subscription_id" text,
	"confirmed_at" timestamp with time zone,
	"confirmed_by" text,
	"notes" text,
	CONSTRAINT "payments_provider_order_id_unique" UNIQUE("provider_order_id"),
	CONSTRAINT "payments_provider_capture_id_unique" UNIQUE("provider_capture_id"),
	CONSTRAINT "payments_purpose_check" CHECK ("payments"."purpose" in ('diezmo', 'ofrenda', 'proyecto')),
	CONSTRAINT "payments_frequency_check" CHECK ("payments"."frequency" in ('once', 'monthly')),
	CONSTRAINT "payments_amount_usd_check" CHECK ("payments"."amount_usd" > 0),
	CONSTRAINT "payments_currency_check" CHECK ("payments"."currency" in ('USD', 'VES', 'COP', 'USDT')),
	CONSTRAINT "payments_method_check" CHECK ("payments"."method" in ('paypal', 'pagomovil', 'zelle', 'bancolombia', 'binance', 'zinli', 'wally')),
	CONSTRAINT "payments_status_check" CHECK ("payments"."status" in ('pending', 'confirmed', 'rejected', 'cancelled')),
	CONSTRAINT "payments_donor_name_check" CHECK (char_length("payments"."donor_name") between 1 and 120),
	CONSTRAINT "payments_donor_email_check" CHECK (char_length("payments"."donor_email") between 3 and 254),
	CONSTRAINT "payments_reference_check" CHECK ("payments"."reference" is null or char_length("payments"."reference") between 3 and 64),
	CONSTRAINT "payments_project_slug_required" CHECK (("payments"."purpose" = 'proyecto') = ("payments"."project_slug" is not null)),
	CONSTRAINT "payments_monthly_only_paypal" CHECK ("payments"."frequency" = 'once' or "payments"."method" = 'paypal'),
	CONSTRAINT "payments_manual_requires_reference" CHECK ("payments"."method" = 'paypal' or "payments"."reference" is not null or ("payments"."method" = 'binance' and "payments"."paid_at" is null))
);
--> statement-breakpoint
CREATE TABLE "paypal_plans" (
	"amount_usd" numeric(12, 2) PRIMARY KEY NOT NULL,
	"plan_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "paypal_plans_plan_id_unique" UNIQUE("plan_id")
);
--> statement-breakpoint
CREATE TABLE "rate_limit_hits" (
	"key" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" uuid NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_user_id_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "agenda_events_event_date_idx" ON "agenda_events" USING btree ("event_date") WHERE kind = 'one_time';--> statement-breakpoint
CREATE UNIQUE INDEX "payments_method_reference_norm_key" ON "payments" USING btree ("method","reference_norm") WHERE reference_norm is not null and status <> 'rejected';--> statement-breakpoint
CREATE INDEX "payments_status_created_idx" ON "payments" USING btree ("status","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "payments_project_confirmed_idx" ON "payments" USING btree ("project_slug") WHERE status = 'confirmed';--> statement-breakpoint
CREATE INDEX "rate_limit_hits_key_created_idx" ON "rate_limit_hits" USING btree ("key","created_at");--> statement-breakpoint
CREATE INDEX "session_user_id_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");