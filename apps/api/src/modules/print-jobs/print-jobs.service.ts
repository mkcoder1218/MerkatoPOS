import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import type { JwtPayload } from '../auth/auth.types';
import type {
  ClaimPrintJobDto,
  FailPrintJobDto,
  ReprintJobDto,
} from './dto/print-job.dto';
import { PrintJobsRepository } from './print-jobs.repository';

@Injectable()
export class PrintJobsService {
  constructor(private readonly repository: PrintJobsRepository) {}

  list(user: JwtPayload) {
    return this.repository.list(user.tenantId, user.branchIds);
  }

  async claim(user: JwtPayload, dto: ClaimPrintJobDto) {
    const printer = await this.repository.findPrinter(user.tenantId, dto.printerId);
    if (!printer) {
      throw new NotFoundException('Active printer not found');
    }
    this.assertBranch(user, printer.branchId);
    await this.repository.recoverStale(user.tenantId, printer.id);
    return this.repository.claimNext(user.tenantId, printer.id);
  }

  async markPrinted(user: JwtPayload, jobId: string): Promise<{ success: true }> {
    const job = await this.getAccessibleJob(user, jobId);
    const result = await this.repository.markPrinted(user.tenantId, job.id);
    if (result.count !== 1) {
      throw new ConflictException('Print job is not currently printing');
    }
    return { success: true };
  }

  async markFailed(user: JwtPayload, jobId: string, dto: FailPrintJobDto) {
    await this.getAccessibleJob(user, jobId);
    const job = await this.repository.markFailed(
      user.tenantId,
      jobId,
      dto.error.trim(),
    );
    if (!job) {
      throw new ConflictException('Print job is not currently printing');
    }
    return job;
  }

  async retry(user: JwtPayload, jobId: string): Promise<{ success: true }> {
    const job = await this.getAccessibleJob(user, jobId);
    const result = await this.repository.retry(user.tenantId, job.id);
    if (result.count !== 1) {
      throw new ConflictException('Only failed jobs can be retried manually');
    }
    return { success: true };
  }

  async reprint(user: JwtPayload, jobId: string, dto: ReprintJobDto) {
    const source = await this.getAccessibleJob(user, jobId);
    const printerId = dto.printerId ?? source.printerId;
    const printer = await this.repository.findPrinter(user.tenantId, printerId);
    if (!printer) {
      throw new NotFoundException('Active printer not found');
    }
    this.assertBranch(user, printer.branchId);

    if (printer.branchId !== source.branchId) {
      throw new ForbiddenException('Reprint printer must belong to the same branch');
    }

    const expectedType =
      source.kind === 'RECEIPT'
        ? 'RECEIPT'
        : source.kind === 'KITCHEN'
          ? 'KITCHEN'
          : 'LABEL';
    if (printer.type !== expectedType) {
      throw new ForbiddenException('Reprint printer type must match the original job');
    }

    return this.repository.createReprint({
      tenantId: user.tenantId,
      branchId: source.branchId,
      printerId: printer.id,
      ...(source.orderId ? { orderId: source.orderId } : {}),
      kind: source.kind,
      payload: source.payload as Prisma.InputJsonValue,
      requestedById: user.userId,
      reprintOfId: source.id,
    });
  }

  private async getAccessibleJob(user: JwtPayload, jobId: string) {
    const job = await this.repository.find(user.tenantId, jobId);
    if (!job) {
      throw new NotFoundException('Print job not found');
    }
    this.assertBranch(user, job.branchId);
    return job;
  }

  private assertBranch(user: JwtPayload, branchId: string): void {
    if (!user.branchIds.includes(branchId)) {
      throw new ForbiddenException('You do not have access to this branch');
    }
  }
}
