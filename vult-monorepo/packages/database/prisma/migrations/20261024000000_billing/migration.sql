-- Billing: plan, trial and Stripe subscription per workspace.
CREATE TYPE "PlanTier" AS ENUM ('TRIAL', 'START', 'GROWTH', 'SCALE');

ALTER TABLE "tenants"
  ADD COLUMN "plan" "PlanTier" NOT NULL DEFAULT 'TRIAL',
  ADD COLUMN "trial_ends_at" TIMESTAMP(3),
  ADD COLUMN "subscription_status" TEXT,
  ADD COLUMN "stripe_customer_id" TEXT,
  ADD COLUMN "stripe_subscription_id" TEXT,
  ADD COLUMN "current_period_end" TIMESTAMP(3),
  ADD COLUMN "billing_event_at" TIMESTAMP(3);

-- Workspaces that existed before billing get a fresh 30-day trial.
UPDATE "tenants" SET "trial_ends_at" = CURRENT_TIMESTAMP + INTERVAL '30 days' WHERE "trial_ends_at" IS NULL;

CREATE UNIQUE INDEX "tenants_stripe_customer_id_key" ON "tenants"("stripe_customer_id");
