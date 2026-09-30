import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type {
  CreateProductDiscountDto,
  UpdateProductDiscountDto,
} from './dto/discount.dto';
import { DiscountsRepository } from './discounts.repository';

@Injectable()
export class DiscountsService {
  constructor(private readonly repository: DiscountsRepository) {}

  list(tenantId: string) {
    return this.repository.list(tenantId);
  }

  async create(tenantId: string, dto: CreateProductDiscountDto) {
    if (!(await this.repository.findProduct(tenantId, dto.productId))) {
      throw new NotFoundException('Active product not found');
    }

    this.validatePercentage(dto.percentage);
    const dates = this.validateDates(dto.startsAt, dto.endsAt);

    return this.repository.create(tenantId, {
      productId: dto.productId,
      name: dto.name.trim(),
      percentage: dto.percentage,
      ...dates,
    });
  }

  async update(
    tenantId: string,
    discountId: string,
    dto: UpdateProductDiscountDto,
  ) {
    const existing = await this.repository.find(tenantId, discountId);
    if (!existing) {
      throw new NotFoundException('Discount not found');
    }

    if (dto.percentage !== undefined) {
      this.validatePercentage(dto.percentage);
    }

    const dates = this.validateDates(
      dto.startsAt ?? existing.startsAt?.toISOString(),
      dto.endsAt ?? existing.endsAt?.toISOString(),
    );

    await this.repository.update(tenantId, discountId, {
      ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
      ...(dto.percentage !== undefined ? { percentage: dto.percentage } : {}),
      ...(dto.startsAt !== undefined && dates.startsAt ? { startsAt: dates.startsAt } : {}),
      ...(dto.endsAt !== undefined && dates.endsAt ? { endsAt: dates.endsAt } : {}),
      ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
    });

    return this.repository.find(tenantId, discountId);
  }

  private validatePercentage(value: string): void {
    const percentage = Number(value);
    if (percentage <= 0 || percentage > 100) {
      throw new BadRequestException('Discount percentage must be greater than 0 and at most 100');
    }
  }

  private validateDates(
    startsAt?: string,
    endsAt?: string,
  ): { startsAt?: Date; endsAt?: Date } {
    const start = startsAt ? new Date(startsAt) : undefined;
    const end = endsAt ? new Date(endsAt) : undefined;

    if (start && end && start >= end) {
      throw new BadRequestException('Discount end time must be after start time');
    }

    return {
      ...(start ? { startsAt: start } : {}),
      ...(end ? { endsAt: end } : {}),
    };
  }
}
