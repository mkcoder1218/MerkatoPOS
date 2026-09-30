import { Injectable } from '@nestjs/common';
import { PrismaService } from '@merkatopos/database';

@Injectable()
export class RegistersRepository {
  constructor(private readonly prisma: PrismaService) {}

  listForTenant(tenantId: string) {
    return this.prisma.register.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
      include: {
        branch: { select: { id: true, name: true } },
        device: { select: { id: true, name: true, status: true } },
      },
    });
  }

  findForTenant(tenantId: string, registerId: string) {
    return this.prisma.register.findFirst({ where: { id: registerId, tenantId } });
  }

  findDevice(tenantId: string, deviceId: string) {
    return this.prisma.device.findFirst({ where: { id: deviceId, tenantId } });
  }

  create(
    tenantId: string,
    input: { branchId: string; name: string; code: string; deviceId?: string },
  ) {
    return this.prisma.register.create({
      data: { tenantId, ...input },
    });
  }

  update(
    tenantId: string,
    registerId: string,
    data: {
      branchId?: string;
      name?: string;
      code?: string;
      deviceId?: string | null;
      isActive?: boolean;
    },
  ) {
    return this.prisma.register.updateMany({
      where: { id: registerId, tenantId },
      data,
    });
  }
}
