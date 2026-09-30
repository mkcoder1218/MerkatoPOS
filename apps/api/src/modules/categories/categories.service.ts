import { Injectable, NotFoundException } from '@nestjs/common';
import type { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';
import { CategoriesRepository } from './categories.repository';

@Injectable()
export class CategoriesService {
  constructor(private readonly repository: CategoriesRepository) {}

  list(tenantId: string) {
    return this.repository.list(tenantId);
  }

  create(tenantId: string, dto: CreateCategoryDto) {
    return this.repository.create(tenantId, {
      name: dto.name.trim(),
      ...(dto.displayOrder !== undefined ? { displayOrder: dto.displayOrder } : {}),
      ...(dto.posVisible !== undefined ? { posVisible: dto.posVisible } : {}),
    });
  }

  async update(tenantId: string, categoryId: string, dto: UpdateCategoryDto) {
    const existing = await this.repository.find(tenantId, categoryId);
    if (!existing) {
      throw new NotFoundException('Category not found');
    }

    await this.repository.update(tenantId, categoryId, {
      ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
      ...(dto.displayOrder !== undefined ? { displayOrder: dto.displayOrder } : {}),
      ...(dto.posVisible !== undefined ? { posVisible: dto.posVisible } : {}),
      ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
    });

    return this.repository.find(tenantId, categoryId);
  }
}
