import { ForbiddenException } from '@nestjs/common';
import { DevicePlatform } from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';
import type { JwtPayload } from '../auth/auth.types';
import type { BranchesRepository } from '../branches/branches.repository';
import type { DevicesRepository } from './devices.repository';
import { DevicesService } from './devices.service';

describe('DevicesService', () => {
  it('rejects registration into a branch outside the authenticated user scope', async () => {
    const devicesRepository = { register: vi.fn() } as unknown as DevicesRepository;
    const branchesRepository = { findForTenant: vi.fn() } as unknown as BranchesRepository;
    const service = new DevicesService(devicesRepository, branchesRepository);

    const user: JwtPayload = {
      sub: 'user-1',
      userId: 'user-1',
      tenantId: 'tenant-1',
      email: 'owner@example.com',
      branchIds: ['branch-1'],
      permissions: ['devices.register'],
    };

    await expect(
      service.register(user, {
        branchId: 'branch-2',
        deviceUid: 'device-unique-id',
        name: 'Front Counter',
        platform: DevicePlatform.DESKTOP,
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(branchesRepository.findForTenant).not.toHaveBeenCalled();
    expect(devicesRepository.register).not.toHaveBeenCalled();
  });
});
