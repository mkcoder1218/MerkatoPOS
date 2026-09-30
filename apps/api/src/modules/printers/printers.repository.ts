import { Injectable } from '@nestjs/common';
import { PrismaService } from '@merkatopos/database';
import { Prisma, type PrinterInterface, type PrinterType } from '@prisma/client';

@Injectable()
export class PrintersRepository {
  constructor(private readonly prisma: PrismaService) {}

  list(tenantId: string, branchIds: string[]) {
    return this.prisma.printer.findMany({
      where: { tenantId, branchId: { in: branchIds } },
      orderBy: [{ branchId: 'asc' }, { name: 'asc' }],
      include: { receiptRegisters: true, kitchenRoutes: true },
    });
  }

  find(tenantId: string, printerId: string) {
    return this.prisma.printer.findFirst({
      where: { id: printerId, tenantId },
    });
  }

  findBranch(tenantId: string, branchId: string) {
    return this.prisma.branch.findFirst({
      where: { id: branchId, tenantId, isActive: true },
    });
  }

  findRegister(tenantId: string, registerId: string) {
    return this.prisma.register.findFirst({
      where: { id: registerId, tenantId, isActive: true },
    });
  }

  findCategory(tenantId: string, categoryId: string) {
    return this.prisma.category.findFirst({
      where: { id: categoryId, tenantId, isActive: true },
    });
  }

  findProduct(tenantId: string, productId: string) {
    return this.prisma.product.findFirst({
      where: { id: productId, tenantId, isActive: true },
    });
  }

  async create(
    tenantId: string,
    input: {
      branchId: string;
      name: string;
      type: PrinterType;
      interface: PrinterInterface;
      connectionData?: Prisma.InputJsonObject;
      isDefault?: boolean;
    },
  ) {
    return this.prisma.$transaction(async (tx) => {
      if (input.isDefault) {
        await tx.printer.updateMany({
          where: {
            tenantId,
            branchId: input.branchId,
            type: input.type,
            isDefault: true,
          },
          data: { isDefault: false },
        });
      }

      return tx.printer.create({
        data: {
          tenantId,
          branchId: input.branchId,
          name: input.name,
          type: input.type,
          interface: input.interface,
          ...(input.connectionData ? { connectionData: input.connectionData } : {}),
          ...(input.isDefault !== undefined ? { isDefault: input.isDefault } : {}),
        },
      });
    });
  }

  async update(
    tenantId: string,
    printerId: string,
    data: {
      name?: string;
      interface?: PrinterInterface;
      connectionData?: Prisma.InputJsonObject;
      isDefault?: boolean;
      isActive?: boolean;
    },
  ) {
    return this.prisma.$transaction(async (tx) => {
      const printer = await tx.printer.findFirstOrThrow({
        where: { id: printerId, tenantId },
      });

      if (data.isDefault || (data.isActive === true && printer.isDefault)) {
        await tx.printer.updateMany({
          where: {
            tenantId,
            branchId: printer.branchId,
            type: printer.type,
            id: { not: printerId },
            isDefault: true,
          },
          data: { isDefault: false },
        });
      }

      return tx.printer.update({
        where: { id: printerId },
        data,
      });
    });
  }

  assignReceiptPrinter(registerId: string, printerId: string) {
    return this.prisma.registerReceiptPrinter.upsert({
      where: { registerId },
      create: { registerId, printerId },
      update: { printerId },
    });
  }

  listRoutes(tenantId: string, branchIds: string[]) {
    return this.prisma.kitchenPrintRoute.findMany({
      where: { tenantId, branchId: { in: branchIds } },
      orderBy: [{ branchId: 'asc' }, { priority: 'asc' }],
      include: {
        printer: { select: { id: true, name: true } },
        category: { select: { id: true, name: true } },
        product: { select: { id: true, name: true } },
      },
    });
  }

  createRoute(
    tenantId: string,
    input: {
      branchId: string;
      printerId: string;
      categoryId?: string;
      productId?: string;
    },
  ) {
    return this.prisma.kitchenPrintRoute.create({
      data: { tenantId, ...input },
    });
  }

  updateRoute(
    tenantId: string,
    routeId: string,
    data: { printerId?: string; isActive?: boolean },
  ) {
    return this.prisma.kitchenPrintRoute.updateMany({
      where: { id: routeId, tenantId },
      data,
    });
  }

  findRoute(tenantId: string, routeId: string) {
    return this.prisma.kitchenPrintRoute.findFirst({
      where: { id: routeId, tenantId },
    });
  }
}
