import { Injectable } from '@nestjs/common';
import { PrismaService } from '@merkatopos/database';
import type { DevicePlatform } from '@prisma/client';

interface RegisterDeviceRecord {
  tenantId: string;
  branchId: string;
  registeredById: string;
  deviceUid: string;
  name: string;
  platform: DevicePlatform;
  appVersion?: string;
}

@Injectable()
export class DevicesRepository {
  constructor(private readonly prisma: PrismaService) {}

  register(input: RegisterDeviceRecord) {
    return this.prisma.device.upsert({
      where: {
        tenantId_deviceUid: {
          tenantId: input.tenantId,
          deviceUid: input.deviceUid,
        },
      },
      create: {
        ...input,
        lastSeenAt: new Date(),
      },
      update: {
        branchId: input.branchId,
        name: input.name,
        platform: input.platform,
        ...(input.appVersion !== undefined ? { appVersion: input.appVersion } : {}),
        status: 'ACTIVE',
        lastSeenAt: new Date(),
      },
      select: {
        id: true,
        branchId: true,
        deviceUid: true,
        name: true,
        platform: true,
        appVersion: true,
        status: true,
        lastSeenAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  listForTenant(tenantId: string) {
    return this.prisma.device.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        branchId: true,
        deviceUid: true,
        name: true,
        platform: true,
        appVersion: true,
        status: true,
        lastSeenAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }
}
