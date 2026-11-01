-- CRM: companies, people, deals, tasks, notes and the activity timeline, each row owned by one workspace.
-- pg_trgm indexes the folded search text (Arabic and Latin) for substring search at volume.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- CreateTable
CREATE TABLE "companies" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "domain" TEXT,
    "industry" TEXT,
    "segment" TEXT,
    "employees" INTEGER,
    "arr" DECIMAL(18,3),
    "currency" VARCHAR(3),
    "tax_id" TEXT,
    "city" TEXT,
    "country" TEXT,
    "description" TEXT,
    "owner_id" UUID,
    "custom" JSONB NOT NULL DEFAULT '{}',
    "search_text" TEXT NOT NULL DEFAULT '',
    "last_interaction_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "people" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "title" TEXT,
    "company_id" UUID,
    "city" TEXT,
    "strength" TEXT,
    "owner_id" UUID,
    "custom" JSONB NOT NULL DEFAULT '{}',
    "search_text" TEXT NOT NULL DEFAULT '',
    "last_interaction_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "people_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deals" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "company_id" UUID,
    "person_id" UUID,
    "stage" TEXT NOT NULL DEFAULT 'Lead',
    "value" DECIMAL(18,3) NOT NULL DEFAULT 0,
    "currency" VARCHAR(3),
    "owner_id" UUID,
    "close_date" DATE,
    "source" TEXT,
    "next_step" TEXT,
    "custom" JSONB NOT NULL DEFAULT '{}',
    "search_text" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "deals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tasks" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "due_at" TIMESTAMP(3),
    "assignee_id" UUID,
    "done" BOOLEAN NOT NULL DEFAULT false,
    "priority" TEXT NOT NULL DEFAULT 'Medium',
    "record_kind" TEXT,
    "record_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notes" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL DEFAULT '',
    "record_kind" TEXT,
    "record_id" UUID,
    "author_id" UUID,
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activities" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "record_kind" TEXT NOT NULL,
    "record_id" UUID NOT NULL,
    "kind" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "actor_id" UUID,
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "companies_tenant_id_updated_at_id_idx" ON "companies"("tenant_id", "updated_at", "id");

-- CreateIndex
CREATE INDEX "companies_tenant_id_name_id_idx" ON "companies"("tenant_id", "name", "id");

-- CreateIndex
CREATE INDEX "companies_search_text_trgm" ON "companies" USING GIN ("search_text" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "people_tenant_id_updated_at_id_idx" ON "people"("tenant_id", "updated_at", "id");

-- CreateIndex
CREATE INDEX "people_tenant_id_name_id_idx" ON "people"("tenant_id", "name", "id");

-- CreateIndex
CREATE INDEX "people_tenant_id_company_id_idx" ON "people"("tenant_id", "company_id");

-- CreateIndex
CREATE INDEX "people_tenant_id_phone_idx" ON "people"("tenant_id", "phone");

-- CreateIndex
CREATE INDEX "people_search_text_trgm" ON "people" USING GIN ("search_text" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "deals_tenant_id_updated_at_id_idx" ON "deals"("tenant_id", "updated_at", "id");

-- CreateIndex
CREATE INDEX "deals_tenant_id_name_id_idx" ON "deals"("tenant_id", "name", "id");

-- CreateIndex
CREATE INDEX "deals_tenant_id_stage_id_idx" ON "deals"("tenant_id", "stage", "id");

-- CreateIndex
CREATE INDEX "deals_tenant_id_company_id_idx" ON "deals"("tenant_id", "company_id");

-- CreateIndex
CREATE INDEX "deals_search_text_trgm" ON "deals" USING GIN ("search_text" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "tasks_tenant_id_updated_at_id_idx" ON "tasks"("tenant_id", "updated_at", "id");

-- CreateIndex
CREATE INDEX "tasks_tenant_id_done_due_at_idx" ON "tasks"("tenant_id", "done", "due_at");

-- CreateIndex
CREATE INDEX "tasks_tenant_id_record_kind_record_id_idx" ON "tasks"("tenant_id", "record_kind", "record_id");

-- CreateIndex
CREATE INDEX "notes_tenant_id_updated_at_id_idx" ON "notes"("tenant_id", "updated_at", "id");

-- CreateIndex
CREATE INDEX "notes_tenant_id_record_kind_record_id_idx" ON "notes"("tenant_id", "record_kind", "record_id");

-- CreateIndex
CREATE INDEX "activities_tenant_id_record_kind_record_id_at_idx" ON "activities"("tenant_id", "record_kind", "record_id", "at");

-- CreateIndex
CREATE INDEX "activities_tenant_id_at_id_idx" ON "activities"("tenant_id", "at", "id");

-- AddForeignKey
ALTER TABLE "companies" ADD CONSTRAINT "companies_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "companies" ADD CONSTRAINT "companies_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "people" ADD CONSTRAINT "people_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "people" ADD CONSTRAINT "people_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "people" ADD CONSTRAINT "people_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deals" ADD CONSTRAINT "deals_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deals" ADD CONSTRAINT "deals_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deals" ADD CONSTRAINT "deals_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "people"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deals" ADD CONSTRAINT "deals_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assignee_id_fkey" FOREIGN KEY ("assignee_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- Row-level security, as for every workspace table: a connection sees only the workspace in app.tenant_id.
ALTER TABLE "companies" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "companies" FORCE ROW LEVEL SECURITY;
CREATE POLICY "companies_tenant_isolation" ON "companies"
  USING ("tenant_id"::text = current_setting('app.tenant_id', true))
  WITH CHECK ("tenant_id"::text = current_setting('app.tenant_id', true));

ALTER TABLE "people" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "people" FORCE ROW LEVEL SECURITY;
CREATE POLICY "people_tenant_isolation" ON "people"
  USING ("tenant_id"::text = current_setting('app.tenant_id', true))
  WITH CHECK ("tenant_id"::text = current_setting('app.tenant_id', true));

ALTER TABLE "deals" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "deals" FORCE ROW LEVEL SECURITY;
CREATE POLICY "deals_tenant_isolation" ON "deals"
  USING ("tenant_id"::text = current_setting('app.tenant_id', true))
  WITH CHECK ("tenant_id"::text = current_setting('app.tenant_id', true));

ALTER TABLE "tasks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "tasks" FORCE ROW LEVEL SECURITY;
CREATE POLICY "tasks_tenant_isolation" ON "tasks"
  USING ("tenant_id"::text = current_setting('app.tenant_id', true))
  WITH CHECK ("tenant_id"::text = current_setting('app.tenant_id', true));

ALTER TABLE "notes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "notes" FORCE ROW LEVEL SECURITY;
CREATE POLICY "notes_tenant_isolation" ON "notes"
  USING ("tenant_id"::text = current_setting('app.tenant_id', true))
  WITH CHECK ("tenant_id"::text = current_setting('app.tenant_id', true));

ALTER TABLE "activities" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "activities" FORCE ROW LEVEL SECURITY;
CREATE POLICY "activities_tenant_isolation" ON "activities"
  USING ("tenant_id"::text = current_setting('app.tenant_id', true))
  WITH CHECK ("tenant_id"::text = current_setting('app.tenant_id', true));

-- The app role reaches the new tables through the default privileges set in the row-level security
-- migration; grant explicitly too, for databases where the role was created after that migration ran.
DO $grants$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'vult_app') THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON "companies", "people", "deals", "tasks", "notes", "activities" TO vult_app;
  END IF;
END
$grants$;
