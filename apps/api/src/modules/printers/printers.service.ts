import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { JwtPayload } from '../auth/auth.types';
import type {
  AssignReceiptPrinterDto,
  CreateKitchenRouteDto,
  CreatePrinterDto,
  UpdateKitchenRouteDto,
  UpdatePrinterDto,
} from './dto/printer.dto';
import { PrintersRepository } from './printers.repository';

@Injectable()
export class PrintersService {
  constructor(private readonly repository: PrintersRepository) {}

  list(user: JwtPayload) {
    return this.repository.list(user.tenantId, user.branchIds);
  }

  async create(user: JwtPayload, dto: CreatePrinterDto) {
    this.assertBranch(user, dto.branchId);
    if (!(await this.repository.findBranch(user.tenantId, dto.branchId))) {
      throw new NotFoundException('Active branch not found');
    }

    return this.repository.create(user.tenantId, {
      branchId: dto.branchId,
      name: dto.name.trim(),
      type: dto.type,
      interface: dto.interface,
      ...(dto.connectionData ? { connectionData: dto.connectionData } : {}),
      ...(dto.isDefault !== undefined ? { isDefault: dto.isDefault } : {}),
    });
  }

  async update(user: JwtPayload, printerId: string, dto: UpdatePrinterDto) {
    const printer = await this.repository.find(user.tenantId, printerId);
    if (!printer) {
      throw new NotFoundException('Printer not found');
    }
    this.assertBranch(user, printer.branchId);

    return this.repository.update(user.tenantId, printerId, {
      ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
      ...(dto.interface !== undefined ? { interface: dto.interface } : {}),
      ...(dto.connectionData !== undefined ? { connectionData: dto.connectionData } : {}),
      ...(dto.isDefault !== undefined ? { isDefault: dto.isDefault } : {}),
      ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
    });
  }

  async assignReceiptPrinter(user: JwtPayload, dto: AssignReceiptPrinterDto) {
    const [register, printer] = await Promise.all([
      this.repository.findRegister(user.tenantId, dto.registerId),
      this.repository.find(user.tenantId, dto.printerId),
    ]);

    if (!register || !printer) {
      throw new NotFoundException('Register or printer not found');
    }
    this.assertBranch(user, register.branchId);

    if (
      !printer.isActive ||
      printer.branchId !== register.branchId ||
      printer.type !== 'RECEIPT'
    ) {
      throw new BadRequestException(
        'Active receipt printer must belong to the register branch',
      );
    }

    return this.repository.assignReceiptPrinter(register.id, printer.id);
  }

  listRoutes(user: JwtPayload) {
    return this.repository.listRoutes(user.tenantId, user.branchIds);
  }

  async createRoute(user: JwtPayload, dto: CreateKitchenRouteDto) {
    this.assertBranch(user, dto.branchId);
    if ((dto.categoryId ? 1 : 0) + (dto.productId ? 1 : 0) !== 1) {
      throw new BadRequestException('Route must target exactly one category or product');
    }

    const printer = await this.repository.find(user.tenantId, dto.printerId);
    if (
      !printer ||
      !printer.isActive ||
      printer.branchId !== dto.branchId ||
      printer.type !== 'KITCHEN'
    ) {
      throw new BadRequestException('Active kitchen printer not found for branch');
    }

    if (
      dto.categoryId &&
      !(await this.repository.findCategory(user.tenantId, dto.categoryId))
    ) {
      throw new BadRequestException('Category does not belong to tenant');
    }
    if (
      dto.productId &&
      !(await this.repository.findProduct(user.tenantId, dto.productId))
    ) {
      throw new BadRequestException('Product does not belong to tenant');
    }

    return this.repository.createRoute(user.tenantId, {
      branchId: dto.branchId,
      printerId: dto.printerId,
      ...(dto.categoryId ? { categoryId: dto.categoryId } : {}),
      ...(dto.productId ? { productId: dto.productId } : {}),
    });
  }

  async updateRoute(user: JwtPayload, routeId: string, dto: UpdateKitchenRouteDto) {
    const route = await this.repository.findRoute(user.tenantId, routeId);
    if (!route) {
      throw new NotFoundException('Kitchen print route not found');
    }
    this.assertBranch(user, route.branchId);

    if (dto.printerId) {
      const printer = await this.repository.find(user.tenantId, dto.printerId);
      if (
        !printer ||
        !printer.isActive ||
        printer.branchId !== route.branchId ||
        printer.type !== 'KITCHEN'
      ) {
        throw new BadRequestException('Active kitchen printer not found for route branch');
      }
    }

    await this.repository.updateRoute(user.tenantId, routeId, {
      ...(dto.printerId !== undefined ? { printerId: dto.printerId } : {}),
      ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
    });
    return this.repository.findRoute(user.tenantId, routeId);
  }

  private assertBranch(user: JwtPayload, branchId: string): void {
    if (!user.branchIds.includes(branchId)) {
      throw new ForbiddenException('You do not have access to this branch');
    }
  }
}
