import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { JwtPayload } from '../auth/auth.types';
import type { CloseShiftDto, OpenShiftDto } from './dto/shift.dto';
import { ShiftsRepository } from './shifts.repository';

@Injectable()
export class ShiftsService {
  constructor(private readonly repository: ShiftsRepository) {}

  list(user: JwtPayload) {
    return this.repository.list(user.tenantId, user.branchIds);
  }

  async open(user: JwtPayload, dto: OpenShiftDto) {
    if (!user.branchIds.includes(dto.branchId)) {
      throw new ForbiddenException('You do not have access to this branch');
    }

    const register = await this.repository.findRegister(user.tenantId, dto.registerId);
    if (!register || register.branchId !== dto.branchId) {
      throw new NotFoundException('Active register not found for this branch');
    }

    if (await this.repository.findOpenByRegister(user.tenantId, dto.registerId)) {
      throw new ConflictException('This register already has an open shift');
    }

    return this.repository.create({
      tenantId: user.tenantId,
      branchId: dto.branchId,
      registerId: dto.registerId,
      userId: user.userId,
      openingCash: dto.openingCash,
    });
  }

  async close(user: JwtPayload, shiftId: string, dto: CloseShiftDto) {
    const shift = await this.repository.find(user.tenantId, shiftId);
    if (!shift) {
      throw new NotFoundException('Shift not found');
    }
    if (!user.branchIds.includes(shift.branchId)) {
      throw new ForbiddenException('You do not have access to this shift branch');
    }
    if (shift.status !== 'OPEN') {
      throw new ConflictException('Shift is already closed');
    }

    return this.repository.close(
      user.tenantId,
      shiftId,
      dto.countedCash,
      dto.note?.trim(),
    );
  }
}
