import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { DatabaseModule } from '@merkatopos/database';
import { AuthModule } from '../modules/auth/auth.module';
import { BranchesModule } from '../modules/branches/branches.module';
import { CategoriesModule } from '../modules/categories/categories.module';
import { DevicesModule } from '../modules/devices/devices.module';
import { DiscountsModule } from '../modules/discounts/discounts.module';
import { HealthModule } from '../modules/health/health.module';
import { InventoryModule } from '../modules/inventory/inventory.module';
import { ModifiersModule } from '../modules/modifiers/modifiers.module';
import { PermissionsModule } from '../modules/permissions/permissions.module';
import { ProductsModule } from '../modules/products/products.module';
import { RegistersModule } from '../modules/registers/registers.module';
import { RolesModule } from '../modules/roles/roles.module';
import { TaxesModule } from '../modules/taxes/taxes.module';
import { TenantsModule } from '../modules/tenants/tenants.module';
import { UnitsModule } from '../modules/units/units.module';
import { UsersModule } from '../modules/users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    DatabaseModule,
    HealthModule,
    AuthModule,
    TenantsModule,
    BranchesModule,
    UsersModule,
    RolesModule,
    PermissionsModule,
    DevicesModule,
    RegistersModule,
    CategoriesModule,
    UnitsModule,
    TaxesModule,
    ProductsModule,
    ModifiersModule,
    DiscountsModule,
    InventoryModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
