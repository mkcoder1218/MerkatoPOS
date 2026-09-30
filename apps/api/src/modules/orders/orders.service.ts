import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import Decimal from 'decimal.js';
import type { JwtPayload } from '../auth/auth.types';
import { PrintPayloadService } from '../print-jobs/print-payload.service';
import type {
  CompleteSaleDto,
  CreateOrderDto,
  DecideVoidDto,
  RequestVoidDto,
  UpdateOrderDto,
} from './dto/order.dto';
import { OrdersRepository } from './orders.repository';
import { PricingService } from './pricing.service';
import { SalesRepository } from './sales.repository';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private readonly repository: OrdersRepository,
    private readonly pricing: PricingService,
    private readonly sales: SalesRepository,
    private readonly printPayload: PrintPayloadService,
  ) {}

  list(user: JwtPayload) {
    return this.repository.list(user.tenantId, user.branchIds);
  }

  get(user: JwtPayload, orderId: string) {
    return this.getAccessibleOrder(user, orderId);
  }

  async create(user: JwtPayload, dto: CreateOrderDto) {
    this.assertBranch(user, dto.branchId);

    const [settings, register] = await Promise.all([
      this.repository.getSettings(user.tenantId),
      this.repository.findRegister(user.tenantId, dto.registerId),
    ]);

    if (!register || register.branchId !== dto.branchId) {
      throw new NotFoundException('Active register not found for branch');
    }

    const shift = await this.repository.findOpenShift(user.tenantId, dto.registerId);
    if (settings.requireActiveShift && !shift) {
      throw new ConflictException('An active shift is required');
    }

    await this.validateTable(
      user.tenantId,
      dto.branchId,
      dto.type,
      dto.tableId,
      settings.tablesEnabled,
    );

    const items = await this.priceItems(user.tenantId, dto.branchId, dto.items);
    const totals = this.pricing.totals(items);

    return this.repository.create({
      tenantId: user.tenantId,
      branchId: dto.branchId,
      registerId: dto.registerId,
      ...(shift ? { shiftId: shift.id } : {}),
      userId: user.userId,
      ...(dto.tableId ? { tableId: dto.tableId } : {}),
      orderNumber: 'ORD-' + Date.now() + '-' + randomUUID().slice(0, 8).toUpperCase(),
      type: dto.type,
      items,
      totals,
    });
  }

  async update(user: JwtPayload, orderId: string, dto: UpdateOrderDto) {
    const order = await this.getAccessibleOrder(user, orderId);
    if (!['DRAFT', 'OPEN'].includes(order.status)) {
      throw new ConflictException('Completed orders cannot be edited');
    }

    const settings = await this.repository.getSettings(user.tenantId);
    const type = dto.type ?? order.type;
    const tableId =
      dto.tableId !== undefined ? dto.tableId || undefined : order.tableId ?? undefined;

    await this.validateTable(
      user.tenantId,
      order.branchId,
      type,
      tableId,
      settings.tablesEnabled,
    );

    let pricedItems;
    let totals;
    if (dto.items) {
      pricedItems = await this.priceItems(user.tenantId, order.branchId, dto.items);
      totals = this.pricing.totals(pricedItems);
    }

    const updated = await this.repository.replaceItems(
      user.tenantId,
      orderId,
      dto.type,
      dto.tableId !== undefined ? dto.tableId || null : undefined,
      pricedItems,
      totals,
    );
    if (!updated) {
      throw new ConflictException('Order is no longer editable');
    }
    return updated;
  }

  async complete(user: JwtPayload, orderId: string, dto: CompleteSaleDto) {
    const idempotencyKey = dto.idempotencyKey.trim();
    const existing = await this.sales.findCompletion(user.tenantId, idempotencyKey);
    if (existing) {
      await this.queuePrintsSafely(user.tenantId, existing.order.id);
      return existing.order;
    }

    const order = await this.getAccessibleOrder(user, orderId);
    if (order.status !== 'OPEN') {
      throw new ConflictException('Only open orders can be completed');
    }

    const settings = await this.repository.getSettings(user.tenantId);
    if (settings.requireActiveShift) {
      const activeShift = await this.repository.findOpenShift(
        user.tenantId,
        order.registerId,
      );
      if (!activeShift || activeShift.id !== order.shiftId) {
        throw new ConflictException('The order shift is no longer active');
      }
    }

    const paymentTotal = dto.payments.reduce(
      (sum, payment) => sum.plus(payment.amount),
      new Decimal(0),
    );
    if (!paymentTotal.eq(new Decimal(order.grandTotal.toString()))) {
      throw new BadRequestException('Payment total must equal order grand total');
    }

    for (const payment of dto.payments) {
      if (!new Decimal(payment.amount).isPositive()) {
        throw new BadRequestException('Payment amounts must be greater than zero');
      }
      if (payment.method !== 'CASH' && !payment.reference?.trim()) {
        throw new BadRequestException('Non-cash payments require a reference');
      }
    }

    try {
      const completed = await this.sales.complete({
        tenantId: user.tenantId,
        branchId: order.branchId,
        orderId: order.id,
        userId: user.userId,
        idempotencyKey,
        receiptNumber:
          'RCP-' + Date.now() + '-' + randomUUID().slice(0, 8).toUpperCase(),
        payments: dto.payments.map((payment) => ({
          method: payment.method,
          amount: payment.amount,
          ...(payment.reference ? { reference: payment.reference.trim() } : {}),
        })),
      });

      if (completed?.id) {
        await this.queuePrintsSafely(user.tenantId, completed.id);
      }
      return completed;
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        const raced = await this.sales.findCompletion(user.tenantId, idempotencyKey);
        if (raced) {
          await this.queuePrintsSafely(user.tenantId, raced.order.id);
          return raced.order;
        }
      }

      const message = error instanceof Error ? error.message : '';
      if (message.includes('Insufficient inventory')) {
        throw new ConflictException('Insufficient inventory');
      }
      if (message.includes('Inventory item missing')) {
        throw new ConflictException('Tracked product has no inventory item for this branch');
      }
      throw error;
    }
  }

  async requestVoid(user: JwtPayload, orderId: string, dto: RequestVoidDto) {
    const order = await this.getAccessibleOrder(user, orderId);
    if (order.status !== 'COMPLETED') {
      throw new ConflictException('Only completed sales can be voided');
    }

    return this.sales.createVoidRequest(
      user.tenantId,
      orderId,
      user.userId,
      dto.reason.trim(),
    );
  }

  async approveVoid(user: JwtPayload, orderId: string, dto: DecideVoidDto) {
    const order = await this.getAccessibleOrder(user, orderId);
    if (order.voidRequest?.requestedById === user.userId) {
      throw new ForbiddenException(
        'Void approval must be performed by another authorized user',
      );
    }
    return this.sales.approveVoid(
      user.tenantId,
      orderId,
      user.userId,
      dto.note.trim(),
    );
  }

  async rejectVoid(user: JwtPayload, orderId: string, dto: DecideVoidDto) {
    await this.getAccessibleOrder(user, orderId);
    return this.sales.rejectVoid(
      user.tenantId,
      orderId,
      user.userId,
      dto.note.trim(),
    );
  }

  private async queuePrintsSafely(tenantId: string, orderId: string): Promise<void> {
    try {
      await this.printPayload.queueCompletedSale(tenantId, orderId);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown queue error';
      this.logger.error(
        'Sale ' + orderId + ' completed but print jobs could not be queued: ' + message,
      );
    }
  }

  private async priceItems(
    tenantId: string,
    branchId: string,
    inputs: CreateOrderDto['items'],
  ) {
    const productIds = [...new Set(inputs.map((item) => item.productId))];
    const products = await this.repository.getPricingProducts(
      tenantId,
      branchId,
      productIds,
    );
    if (products.length !== productIds.length) {
      throw new BadRequestException('One or more products are invalid');
    }
    return this.pricing.priceLines(inputs, products);
  }

  private async validateTable(
    tenantId: string,
    branchId: string,
    type: CreateOrderDto['type'],
    tableId: string | undefined,
    tablesEnabled: boolean,
  ): Promise<void> {
    if (type !== 'DINE_IN') {
      if (tableId) {
        throw new BadRequestException('Tables can only be assigned to dine-in orders');
      }
      return;
    }
    if (!tablesEnabled) {
      throw new BadRequestException('Table workflow is disabled');
    }
    if (!tableId) {
      throw new BadRequestException('Dine-in orders require a table');
    }
    const table = await this.repository.findTable(tenantId, tableId);
    if (!table || table.branchId !== branchId) {
      throw new BadRequestException('Active table not found for branch');
    }
  }

  private async getAccessibleOrder(user: JwtPayload, orderId: string) {
    const order = await this.repository.find(user.tenantId, orderId);
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    this.assertBranch(user, order.branchId);
    return order;
  }

  private assertBranch(user: JwtPayload, branchId: string): void {
    if (!user.branchIds.includes(branchId)) {
      throw new ForbiddenException('You do not have access to this branch');
    }
  }
}
