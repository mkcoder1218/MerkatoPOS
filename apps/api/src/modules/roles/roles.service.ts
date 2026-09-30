import { Injectable } from '@nestjs/common';
import { RolesRepository } from './roles.repository';

@Injectable()
export class RolesService {
  constructor(private readonly repository: RolesRepository) {}

  list(tenantId: string) {
    return this.repository.listForTenant(tenantId);
  }
}
