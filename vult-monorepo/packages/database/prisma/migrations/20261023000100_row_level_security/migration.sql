-- Row-level security: every row belongs to one workspace (tenant), and a connection only sees the rows of the
-- workspace named in app.tenant_id, which withTenantContext() sets per transaction. FORCE applies the policies
-- to the table owner too, so only a superuser or a BYPASSRLS role could read across workspaces.

ALTER TABLE "tenants" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "tenants" FORCE ROW LEVEL SECURITY;
CREATE POLICY "tenants_tenant_isolation" ON "tenants"
  USING ("id"::text = current_setting('app.tenant_id', true))
  WITH CHECK ("id"::text = current_setting('app.tenant_id', true));

ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "users" FORCE ROW LEVEL SECURITY;
CREATE POLICY "users_tenant_isolation" ON "users"
  USING ("tenant_id"::text = current_setting('app.tenant_id', true))
  WITH CHECK ("tenant_id"::text = current_setting('app.tenant_id', true));

ALTER TABLE "object_types" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "object_types" FORCE ROW LEVEL SECURITY;
CREATE POLICY "object_types_tenant_isolation" ON "object_types"
  USING ("tenant_id"::text = current_setting('app.tenant_id', true))
  WITH CHECK ("tenant_id"::text = current_setting('app.tenant_id', true));

ALTER TABLE "attributes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "attributes" FORCE ROW LEVEL SECURITY;
CREATE POLICY "attributes_tenant_isolation" ON "attributes"
  USING ("tenant_id"::text = current_setting('app.tenant_id', true))
  WITH CHECK ("tenant_id"::text = current_setting('app.tenant_id', true));

ALTER TABLE "records" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "records" FORCE ROW LEVEL SECURITY;
CREATE POLICY "records_tenant_isolation" ON "records"
  USING ("tenant_id"::text = current_setting('app.tenant_id', true))
  WITH CHECK ("tenant_id"::text = current_setting('app.tenant_id', true));

ALTER TABLE "attribute_values" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "attribute_values" FORCE ROW LEVEL SECURITY;
CREATE POLICY "attribute_values_tenant_isolation" ON "attribute_values"
  USING ("tenant_id"::text = current_setting('app.tenant_id', true))
  WITH CHECK ("tenant_id"::text = current_setting('app.tenant_id', true));

ALTER TABLE "record_relations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "record_relations" FORCE ROW LEVEL SECURITY;
CREATE POLICY "record_relations_tenant_isolation" ON "record_relations"
  USING ("tenant_id"::text = current_setting('app.tenant_id', true))
  WITH CHECK ("tenant_id"::text = current_setting('app.tenant_id', true));

ALTER TABLE "documents" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "documents" FORCE ROW LEVEL SECURITY;
CREATE POLICY "documents_tenant_isolation" ON "documents"
  USING ("tenant_id"::text = current_setting('app.tenant_id', true))
  WITH CHECK ("tenant_id"::text = current_setting('app.tenant_id', true));

ALTER TABLE "ai_memories" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ai_memories" FORCE ROW LEVEL SECURITY;
CREATE POLICY "ai_memories_tenant_isolation" ON "ai_memories"
  USING ("tenant_id"::text = current_setting('app.tenant_id', true))
  WITH CHECK ("tenant_id"::text = current_setting('app.tenant_id', true));

ALTER TABLE "invoices" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "invoices" FORCE ROW LEVEL SECURITY;
CREATE POLICY "invoices_tenant_isolation" ON "invoices"
  USING ("tenant_id"::text = current_setting('app.tenant_id', true))
  WITH CHECK ("tenant_id"::text = current_setting('app.tenant_id', true));

ALTER TABLE "invoice_installments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "invoice_installments" FORCE ROW LEVEL SECURITY;
CREATE POLICY "invoice_installments_tenant_isolation" ON "invoice_installments"
  USING ("tenant_id"::text = current_setting('app.tenant_id', true))
  WITH CHECK ("tenant_id"::text = current_setting('app.tenant_id', true));

ALTER TABLE "bank_transactions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "bank_transactions" FORCE ROW LEVEL SECURITY;
CREATE POLICY "bank_transactions_tenant_isolation" ON "bank_transactions"
  USING ("tenant_id"::text = current_setting('app.tenant_id', true))
  WITH CHECK ("tenant_id"::text = current_setting('app.tenant_id', true));

ALTER TABLE "payment_allocations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "payment_allocations" FORCE ROW LEVEL SECURITY;
CREATE POLICY "payment_allocations_tenant_isolation" ON "payment_allocations"
  USING ("tenant_id"::text = current_setting('app.tenant_id', true))
  WITH CHECK ("tenant_id"::text = current_setting('app.tenant_id', true));

ALTER TABLE "match_memories" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "match_memories" FORCE ROW LEVEL SECURITY;
CREATE POLICY "match_memories_tenant_isolation" ON "match_memories"
  USING ("tenant_id"::text = current_setting('app.tenant_id', true))
  WITH CHECK ("tenant_id"::text = current_setting('app.tenant_id', true));

-- Sign-in happens before the workspace is known: a read-only policy lets a transaction that set
-- app.auth_email see exactly the user with that email, and nothing else.
CREATE POLICY "users_auth_lookup" ON "users" FOR SELECT
  USING ("email" = current_setting('app.auth_email', true));

-- The API and worker connect as vult_app (no BYPASSRLS, not the owner of the tables). Grant it access to
-- these tables and to the ones future migrations create. Skipped when the role does not exist yet.
DO $grants$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'vult_app') THEN
    GRANT USAGE ON SCHEMA public TO vult_app;
    GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO vult_app;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO vult_app;
  END IF;
END
$grants$;
