-- CreateEnum
CREATE TYPE "PrinterType" AS ENUM ('RECEIPT', 'KITCHEN', 'LABEL');
CREATE TYPE "PrinterInterface" AS ENUM ('USB', 'NETWORK', 'SYSTEM');
CREATE TYPE "PrintJobKind" AS ENUM ('RECEIPT', 'KITCHEN', 'LABEL');
CREATE TYPE "PrintJobStatus" AS ENUM ('QUEUED', 'PRINTING', 'PRINTED', 'FAILED', 'RETRYING');

CREATE TABLE "printers" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "branchId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "type" "PrinterType" NOT NULL,
  "interface" "PrinterInterface" NOT NULL,
  "connectionData" JSONB,
  "isDefault" BOOLEAN NOT NULL DEFAULT false,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "printers_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "register_receipt_printers" (
  "registerId" TEXT NOT NULL,
  "printerId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "register_receipt_printers_pkey" PRIMARY KEY ("registerId")
);

CREATE TABLE "kitchen_print_routes" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "branchId" TEXT NOT NULL,
  "printerId" TEXT NOT NULL,
  "categoryId" TEXT,
  "productId" TEXT,
  "priority" INTEGER NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "kitchen_print_routes_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "kitchen_print_routes_exactly_one_target_check"
    CHECK (
      (CASE WHEN "categoryId" IS NOT NULL THEN 1 ELSE 0 END) +
      (CASE WHEN "productId" IS NOT NULL THEN 1 ELSE 0 END) = 1
    )
);

CREATE TABLE "print_jobs" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "branchId" TEXT NOT NULL,
  "printerId" TEXT NOT NULL,
  "orderId" TEXT,
  "kind" "PrintJobKind" NOT NULL,
  "status" "PrintJobStatus" NOT NULL DEFAULT 'QUEUED',
  "payload" JSONB NOT NULL,
  "sourceKey" TEXT,
  "attemptCount" INTEGER NOT NULL DEFAULT 0,
  "maxAttempts" INTEGER NOT NULL DEFAULT 5,
  "claimedAt" TIMESTAMP(3),
  "printedAt" TIMESTAMP(3),
  "failedAt" TIMESTAMP(3),
  "lastError" TEXT,
  "requestedById" TEXT,
  "reprintOfId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "print_jobs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "printers_tenantId_branchId_name_key"
  ON "printers"("tenantId", "branchId", "name");
CREATE INDEX "printers_tenantId_branchId_type_idx"
  ON "printers"("tenantId", "branchId", "type");
CREATE UNIQUE INDEX "printers_one_default_per_type_branch"
  ON "printers"("tenantId", "branchId", "type")
  WHERE "isDefault" = true AND "isActive" = true;

CREATE INDEX "register_receipt_printers_printerId_idx"
  ON "register_receipt_printers"("printerId");

CREATE INDEX "kitchen_print_routes_tenantId_branchId_priority_idx"
  ON "kitchen_print_routes"("tenantId", "branchId", "priority");
CREATE INDEX "kitchen_print_routes_categoryId_idx"
  ON "kitchen_print_routes"("categoryId");
CREATE INDEX "kitchen_print_routes_productId_idx"
  ON "kitchen_print_routes"("productId");

CREATE UNIQUE INDEX "print_jobs_sourceKey_key" ON "print_jobs"("sourceKey");
CREATE INDEX "print_jobs_tenantId_branchId_status_createdAt_idx"
  ON "print_jobs"("tenantId", "branchId", "status", "createdAt");
CREATE INDEX "print_jobs_printerId_status_createdAt_idx"
  ON "print_jobs"("printerId", "status", "createdAt");
CREATE INDEX "print_jobs_orderId_idx" ON "print_jobs"("orderId");

ALTER TABLE "printers" ADD CONSTRAINT "printers_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "printers" ADD CONSTRAINT "printers_branchId_fkey"
  FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "register_receipt_printers" ADD CONSTRAINT "register_receipt_printers_registerId_fkey"
  FOREIGN KEY ("registerId") REFERENCES "registers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "register_receipt_printers" ADD CONSTRAINT "register_receipt_printers_printerId_fkey"
  FOREIGN KEY ("printerId") REFERENCES "printers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "kitchen_print_routes" ADD CONSTRAINT "kitchen_print_routes_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "kitchen_print_routes" ADD CONSTRAINT "kitchen_print_routes_branchId_fkey"
  FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "kitchen_print_routes" ADD CONSTRAINT "kitchen_print_routes_printerId_fkey"
  FOREIGN KEY ("printerId") REFERENCES "printers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "kitchen_print_routes" ADD CONSTRAINT "kitchen_print_routes_categoryId_fkey"
  FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "kitchen_print_routes" ADD CONSTRAINT "kitchen_print_routes_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "print_jobs" ADD CONSTRAINT "print_jobs_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "print_jobs" ADD CONSTRAINT "print_jobs_branchId_fkey"
  FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "print_jobs" ADD CONSTRAINT "print_jobs_printerId_fkey"
  FOREIGN KEY ("printerId") REFERENCES "printers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "print_jobs" ADD CONSTRAINT "print_jobs_orderId_fkey"
  FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "print_jobs" ADD CONSTRAINT "print_jobs_requestedById_fkey"
  FOREIGN KEY ("requestedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "print_jobs" ADD CONSTRAINT "print_jobs_reprintOfId_fkey"
  FOREIGN KEY ("reprintOfId") REFERENCES "print_jobs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
