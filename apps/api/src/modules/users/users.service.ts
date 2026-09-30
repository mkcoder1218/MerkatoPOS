import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import bcrypt from 'bcrypt';
import type { CreateUserDto } from './dto/create-user.dto';
import type { ResetPasswordDto } from './dto/reset-password.dto';
import type { UpdateUserDto } from './dto/update-user.dto';
import { UsersRepository } from './users.repository';

@Injectable()
export class UsersService {
  constructor(private readonly repository: UsersRepository) {}

  list(tenantId: string) {
    return this.repository.listForTenant(tenantId);
  }

  async create(tenantId: string, dto: CreateUserDto) {
    await this.validateAssignments(tenantId, dto.branchIds, dto.roleIds);
    const passwordHash = await bcrypt.hash(dto.password, 12);

    return this.repository.create({
      tenantId,
      name: dto.name.trim(),
      email: dto.email.toLowerCase(),
      passwordHash,
      branchIds: [...new Set(dto.branchIds)],
      roleIds: [...new Set(dto.roleIds)],
    });
  }

  async update(tenantId: string, userId: string, dto: UpdateUserDto) {
    const existing = await this.repository.findForTenant(tenantId, userId);
    if (!existing) {
      throw new NotFoundException('User not found');
    }

    if (dto.branchIds || dto.roleIds) {
      await this.validateAssignments(
        tenantId,
        dto.branchIds ?? [],
        dto.roleIds ?? [],
        dto.branchIds !== undefined,
        dto.roleIds !== undefined,
      );
    }

    const result = await this.repository.update(tenantId, userId, {
      ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
      ...(dto.email !== undefined ? { email: dto.email.toLowerCase() } : {}),
      ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      ...(dto.branchIds !== undefined ? { branchIds: [...new Set(dto.branchIds)] } : {}),
      ...(dto.roleIds !== undefined ? { roleIds: [...new Set(dto.roleIds)] } : {}),
    });

    if (dto.isActive === false || dto.branchIds !== undefined || dto.roleIds !== undefined) {
      await this.repository.revokeSessions(userId);
    }

    return result;
  }

  async resetPassword(
    tenantId: string,
    userId: string,
    dto: ResetPasswordDto,
  ): Promise<{ success: true }> {
    const existing = await this.repository.findForTenant(tenantId, userId);
    if (!existing) {
      throw new NotFoundException('User not found');
    }

    await this.repository.updatePassword(userId, await bcrypt.hash(dto.password, 12));
    await this.repository.revokeSessions(userId);
    return { success: true };
  }

  private async validateAssignments(
    tenantId: string,
    branchIds: string[],
    roleIds: string[],
    validateBranches = true,
    validateRoles = true,
  ): Promise<void> {
    if (validateBranches) {
      const branches = await this.repository.findBranches(tenantId, [...new Set(branchIds)]);
      if (branches.length !== new Set(branchIds).size) {
        throw new BadRequestException('One or more branches do not belong to this tenant');
      }
    }

    if (validateRoles) {
      const roles = await this.repository.findRoles(tenantId, [...new Set(roleIds)]);
      if (roles.length !== new Set(roleIds).size) {
        throw new BadRequestException('One or more roles do not belong to this tenant');
      }
    }
  }
}
