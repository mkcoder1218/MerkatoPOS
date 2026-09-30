import { Injectable } from '@nestjs/common';
import { PrismaService } from '@merkatopos/database';

@Injectable()
export class PaymentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  list(tenantId: string, branchIds: string[]) {
    return this.prisma.payment.findMany({
      where: {
        tenantId,
        order: { branchId: { in: branchIds } },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            branchId: true,
            status: true,
          },
        },
      },
    });
  }
}
