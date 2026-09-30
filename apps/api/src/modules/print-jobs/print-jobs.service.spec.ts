import { describe, expect, it, vi } from 'vitest';
import type { JwtPayload } from '../auth/auth.types';
import { PrintJobsService } from './print-jobs.service';
import type { PrintJobsRepository } from './print-jobs.repository';

const user: JwtPayload = {
  sub: 'u1',
  userId: 'u1',
  tenantId: 't1',
  email: 'owner@example.com',
  sessionId: 's1',
  branchIds: ['b1'],
  permissions: ['print_jobs.reprint'],
};

describe('PrintJobsService', () => {
  it('creates a separate auditable reprint job from the original payload', async () => {
    const repository = {
      find: vi.fn().mockResolvedValue({
        id: 'job-1',
        tenantId: 't1',
        branchId: 'b1',
        printerId: 'printer-1',
        orderId: 'order-1',
        kind: 'RECEIPT',
        payload: { documentType: 'RECEIPT', receiptNumber: 'R1' },
      }),
      findPrinter: vi.fn().mockResolvedValue({
        id: 'printer-1',
        tenantId: 't1',
        branchId: 'b1',
        type: 'RECEIPT',
        isActive: true,
      }),
      createReprint: vi.fn().mockResolvedValue({
        id: 'job-2',
        reprintOfId: 'job-1',
      }),
    } as unknown as PrintJobsRepository;

    const service = new PrintJobsService(repository);
    const result = await service.reprint(user, 'job-1', {});

    expect(result).toEqual({ id: 'job-2', reprintOfId: 'job-1' });
    expect(repository.createReprint).toHaveBeenCalledWith(
      expect.objectContaining({
        orderId: 'order-1',
        requestedById: 'u1',
        reprintOfId: 'job-1',
      }),
    );
  });
});
