import { Injectable } from '@nestjs/common';
import { PrismaService } from '@merkatopos/database';

@Injectable()
export class BranchesRepository {
  constructor(private readonly prisma: PrismaService) {}

  listForTenant(tenantId: string) {
    return this.prisma.branch.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
    });
  }

  findForTenant(tenantId: string, branchId: string) {
    return this.prisma.branch.findFirst({
      where: { id: branchId, tenantId },
    });
  }

  create(tenantId: string, data: { name: string; code?: string }) {
    return this.prisma.branch.create({
      data: { tenantId, name: data.name, ...(data.code ? { code: data.code } : {}) },
    });
  }

  update(
    tenantId: string,
    branchId: string,
    data: { name?: string; code?: string; isActive?: boolean },
  ) {
    return this.prisma.branch.updateMany({
      where: { id: branchId, tenantId },
      data,
    });
  }
}
