-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'MANAGER', 'MEMBER', 'READ_ONLY');

-- CreateEnum
CREATE TYPE "AttributeType" AS ENUM ('TEXT', 'NUMBER', 'CURRENCY', 'STATUS', 'DATE', 'BOOLEAN', 'USER_REF', 'OBJECT_REF');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('PEC_EMAIL', 'SDI_INVOICE_XML', 'CONTRACT_PDF', 'MEETING_NOTE');

-- CreateEnum
CREATE TYPE "SourceType" AS ENUM ('PEC', 'EMAIL', 'INVOICE', 'MEETING', 'NOTE');

-- CreateEnum
CREATE TYPE "InvoiceKind" AS ENUM ('INVOICE', 'CREDIT_NOTE');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('TRANSFER', 'RIBA', 'DIRECT_DEBIT', 'CASH', 'CARD', 'OTHER');

-- CreateEnum
CREATE TYPE "BankTransactionStatus" AS ENUM ('UNMATCHED', 'SUGGESTED', 'MATCHED', 'IGNORED');

-- CreateEnum
CREATE TYPE "AllocationSource" AS ENUM ('AUTO', 'CONFIRMED');

-- CreateTable
CREATE TABLE "tenants" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "legal_name" TEXT,
    "vat_number" TEXT,
    "tax_code" TEXT,
    "sdi_code" TEXT,
    "pec_email" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'MEMBER',
    "password_hash" TEXT,
    "last_login_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "object_types" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "object_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attributes" (
    "id" UUID NOT NULL,
    "object_type_id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "data_type" "AttributeType" NOT NULL,
    "is_required" BOOLEAN NOT NULL DEFAULT false,
    "options" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attributes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "records" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "object_type_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attribute_values" (
    "id" UUID NOT NULL,
    "record_id" UUID NOT NULL,
    "object_type_id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "attribute_id" UUID NOT NULL,
    "text_value" TEXT,
    "number_value" DOUBLE PRECISION,
    "decimal_value" DECIMAL(20,4),
    "boolean_value" BOOLEAN,
    "date_value" TIMESTAMP(3),
    "json_value" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attribute_values_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "record_relations" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "source_record_id" UUID NOT NULL,
    "target_record_id" UUID NOT NULL,
    "relation_type" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "record_relations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "record_id" UUID,
    "title" TEXT NOT NULL,
    "file_url" TEXT NOT NULL,
    "doc_type" "DocumentType" NOT NULL,
    "parsed_data" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_memories" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "user_id" UUID,
    "vector_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "source_type" "SourceType" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_memories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "document_id" UUID,
    "record_id" UUID,
    "kind" "InvoiceKind" NOT NULL,
    "document_type" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "issue_date" DATE NOT NULL,
    "customer_vat" TEXT NOT NULL,
    "customer_name" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "total_cents" BIGINT NOT NULL,
    "withholding_cents" BIGINT NOT NULL DEFAULT 0,
    "split_payment" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoice_installments" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "invoice_id" UUID NOT NULL,
    "seq" INTEGER NOT NULL,
    "due_date" DATE NOT NULL,
    "amount_cents" BIGINT NOT NULL,
    "paid_cents" BIGINT NOT NULL DEFAULT 0,
    "method" "PaymentMethod" NOT NULL,
    "iban" TEXT,
    "estimated" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "invoice_installments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bank_transactions" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "external_id" TEXT NOT NULL,
    "booking_date" DATE NOT NULL,
    "amount_cents" BIGINT NOT NULL,
    "counterparty_name" TEXT NOT NULL,
    "counterparty_iban" TEXT,
    "description" TEXT NOT NULL,
    "status" "BankTransactionStatus" NOT NULL DEFAULT 'UNMATCHED',
    "suggestion" JSONB,
    "auto_blocked" BOOLEAN NOT NULL DEFAULT false,
    "confidence" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bank_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_allocations" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "transaction_id" UUID NOT NULL,
    "installment_id" UUID NOT NULL,
    "amount_cents" BIGINT NOT NULL,
    "source" "AllocationSource" NOT NULL,
    "confidence" DOUBLE PRECISION,
    "confirmed_by_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_allocations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "match_memories" (
    "tenant_id" UUID NOT NULL,
    "data" JSONB NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "match_memories_pkey" PRIMARY KEY ("tenant_id")
);

-- CreateIndex
CREATE INDEX "tenants_vat_number_idx" ON "tenants"("vat_number");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_tenant_id_email_key" ON "users"("tenant_id", "email");

-- CreateIndex
CREATE UNIQUE INDEX "users_id_tenant_id_key" ON "users"("id", "tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "object_types_tenant_id_slug_key" ON "object_types"("tenant_id", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "object_types_id_tenant_id_key" ON "object_types"("id", "tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "attributes_object_type_id_slug_key" ON "attributes"("object_type_id", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "attributes_id_object_type_id_key" ON "attributes"("id", "object_type_id");

-- CreateIndex
CREATE UNIQUE INDEX "attributes_id_object_type_id_tenant_id_key" ON "attributes"("id", "object_type_id", "tenant_id");

-- CreateIndex
CREATE INDEX "records_tenant_id_object_type_id_updated_at_idx" ON "records"("tenant_id", "object_type_id", "updated_at");

-- CreateIndex
CREATE UNIQUE INDEX "records_id_tenant_id_key" ON "records"("id", "tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "records_id_object_type_id_key" ON "records"("id", "object_type_id");

-- CreateIndex
CREATE INDEX "attribute_values_tenant_id_attribute_id_text_value_idx" ON "attribute_values"("tenant_id", "attribute_id", "text_value");

-- CreateIndex
CREATE INDEX "attribute_values_tenant_id_attribute_id_number_value_idx" ON "attribute_values"("tenant_id", "attribute_id", "number_value");

-- CreateIndex
CREATE UNIQUE INDEX "attribute_values_record_id_attribute_id_key" ON "attribute_values"("record_id", "attribute_id");

-- CreateIndex
CREATE INDEX "record_relations_tenant_id_source_record_id_idx" ON "record_relations"("tenant_id", "source_record_id");

-- CreateIndex
CREATE INDEX "record_relations_tenant_id_target_record_id_idx" ON "record_relations"("tenant_id", "target_record_id");

-- CreateIndex
CREATE INDEX "documents_tenant_id_doc_type_created_at_idx" ON "documents"("tenant_id", "doc_type", "created_at");

-- CreateIndex
CREATE INDEX "ai_memories_tenant_id_source_type_created_at_idx" ON "ai_memories"("tenant_id", "source_type", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "ai_memories_tenant_id_vector_id_key" ON "ai_memories"("tenant_id", "vector_id");

-- CreateIndex
CREATE INDEX "invoices_tenant_id_customer_vat_idx" ON "invoices"("tenant_id", "customer_vat");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_tenant_id_customer_vat_number_issue_date_key" ON "invoices"("tenant_id", "customer_vat", "number", "issue_date");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_id_tenant_id_key" ON "invoices"("id", "tenant_id");

-- CreateIndex
CREATE INDEX "invoice_installments_tenant_id_due_date_idx" ON "invoice_installments"("tenant_id", "due_date");

-- CreateIndex
CREATE UNIQUE INDEX "invoice_installments_invoice_id_seq_key" ON "invoice_installments"("invoice_id", "seq");

-- CreateIndex
CREATE UNIQUE INDEX "invoice_installments_id_tenant_id_key" ON "invoice_installments"("id", "tenant_id");

-- CreateIndex
CREATE INDEX "bank_transactions_tenant_id_status_booking_date_idx" ON "bank_transactions"("tenant_id", "status", "booking_date");

-- CreateIndex
CREATE UNIQUE INDEX "bank_transactions_tenant_id_external_id_key" ON "bank_transactions"("tenant_id", "external_id");

-- CreateIndex
CREATE UNIQUE INDEX "bank_transactions_id_tenant_id_key" ON "bank_transactions"("id", "tenant_id");

-- CreateIndex
CREATE INDEX "payment_allocations_tenant_id_installment_id_idx" ON "payment_allocations"("tenant_id", "installment_id");

-- CreateIndex
CREATE INDEX "payment_allocations_tenant_id_transaction_id_idx" ON "payment_allocations"("tenant_id", "transaction_id");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "object_types" ADD CONSTRAINT "object_types_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attributes" ADD CONSTRAINT "attributes_object_type_id_tenant_id_fkey" FOREIGN KEY ("object_type_id", "tenant_id") REFERENCES "object_types"("id", "tenant_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "records" ADD CONSTRAINT "records_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "records" ADD CONSTRAINT "records_object_type_id_tenant_id_fkey" FOREIGN KEY ("object_type_id", "tenant_id") REFERENCES "object_types"("id", "tenant_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attribute_values" ADD CONSTRAINT "attribute_values_record_id_object_type_id_fkey" FOREIGN KEY ("record_id", "object_type_id") REFERENCES "records"("id", "object_type_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attribute_values" ADD CONSTRAINT "attribute_values_attribute_id_object_type_id_tenant_id_fkey" FOREIGN KEY ("attribute_id", "object_type_id", "tenant_id") REFERENCES "attributes"("id", "object_type_id", "tenant_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "record_relations" ADD CONSTRAINT "record_relations_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "record_relations" ADD CONSTRAINT "record_relations_source_record_id_tenant_id_fkey" FOREIGN KEY ("source_record_id", "tenant_id") REFERENCES "records"("id", "tenant_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "record_relations" ADD CONSTRAINT "record_relations_target_record_id_tenant_id_fkey" FOREIGN KEY ("target_record_id", "tenant_id") REFERENCES "records"("id", "tenant_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_record_id_tenant_id_fkey" FOREIGN KEY ("record_id", "tenant_id") REFERENCES "records"("id", "tenant_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_memories" ADD CONSTRAINT "ai_memories_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_memories" ADD CONSTRAINT "ai_memories_user_id_tenant_id_fkey" FOREIGN KEY ("user_id", "tenant_id") REFERENCES "users"("id", "tenant_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_installments" ADD CONSTRAINT "invoice_installments_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_installments" ADD CONSTRAINT "invoice_installments_invoice_id_tenant_id_fkey" FOREIGN KEY ("invoice_id", "tenant_id") REFERENCES "invoices"("id", "tenant_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_transactions" ADD CONSTRAINT "bank_transactions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_allocations" ADD CONSTRAINT "payment_allocations_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_allocations" ADD CONSTRAINT "payment_allocations_transaction_id_tenant_id_fkey" FOREIGN KEY ("transaction_id", "tenant_id") REFERENCES "bank_transactions"("id", "tenant_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_allocations" ADD CONSTRAINT "payment_allocations_installment_id_tenant_id_fkey" FOREIGN KEY ("installment_id", "tenant_id") REFERENCES "invoice_installments"("id", "tenant_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_memories" ADD CONSTRAINT "match_memories_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

