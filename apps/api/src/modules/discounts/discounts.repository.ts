import { Injectable } from '@nestjs/common';
import { PrismaService } from '@merkatopos/database';
import { Prisma } from '@prisma/client';

@Injectable()
export class DiscountsRepository {
  constructor(private readonly prisma: PrismaService) {}

  list(tenantId: string) {
    return this.prisma.productDiscount.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      include: { product: { select: { id: true, name: true } } },
    });
  }

  find(tenantId: string, discountId: string) {
    return this.prisma.productDiscount.findFirst({
      where: { id: discountId, tenantId },
    });
  }

  findProduct(tenantId: string, productId: string) {
    return this.prisma.product.findFirst({
      where: { id: productId, tenantId, isActive: true },
      select: { id: true },
    });
  }

  create(
    tenantId: string,
    input: {
      productId: string;
      name: string;
      percentage: string;
      startsAt?: Date;
      endsAt?: Date;
    },
  ) {
    return this.prisma.productDiscount.create({
      data: {
        tenantId,
        productId: input.productId,
        name: input.name,
        percentage: new Prisma.Decimal(input.percentage),
        ...(input.startsAt ? { startsAt: input.startsAt } : {}),
        ...(input.endsAt ? { endsAt: input.endsAt } : {}),
      },
    });
  }

  update(
    tenantId: string,
    discountId: string,
    input: {
      name?: string;
      percentage?: string;
      startsAt?: Date;
      endsAt?: Date;
      isActive?: boolean;
    },
  ) {
    return this.prisma.productDiscount.updateMany({
      where: { id: discountId, tenantId },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.percentage !== undefined
          ? { percentage: new Prisma.Decimal(input.percentage) }
          : {}),
        ...(input.startsAt !== undefined ? { startsAt: input.startsAt } : {}),
        ...(input.endsAt !== undefined ? { endsAt: input.endsAt } : {}),
        ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
      },
    });
  }
}
