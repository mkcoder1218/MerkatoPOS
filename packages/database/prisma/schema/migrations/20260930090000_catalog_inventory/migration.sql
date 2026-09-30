-- CreateEnum
CREATE TYPE "TaxMode" AS ENUM ('INCLUSIVE', 'EXCLUSIVE');

-- CreateEnum
CREATE TYPE "StockMovementType" AS ENUM (
  'PURCHASE',
  'SALE',
  'WASTE',
  'PRODUCTION',
  'TRANSFER_OUT',
  'TRANSFER_IN',
  'ADJUSTMENT',
  'RETURN'
);

-- CreateTable
CREATE TABLE "categories" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "displayOrder" INTEGER NOT NULL DEFAULT 0,
  "posVisible" BOOLEAN NOT NULL DEFAULT true,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "units" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "symbol" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "units_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "unit_conversions" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "fromUnitId" TEXT NOT NULL,
  "toUnitId" TEXT NOT NULL,
  "multiplier" DECIMAL(18,6) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "unit_conversions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "tax_profiles" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "percentage" DECIMAL(5,2) NOT NULL,
  "mode" "TaxMode" NOT NULL,
  "isDefault" BOOLEAN NOT NULL DEFAULT false,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "tax_profiles_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "products" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "categoryId" TEXT NOT NULL,
  "unitId" TEXT NOT NULL,
  "taxProfileId" TEXT,
  "name" TEXT NOT NULL,
  "sku" TEXT,
  "barcode" TEXT,
  "sellingPrice" DECIMAL(18,2) NOT NULL,
  "taxExempt" BOOLEAN NOT NULL DEFAULT false,
  "trackInventory" BOOLEAN NOT NULL DEFAULT false,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "product_branches" (
  "productId" TEXT NOT NULL,
  "branchId" TEXT NOT NULL,
  "isAvailable" BOOLEAN NOT NULL DEFAULT true,
  "priceOverride" DECIMAL(18,2),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "product_branches_pkey" PRIMARY KEY ("productId", "branchId")
);

CREATE TABLE "modifier_groups" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "minSelect" INTEGER NOT NULL DEFAULT 0,
  "maxSelect" INTEGER NOT NULL DEFAULT 1,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "modifier_groups_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "modifier_options" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "modifierGroupId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "priceDelta" DECIMAL(18,2) NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "modifier_options_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "product_modifier_groups" (
  "productId" TEXT NOT NULL,
  "modifierGroupId" TEXT NOT NULL,
  "displayOrder" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "product_modifier_groups_pkey" PRIMARY KEY ("productId", "modifierGroupId")
);

CREATE TABLE "product_discounts" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "percentage" DECIMAL(5,2) NOT NULL,
  "startsAt" TIMESTAMP(3),
  "endsAt" TIMESTAMP(3),
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "product_discounts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "inventory_items" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "branchId" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "unitId" TEXT NOT NULL,
  "currentQuantity" DECIMAL(18,6) NOT NULL DEFAULT 0,
  "allowNegativeStock" BOOLEAN NOT NULL DEFAULT false,
  "version" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "inventory_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "stock_movements" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "branchId" TEXT NOT NULL,
  "inventoryItemId" TEXT NOT NULL,
  "createdById" TEXT NOT NULL,
  "type" "StockMovementType" NOT NULL,
  "quantityDelta" DECIMAL(18,6) NOT NULL,
  "quantityAfter" DECIMAL(18,6) NOT NULL,
  "referenceType" TEXT,
  "referenceId" TEXT,
  "note" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "stock_movements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "categories_tenantId_name_key" ON "categories"("tenantId", "name");
CREATE INDEX "categories_tenantId_displayOrder_idx" ON "categories"("tenantId", "displayOrder");
CREATE UNIQUE INDEX "units_tenantId_name_key" ON "units"("tenantId", "name");
CREATE UNIQUE INDEX "units_tenantId_symbol_key" ON "units"("tenantId", "symbol");
CREATE INDEX "units_tenantId_idx" ON "units"("tenantId");
CREATE UNIQUE INDEX "unit_conversions_tenantId_fromUnitId_toUnitId_key"
  ON "unit_conversions"("tenantId", "fromUnitId", "toUnitId");
CREATE INDEX "unit_conversions_tenantId_idx" ON "unit_conversions"("tenantId");
CREATE UNIQUE INDEX "tax_profiles_tenantId_name_key" ON "tax_profiles"("tenantId", "name");
CREATE INDEX "tax_profiles_tenantId_isDefault_idx" ON "tax_profiles"("tenantId", "isDefault");
CREATE UNIQUE INDEX "products_tenantId_sku_key" ON "products"("tenantId", "sku");
CREATE UNIQUE INDEX "products_tenantId_barcode_key" ON "products"("tenantId", "barcode");
CREATE INDEX "products_tenantId_categoryId_idx" ON "products"("tenantId", "categoryId");
CREATE INDEX "product_branches_branchId_idx" ON "product_branches"("branchId");
CREATE UNIQUE INDEX "modifier_groups_tenantId_name_key" ON "modifier_groups"("tenantId", "name");
CREATE INDEX "modifier_groups_tenantId_idx" ON "modifier_groups"("tenantId");
CREATE UNIQUE INDEX "modifier_options_modifierGroupId_name_key"
  ON "modifier_options"("modifierGroupId", "name");
CREATE INDEX "modifier_options_tenantId_idx" ON "modifier_options"("tenantId");
CREATE INDEX "product_discounts_tenantId_productId_idx"
  ON "product_discounts"("tenantId", "productId");
CREATE INDEX "product_discounts_startsAt_endsAt_idx"
  ON "product_discounts"("startsAt", "endsAt");
CREATE UNIQUE INDEX "inventory_items_tenantId_branchId_productId_key"
  ON "inventory_items"("tenantId", "branchId", "productId");
CREATE INDEX "inventory_items_tenantId_branchId_idx"
  ON "inventory_items"("tenantId", "branchId");
CREATE INDEX "stock_movements_tenantId_branchId_createdAt_idx"
  ON "stock_movements"("tenantId", "branchId", "createdAt");
CREATE INDEX "stock_movements_inventoryItemId_createdAt_idx"
  ON "stock_movements"("inventoryItemId", "createdAt");

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "units" ADD CONSTRAINT "units_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "unit_conversions" ADD CONSTRAINT "unit_conversions_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "unit_conversions" ADD CONSTRAINT "unit_conversions_fromUnitId_fkey"
  FOREIGN KEY ("fromUnitId") REFERENCES "units"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "unit_conversions" ADD CONSTRAINT "unit_conversions_toUnitId_fkey"
  FOREIGN KEY ("toUnitId") REFERENCES "units"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "tax_profiles" ADD CONSTRAINT "tax_profiles_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "products" ADD CONSTRAINT "products_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "products" ADD CONSTRAINT "products_categoryId_fkey"
  FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "products" ADD CONSTRAINT "products_unitId_fkey"
  FOREIGN KEY ("unitId") REFERENCES "units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "products" ADD CONSTRAINT "products_taxProfileId_fkey"
  FOREIGN KEY ("taxProfileId") REFERENCES "tax_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "product_branches" ADD CONSTRAINT "product_branches_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "product_branches" ADD CONSTRAINT "product_branches_branchId_fkey"
  FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "modifier_groups" ADD CONSTRAINT "modifier_groups_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "modifier_options" ADD CONSTRAINT "modifier_options_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "modifier_options" ADD CONSTRAINT "modifier_options_modifierGroupId_fkey"
  FOREIGN KEY ("modifierGroupId") REFERENCES "modifier_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "product_modifier_groups" ADD CONSTRAINT "product_modifier_groups_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "product_modifier_groups" ADD CONSTRAINT "product_modifier_groups_modifierGroupId_fkey"
  FOREIGN KEY ("modifierGroupId") REFERENCES "modifier_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "product_discounts" ADD CONSTRAINT "product_discounts_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "product_discounts" ADD CONSTRAINT "product_discounts_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_branchId_fkey"
  FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_unitId_fkey"
  FOREIGN KEY ("unitId") REFERENCES "units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_branchId_fkey"
  FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_inventoryItemId_fkey"
  FOREIGN KEY ("inventoryItemId") REFERENCES "inventory_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_createdById_fkey"
  FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
