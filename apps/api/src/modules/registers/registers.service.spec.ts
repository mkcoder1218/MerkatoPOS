import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import type { JwtPayload } from '../auth/auth.types';
import type { BranchesRepository } from '../branches/branches.repository';
import type { RegistersRepository } from './registers.repository';
import { RegistersService } from './registers.service';

const user: JwtPayload = {
  sub: 'user-1',
  userId: 'user-1',
  tenantId: 'tenant-1',
  email: 'owner@example.com',
  sessionId: 'session-1',
  branchIds: ['branch-1'],
  permissions: ['registers.manage'],
};

describe('RegistersService', () => {
  it('rejects a register in a branch outside the user scope', async () => {
    const repository = {} as RegistersRepository;
    const branches = { findForTenant: vi.fn() } as unknown as BranchesRepository;
    const service = new RegistersService(repository, branches);

    await expect(
      service.create(user, { branchId: 'branch-2', name: 'POS 2', code: 'POS-2' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects a device from a different branch', async () => {
    const repository = {
      findDevice: vi.fn().mockResolvedValue({
        id: 'device-1',
        tenantId: 'tenant-1',
        branchId: 'branch-2',
        status: 'ACTIVE',
      }),
    } as unknown as RegistersRepository;

    const branches = {
      findForTenant: vi.fn().mockResolvedValue({ id: 'branch-1', isActive: true }),
    } as unknown as BranchesRepository;

    const service = new RegistersService(repository, branches);

    await expect(
      service.create(user, {
        branchId: 'branch-1',
        name: 'Front POS',
        code: 'POS-1',
        deviceId: 'device-1',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
