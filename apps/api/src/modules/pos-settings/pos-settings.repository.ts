import { Injectable } from '@nestjs/common';
import { PrismaService } from '@merkatopos/database';

@Injectable()
export class PosSettingsRepository {
  constructor(private readonly prisma: PrismaService) {}

  getOrCreate(tenantId: string) {
    return this.prisma.posSettings.upsert({
      where: { tenantId },
      create: { tenantId },
      update: {},
    });
  }

  update(
    tenantId: string,
    data: { requireActiveShift?: boolean; tablesEnabled?: boolean },
  ) {
    return this.prisma.posSettings.upsert({
      where: { tenantId },
      create: { tenantId, ...data },
      update: data,
    });
  }
}
