-- Early-access requests from the website (no workspace data, so no row-level security).
CREATE TABLE "leads" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "role" TEXT,
    "invoices_per_month" TEXT,
    "message" TEXT,
    "language" TEXT NOT NULL DEFAULT 'en',
    "source" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "leads_created_at_idx" ON "leads"("created_at");
