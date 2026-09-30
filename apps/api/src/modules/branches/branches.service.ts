import { Injectable } from '@nestjs/common';
import { BranchesRepository } from './branches.repository';

@Injectable()
export class BranchesService {
  constructor(private readonly repository: BranchesRepository) {}

  list(tenantId: string) {
    return this.repository.listForTenant(tenantId);
  }
}
