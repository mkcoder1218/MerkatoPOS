import { Injectable } from '@nestjs/common';
import { PrismaService } from '@merkatopos/database';
import { Prisma } from '@prisma/client';

@Injectable()
export class ModifiersRepository {
  constructor(private readonly prisma: PrismaService) {}

  listGroups(tenantId: string) {
    return this.prisma.modifierGroup.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
      include: { options: { orderBy: { name: 'asc' } } },
    });
  }

  findGroup(tenantId: string, groupId: string) {
    return this.prisma.modifierGroup.findFirst({ where: { id: groupId, tenantId } });
  }

  findOption(tenantId: string, optionId: string) {
    return this.prisma.modifierOption.findFirst({ where: { id: optionId, tenantId } });
  }

  createGroup(
    tenantId: string,
    data: { name: string; minSelect?: number; maxSelect?: number },
  ) {
    return this.prisma.modifierGroup.create({ data: { tenantId, ...data } });
  }

  updateGroup(
    tenantId: string,
    groupId: string,
    data: { name?: string; minSelect?: number; maxSelect?: number; isActive?: boolean },
  ) {
    return this.prisma.modifierGroup.updateMany({ where: { id: groupId, tenantId }, data });
  }

  createOption(tenantId: string, groupId: string, name: string, priceDelta: string) {
    return this.prisma.modifierOption.create({
      data: {
        tenantId,
        modifierGroupId: groupId,
        name,
        priceDelta: new Prisma.Decimal(priceDelta),
      },
    });
  }

  updateOption(
    tenantId: string,
    optionId: string,
    data: { name?: string; priceDelta?: string; isActive?: boolean },
  ) {
    return this.prisma.modifierOption.updateMany({
      where: { id: optionId, tenantId },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.priceDelta !== undefined
          ? { priceDelta: new Prisma.Decimal(data.priceDelta) }
          : {}),
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
      },
    });
  }

  findProduct(tenantId: string, productId: string) {
    return this.prisma.product.findFirst({ where: { id: productId, tenantId } });
  }

  findGroups(tenantId: string, groupIds: string[]) {
    return this.prisma.modifierGroup.findMany({
      where: { tenantId, id: { in: groupIds } },
      select: { id: true },
    });
  }

  async replaceProductGroups(productId: string, groupIds: string[]) {
    return this.prisma.$transaction(async (tx) => {
      await tx.productModifierGroup.deleteMany({ where: { productId } });
      if (groupIds.length > 0) {
        await tx.productModifierGroup.createMany({
          data: groupIds.map((modifierGroupId, displayOrder) => ({
            productId,
            modifierGroupId,
            displayOrder,
          })),
        });
      }
      return tx.productModifierGroup.findMany({
        where: { productId },
        include: { modifierGroup: { include: { options: true } } },
        orderBy: { displayOrder: 'asc' },
      });
    });
  }
}
