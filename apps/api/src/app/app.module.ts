import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '@merkatopos/database';
import { AuthModule } from '../modules/auth/auth.module';
import { BranchesModule } from '../modules/branches/branches.module';
import { DevicesModule } from '../modules/devices/devices.module';
import { HealthModule } from '../modules/health/health.module';
import { PermissionsModule } from '../modules/permissions/permissions.module';
import { RolesModule } from '../modules/roles/roles.module';
import { TenantsModule } from '../modules/tenants/tenants.module';
import { UsersModule } from '../modules/users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    HealthModule,
    AuthModule,
    TenantsModule,
    BranchesModule,
    UsersModule,
    RolesModule,
    PermissionsModule,
    DevicesModule,
  ],
})
export class AppModule {}
