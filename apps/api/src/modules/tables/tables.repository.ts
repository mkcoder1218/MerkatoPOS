import { Injectable } from '@nestjs/common';
import { PrismaService } from '@merkatopos/database';

@Injectable()
export class TablesRepository {
  constructor(private readonly prisma: PrismaService) {}

  getSettings(tenantId: string) {
    return this.prisma.posSettings.upsert({
      where: { tenantId },
      create: { tenantId },
      update: {},
    });
  }

  list(tenantId: string, branchIds: string[]) {
    return this.prisma.diningTable.findMany({
      where: { tenantId, branchId: { in: branchIds } },
      orderBy: [{ branchId: 'asc' }, { code: 'asc' }],
      include: {
        orders: {
          where: { status: { in: ['DRAFT', 'OPEN'] } },
          select: { id: true, orderNumber: true },
          take: 1,
        },
      },
    });
  }

  findBranch(tenantId: string, branchId: string) {
    return this.prisma.branch.findFirst({
      where: { id: branchId, tenantId, isActive: true },
    });
  }

  find(tenantId: string, tableId: string) {
    return this.prisma.diningTable.findFirst({
      where: { id: tableId, tenantId },
    });
  }

  create(
    tenantId: string,
    data: { branchId: string; name: string; code: string; capacity?: number },
  ) {
    return this.prisma.diningTable.create({
      data: { tenantId, ...data },
    });
  }

  update(
    tenantId: string,
    tableId: string,
    data: { name?: string; code?: string; capacity?: number; isActive?: boolean },
  ) {
    return this.prisma.diningTable.updateMany({
      where: { id: tableId, tenantId },
      data,
    });
  }
}
