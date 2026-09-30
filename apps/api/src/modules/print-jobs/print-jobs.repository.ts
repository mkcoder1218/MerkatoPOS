import { Injectable } from '@nestjs/common';
import { PrismaService } from '@merkatopos/database';
import { Prisma, type PrintJobKind } from '@prisma/client';

@Injectable()
export class PrintJobsRepository {
  constructor(private readonly prisma: PrismaService) {}

  getOrderSnapshot(tenantId: string, orderId: string) {
    return this.prisma.order.findFirst({
      where: {
        id: orderId,
        tenantId,
        status: { in: ['COMPLETED', 'VOID_PENDING', 'VOIDED'] },
      },
      include: {
        tenant: { select: { name: true } },
        branch: { select: { id: true, name: true } },
        register: {
          include: {
            receiptPrinter: { include: { printer: true } },
          },
        },
        user: { select: { name: true } },
        table: { select: { name: true, code: true } },
        completion: true,
        payments: true,
        items: {
          include: {
            modifiers: true,
            product: { select: { id: true, categoryId: true } },
          },
        },
      },
    });
  }

  getKitchenRoutes(tenantId: string, branchId: string) {
    return this.prisma.kitchenPrintRoute.findMany({
      where: {
        tenantId,
        branchId,
        isActive: true,
        printer: { isActive: true, type: 'KITCHEN' },
      },
      include: { printer: true },
      orderBy: { priority: 'asc' },
    });
  }

  findDefaultPrinter(
    tenantId: string,
    branchId: string,
    kind: 'RECEIPT' | 'KITCHEN',
  ) {
    return this.prisma.printer.findFirst({
      where: {
        tenantId,
        branchId,
        type: kind,
        isActive: true,
        isDefault: true,
      },
    });
  }

  upsertInitialJob(input: {
    tenantId: string;
    branchId: string;
    printerId: string;
    orderId: string;
    kind: PrintJobKind;
    payload: Prisma.InputJsonValue;
    sourceKey: string;
  }) {
    return this.prisma.printJob.upsert({
      where: { sourceKey: input.sourceKey },
      create: input,
      update: {},
    });
  }

  list(tenantId: string, branchIds: string[]) {
    return this.prisma.printJob.findMany({
      where: { tenantId, branchId: { in: branchIds } },
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: {
        printer: { select: { id: true, name: true, type: true } },
        order: { select: { id: true, orderNumber: true } },
      },
    });
  }

  find(tenantId: string, jobId: string) {
    return this.prisma.printJob.findFirst({
      where: { id: jobId, tenantId },
      include: { printer: true },
    });
  }

  findPrinter(tenantId: string, printerId: string) {
    return this.prisma.printer.findFirst({
      where: { id: printerId, tenantId, isActive: true },
    });
  }

  async recoverStale(tenantId: string, printerId: string): Promise<void> {
    const cutoff = new Date(Date.now() - 2 * 60 * 1000);
    const stale = await this.prisma.printJob.findMany({
      where: {
        tenantId,
        printerId,
        status: 'PRINTING',
        claimedAt: { lt: cutoff },
      },
      select: { id: true, attemptCount: true, maxAttempts: true },
    });

    await Promise.all(
      stale.map((job) =>
        this.prisma.printJob.update({
          where: { id: job.id },
          data: {
            status: job.attemptCount < job.maxAttempts ? 'RETRYING' : 'FAILED',
            failedAt: new Date(),
            lastError: 'Print agent claim expired before acknowledgement',
          },
        }),
      ),
    );
  }

  async claimNext(tenantId: string, printerId: string) {
    return this.prisma.$transaction(
      async (tx) => {
        const job = await tx.printJob.findFirst({
          where: {
            tenantId,
            printerId,
            status: { in: ['QUEUED', 'RETRYING'] },
          },
          orderBy: { createdAt: 'asc' },
        });
        if (!job) {
          return null;
        }

        const claimed = await tx.printJob.updateMany({
          where: {
            id: job.id,
            status: { in: ['QUEUED', 'RETRYING'] },
          },
          data: {
            status: 'PRINTING',
            claimedAt: new Date(),
            attemptCount: { increment: 1 },
            lastError: null,
          },
        });
        if (claimed.count !== 1) {
          return null;
        }

        return tx.printJob.findUnique({
          where: { id: job.id },
          include: { printer: true },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  markPrinted(tenantId: string, jobId: string) {
    return this.prisma.printJob.updateMany({
      where: { id: jobId, tenantId, status: 'PRINTING' },
      data: {
        status: 'PRINTED',
        printedAt: new Date(),
        failedAt: null,
        lastError: null,
      },
    });
  }

  async markFailed(tenantId: string, jobId: string, error: string) {
    const job = await this.prisma.printJob.findFirst({
      where: { id: jobId, tenantId, status: 'PRINTING' },
    });
    if (!job) {
      return null;
    }

    const retry = job.attemptCount < job.maxAttempts;
    return this.prisma.printJob.update({
      where: { id: job.id },
      data: {
        status: retry ? 'RETRYING' : 'FAILED',
        failedAt: new Date(),
        lastError: error,
      },
    });
  }

  retry(tenantId: string, jobId: string) {
    return this.prisma.printJob.updateMany({
      where: { id: jobId, tenantId, status: 'FAILED' },
      data: {
        status: 'RETRYING',
        attemptCount: 0,
        failedAt: null,
        lastError: null,
      },
    });
  }

  createReprint(input: {
    tenantId: string;
    branchId: string;
    printerId: string;
    orderId?: string;
    kind: PrintJobKind;
    payload: Prisma.InputJsonValue;
    requestedById: string;
    reprintOfId: string;
  }) {
    return this.prisma.printJob.create({ data: input });
  }
}
