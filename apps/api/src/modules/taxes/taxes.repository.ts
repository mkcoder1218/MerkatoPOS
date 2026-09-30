import { Injectable } from '@nestjs/common';
import { PrismaService } from '@merkatopos/database';
import { Prisma, type TaxMode } from '@prisma/client';

@Injectable()
export class TaxesRepository {
  constructor(private readonly prisma: PrismaService) {}

  list(tenantId: string) {
    return this.prisma.taxProfile.findMany({
      where: { tenantId },
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
    });
  }

  find(tenantId: string, taxProfileId: string) {
    return this.prisma.taxProfile.findFirst({ where: { id: taxProfileId, tenantId } });
  }

  async create(
    tenantId: string,
    input: { name: string; percentage: string; mode: TaxMode; isDefault?: boolean },
  ) {
    return this.prisma.$transaction(async (tx) => {
      if (input.isDefault) {
        await tx.taxProfile.updateMany({
          where: { tenantId, isDefault: true },
          data: { isDefault: false },
        });
      }

      return tx.taxProfile.create({
        data: {
          tenantId,
          name: input.name,
          percentage: new Prisma.Decimal(input.percentage),
          mode: input.mode,
          ...(input.isDefault !== undefined ? { isDefault: input.isDefault } : {}),
        },
      });
    });
  }

  async update(
    tenantId: string,
    taxProfileId: string,
    input: {
      name?: string;
      percentage?: string;
      mode?: TaxMode;
      isDefault?: boolean;
      isActive?: boolean;
    },
  ) {
    return this.prisma.$transaction(async (tx) => {
      if (input.isDefault) {
        await tx.taxProfile.updateMany({
          where: { tenantId, isDefault: true, id: { not: taxProfileId } },
          data: { isDefault: false },
        });
      }

      await tx.taxProfile.updateMany({
        where: { id: taxProfileId, tenantId },
        data: {
          ...(input.name !== undefined ? { name: input.name } : {}),
          ...(input.percentage !== undefined
            ? { percentage: new Prisma.Decimal(input.percentage) }
            : {}),
          ...(input.mode !== undefined ? { mode: input.mode } : {}),
          ...(input.isDefault !== undefined ? { isDefault: input.isDefault } : {}),
          ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
        },
      });

      return tx.taxProfile.findFirst({ where: { id: taxProfileId, tenantId } });
    });
  }
}
