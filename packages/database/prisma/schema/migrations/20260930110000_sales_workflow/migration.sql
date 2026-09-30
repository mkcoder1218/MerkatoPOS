-- CreateEnum
CREATE TYPE "ShiftStatus" AS ENUM ('OPEN', 'CLOSED');
CREATE TYPE "OrderType" AS ENUM ('DINE_IN', 'TAKEAWAY', 'PICKUP', 'DELIVERY');
CREATE TYPE "OrderStatus" AS ENUM ('DRAFT', 'OPEN', 'COMPLETED', 'VOID_PENDING', 'VOIDED');
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'BANK_TRANSFER', 'TELEBIRR', 'CHAPA');
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REVERSED');
CREATE TYPE "VoidRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

CREATE TABLE "pos_settings" (
  "tenantId" TEXT NOT NULL,
  "requireActiveShift" BOOLEAN NOT NULL DEFAULT true,
  "tablesEnabled" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "pos_settings_pkey" PRIMARY KEY ("tenantId")
);

CREATE TABLE "shifts" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "branchId" TEXT NOT NULL,
  "registerId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "status" "ShiftStatus" NOT NULL DEFAULT 'OPEN',
  "openingCash" DECIMAL(18,2) NOT NULL DEFAULT 0,
  "expectedCash" DECIMAL(18,2),
  "countedCash" DECIMAL(18,2),
  "discrepancy" DECIMAL(18,2),
  "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "closedAt" TIMESTAMP(3),
  "closingNote" TEXT,
  CONSTRAINT "shifts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "dining_tables" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "branchId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "capacity" INTEGER,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "dining_tables_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "orders" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "branchId" TEXT NOT NULL,
  "registerId" TEXT NOT NULL,
  "shiftId" TEXT,
  "userId" TEXT NOT NULL,
  "tableId" TEXT,
  "orderNumber" TEXT NOT NULL,
  "type" "OrderType" NOT NULL,
  "status" "OrderStatus" NOT NULL DEFAULT 'DRAFT',
  "subtotal" DECIMAL(18,2) NOT NULL DEFAULT 0,
  "discountTotal" DECIMAL(18,2) NOT NULL DEFAULT 0,
  "taxTotal" DECIMAL(18,2) NOT NULL DEFAULT 0,
  "grandTotal" DECIMAL(18,2) NOT NULL DEFAULT 0,
  "completedAt" TIMESTAMP(3),
  "voidedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "order_items" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "productName" TEXT NOT NULL,
  "skuSnapshot" TEXT,
  "unitId" TEXT NOT NULL,
  "unitSymbol" TEXT NOT NULL,
  "quantity" DECIMAL(18,6) NOT NULL,
  "unitPrice" DECIMAL(18,2) NOT NULL,
  "modifierTotal" DECIMAL(18,2) NOT NULL DEFAULT 0,
  "discountPercentage" DECIMAL(5,2) NOT NULL DEFAULT 0,
  "discountAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
  "taxPercentage" DECIMAL(5,2) NOT NULL DEFAULT 0,
  "taxMode" "TaxMode",
  "taxAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
  "lineSubtotal" DECIMAL(18,2) NOT NULL,
  "lineTotal" DECIMAL(18,2) NOT NULL,
  "note" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "order_item_modifiers" (
  "id" TEXT NOT NULL,
  "orderItemId" TEXT NOT NULL,
  "modifierOptionId" TEXT NOT NULL,
  "modifierGroupName" TEXT NOT NULL,
  "modifierOptionName" TEXT NOT NULL,
  "priceDelta" DECIMAL(18,2) NOT NULL,
  CONSTRAINT "order_item_modifiers_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "payments" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "method" "PaymentMethod" NOT NULL,
  "status" "PaymentStatus" NOT NULL DEFAULT 'COMPLETED',
  "amount" DECIMAL(18,2) NOT NULL,
  "reference" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "reversedAt" TIMESTAMP(3),
  CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "sale_completions" (
  "orderId" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "idempotencyKey" TEXT NOT NULL,
  "receiptNumber" TEXT NOT NULL,
  "completedById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "sale_completions_pkey" PRIMARY KEY ("orderId")
);

CREATE TABLE "void_requests" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "requestedById" TEXT NOT NULL,
  "approvedById" TEXT,
  "status" "VoidRequestStatus" NOT NULL DEFAULT 'PENDING',
  "reason" TEXT NOT NULL,
  "decisionNote" TEXT,
  "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "decidedAt" TIMESTAMP(3),
  CONSTRAINT "void_requests_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "shifts_tenantId_branchId_status_idx" ON "shifts"("tenantId","branchId","status");
CREATE INDEX "shifts_registerId_status_idx" ON "shifts"("registerId","status");
CREATE INDEX "shifts_userId_status_idx" ON "shifts"("userId","status");
CREATE UNIQUE INDEX "shifts_one_open_per_register"
  ON "shifts"("registerId") WHERE "status" = 'OPEN';

CREATE UNIQUE INDEX "dining_tables_tenantId_branchId_code_key"
  ON "dining_tables"("tenantId","branchId","code");
CREATE INDEX "dining_tables_tenantId_branchId_idx"
  ON "dining_tables"("tenantId","branchId");

CREATE UNIQUE INDEX "orders_tenantId_orderNumber_key"
  ON "orders"("tenantId","orderNumber");
CREATE INDEX "orders_tenantId_branchId_status_createdAt_idx"
  ON "orders"("tenantId","branchId","status","createdAt");
CREATE INDEX "order_items_orderId_idx" ON "order_items"("orderId");
CREATE INDEX "order_items_productId_idx" ON "order_items"("productId");
CREATE INDEX "order_item_modifiers_orderItemId_idx"
  ON "order_item_modifiers"("orderItemId");
CREATE INDEX "payments_tenantId_orderId_idx" ON "payments"("tenantId","orderId");
CREATE INDEX "payments_reference_idx" ON "payments"("reference");
CREATE UNIQUE INDEX "sale_completions_tenantId_idempotencyKey_key"
  ON "sale_completions"("tenantId","idempotencyKey");
CREATE UNIQUE INDEX "sale_completions_tenantId_receiptNumber_key"
  ON "sale_completions"("tenantId","receiptNumber");
CREATE UNIQUE INDEX "void_requests_orderId_key" ON "void_requests"("orderId");
CREATE INDEX "void_requests_tenantId_status_idx"
  ON "void_requests"("tenantId","status");

ALTER TABLE "pos_settings" ADD CONSTRAINT "pos_settings_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "shifts" ADD CONSTRAINT "shifts_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "shifts" ADD CONSTRAINT "shifts_branchId_fkey"
  FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "shifts" ADD CONSTRAINT "shifts_registerId_fkey"
  FOREIGN KEY ("registerId") REFERENCES "registers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "shifts" ADD CONSTRAINT "shifts_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "dining_tables" ADD CONSTRAINT "dining_tables_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "dining_tables" ADD CONSTRAINT "dining_tables_branchId_fkey"
  FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "orders" ADD CONSTRAINT "orders_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "orders" ADD CONSTRAINT "orders_branchId_fkey"
  FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "orders" ADD CONSTRAINT "orders_registerId_fkey"
  FOREIGN KEY ("registerId") REFERENCES "registers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "orders" ADD CONSTRAINT "orders_shiftId_fkey"
  FOREIGN KEY ("shiftId") REFERENCES "shifts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "orders" ADD CONSTRAINT "orders_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "orders" ADD CONSTRAINT "orders_tableId_fkey"
  FOREIGN KEY ("tableId") REFERENCES "dining_tables"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_orderId_fkey"
  FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_unitId_fkey"
  FOREIGN KEY ("unitId") REFERENCES "units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "order_item_modifiers" ADD CONSTRAINT "order_item_modifiers_orderItemId_fkey"
  FOREIGN KEY ("orderItemId") REFERENCES "order_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "order_item_modifiers" ADD CONSTRAINT "order_item_modifiers_modifierOptionId_fkey"
  FOREIGN KEY ("modifierOptionId") REFERENCES "modifier_options"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payments" ADD CONSTRAINT "payments_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payments" ADD CONSTRAINT "payments_orderId_fkey"
  FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "sale_completions" ADD CONSTRAINT "sale_completions_orderId_fkey"
  FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "sale_completions" ADD CONSTRAINT "sale_completions_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "sale_completions" ADD CONSTRAINT "sale_completions_completedById_fkey"
  FOREIGN KEY ("completedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "void_requests" ADD CONSTRAINT "void_requests_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "void_requests" ADD CONSTRAINT "void_requests_orderId_fkey"
  FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "void_requests" ADD CONSTRAINT "void_requests_requestedById_fkey"
  FOREIGN KEY ("requestedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "void_requests" ADD CONSTRAINT "void_requests_approvedById_fkey"
  FOREIGN KEY ("approvedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
