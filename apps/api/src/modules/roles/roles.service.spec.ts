import { ConflictException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import type { RolesRepository } from './roles.repository';
import { RolesService } from './roles.service';

describe('RolesService', () => {
  it('does not delete a system role', async () => {
    const repository = {
      findForTenant: async () => ({ id: 'role-1', isSystem: true, _count: { users: 0 } }),
    } as unknown as RolesRepository;

    const service = new RolesService(repository);

    await expect(service.remove('tenant-1', 'role-1')).rejects.toBeInstanceOf(
      ConflictException,
    );
  });
});
