import { Injectable } from '@nestjs/common';
import { PrismaService } from '@merkatopos/database';

@Injectable()
export class CategoriesRepository {
  constructor(private readonly prisma: PrismaService) {}

  list(tenantId: string) {
    return this.prisma.category.findMany({
      where: { tenantId },
      orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
    });
  }

  find(tenantId: string, categoryId: string) {
    return this.prisma.category.findFirst({ where: { id: categoryId, tenantId } });
  }

  create(
    tenantId: string,
    data: { name: string; displayOrder?: number; posVisible?: boolean },
  ) {
    return this.prisma.category.create({ data: { tenantId, ...data } });
  }

  update(
    tenantId: string,
    categoryId: string,
    data: { name?: string; displayOrder?: number; posVisible?: boolean; isActive?: boolean },
  ) {
    return this.prisma.category.updateMany({
      where: { id: categoryId, tenantId },
      data,
    });
  }
}
