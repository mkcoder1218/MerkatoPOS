import { Injectable } from '@nestjs/common';
import { PrismaService } from '@merkatopos/database';
import { Prisma } from '@prisma/client';

@Injectable()
export class UnitsRepository {
  constructor(private readonly prisma: PrismaService) {}

  list(tenantId: string) {
    return this.prisma.unit.findMany({ where: { tenantId }, orderBy: { name: 'asc' } });
  }

  find(tenantId: string, unitId: string) {
    return this.prisma.unit.findFirst({ where: { id: unitId, tenantId } });
  }

  create(tenantId: string, name: string, symbol: string) {
    return this.prisma.unit.create({ data: { tenantId, name, symbol } });
  }

  update(
    tenantId: string,
    unitId: string,
    data: { name?: string; symbol?: string; isActive?: boolean },
  ) {
    return this.prisma.unit.updateMany({ where: { id: unitId, tenantId }, data });
  }

  listConversions(tenantId: string) {
    return this.prisma.unitConversion.findMany({
      where: { tenantId },
      include: {
        fromUnit: { select: { id: true, name: true, symbol: true } },
        toUnit: { select: { id: true, name: true, symbol: true } },
      },
    });
  }

  upsertConversion(
    tenantId: string,
    fromUnitId: string,
    toUnitId: string,
    multiplier: string,
  ) {
    return this.prisma.unitConversion.upsert({
      where: { tenantId_fromUnitId_toUnitId: { tenantId, fromUnitId, toUnitId } },
      create: {
        tenantId,
        fromUnitId,
        toUnitId,
        multiplier: new Prisma.Decimal(multiplier),
      },
      update: { multiplier: new Prisma.Decimal(multiplier) },
    });
  }
}
