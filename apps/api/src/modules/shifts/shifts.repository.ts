import { Injectable } from '@nestjs/common';
import { PrismaService } from '@merkatopos/database';
import { Prisma } from '@prisma/client';

@Injectable()
export class ShiftsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findRegister(tenantId: string, registerId: string) {
    return this.prisma.register.findFirst({
      where: { id: registerId, tenantId, isActive: true },
    });
  }

  findOpenByRegister(tenantId: string, registerId: string) {
    return this.prisma.shift.findFirst({
      where: { tenantId, registerId, status: 'OPEN' },
    });
  }

  list(tenantId: string, branchIds: string[]) {
    return this.prisma.shift.findMany({
      where: { tenantId, branchId: { in: branchIds } },
      orderBy: { openedAt: 'desc' },
      take: 200,
    });
  }

  create(input: {
    tenantId: string;
    branchId: string;
    registerId: string;
    userId: string;
    openingCash: string;
  }) {
    return this.prisma.shift.create({
      data: {
        ...input,
        openingCash: new Prisma.Decimal(input.openingCash),
      },
    });
  }

  find(tenantId: string, shiftId: string) {
    return this.prisma.shift.findFirst({
      where: { id: shiftId, tenantId },
    });
  }

  async close(tenantId: string, shiftId: string, countedCash: string, note?: string) {
    return this.prisma.$transaction(async (tx) => {
      const cash = await tx.payment.aggregate({
        where: {
          tenantId,
          status: 'COMPLETED',
          method: 'CASH',
          order: { shiftId, status: 'COMPLETED' },
        },
        _sum: { amount: true },
      });

      const shift = await tx.shift.findFirstOrThrow({
        where: { id: shiftId, tenantId, status: 'OPEN' },
      });
      const expected = new Prisma.Decimal(shift.openingCash).plus(
        cash._sum.amount ?? 0,
      );
      const counted = new Prisma.Decimal(countedCash);
      const discrepancy = counted.minus(expected);

      return tx.shift.update({
        where: { id: shiftId },
        data: {
          status: 'CLOSED',
          expectedCash: expected,
          countedCash: counted,
          discrepancy,
          closedAt: new Date(),
          ...(note ? { closingNote: note } : {}),
        },
      });
    });
  }
}
