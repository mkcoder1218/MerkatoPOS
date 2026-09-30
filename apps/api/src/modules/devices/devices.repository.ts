import { Injectable } from '@nestjs/common';
import { PrismaService } from '@merkatopos/database';
import type { DevicePlatform, DeviceStatus } from '@prisma/client';

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
        tenantId_deviceUid: { tenantId: input.tenantId, deviceUid: input.deviceUid },
      },
      create: { ...input, lastSeenAt: new Date() },
      update: {
        branchId: input.branchId,
        name: input.name,
        platform: input.platform,
        ...(input.appVersion !== undefined ? { appVersion: input.appVersion } : {}),
        status: 'ACTIVE',
        lastSeenAt: new Date(),
      },
    });
  }

  listForTenant(tenantId: string) {
    return this.prisma.device.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  findForTenant(tenantId: string, deviceId: string) {
    return this.prisma.device.findFirst({ where: { id: deviceId, tenantId } });
  }

  update(
    tenantId: string,
    deviceId: string,
    data: { name?: string; branchId?: string; status?: DeviceStatus },
  ) {
    return this.prisma.device.updateMany({
      where: { id: deviceId, tenantId },
      data,
    });
  }

  heartbeat(tenantId: string, deviceId: string, appVersion?: string) {
    return this.prisma.device.updateMany({
      where: { id: deviceId, tenantId, status: 'ACTIVE' },
      data: {
        lastSeenAt: new Date(),
        ...(appVersion !== undefined ? { appVersion } : {}),
      },
    });
  }
}
