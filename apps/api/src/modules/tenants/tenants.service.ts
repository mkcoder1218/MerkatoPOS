import { Injectable, NotFoundException } from '@nestjs/common';
import type { UpdateTenantDto } from './dto/update-tenant.dto';
import { TenantsRepository } from './tenants.repository';

@Injectable()
export class TenantsService {
  constructor(private readonly repository: TenantsRepository) {}

  async getCurrentTenant(tenantId: string) {
    const tenant = await this.repository.findById(tenantId);
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }
    return tenant;
  }

  async updateCurrentTenant(tenantId: string, dto: UpdateTenantDto) {
    await this.getCurrentTenant(tenantId);
    return this.repository.update(tenantId, {
      ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
    });
  }
}
