import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { CreateRoleDto } from './dto/create-role.dto';
import type { UpdateRoleDto } from './dto/update-role.dto';
import { RolesRepository } from './roles.repository';

@Injectable()
export class RolesService {
  constructor(private readonly repository: RolesRepository) {}

  list(tenantId: string) {
    return this.repository.listForTenant(tenantId);
  }

  async create(tenantId: string, dto: CreateRoleDto) {
    const permissionIds = await this.resolvePermissionIds(dto.permissionCodes);
    return this.repository.create(tenantId, dto.name.trim(), permissionIds);
  }

  async update(tenantId: string, roleId: string, dto: UpdateRoleDto) {
    const role = await this.repository.findForTenant(tenantId, roleId);
    if (!role) {
      throw new NotFoundException('Role not found');
    }

    const permissionIds =
      dto.permissionCodes !== undefined
        ? await this.resolvePermissionIds(dto.permissionCodes)
        : undefined;

    const updated = await this.repository.update(roleId, {
      ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
      ...(permissionIds !== undefined ? { permissionIds } : {}),
    });

    if (dto.permissionCodes !== undefined) {
      await this.repository.revokeSessionsForRole(roleId);
    }

    return updated;
  }

  async remove(tenantId: string, roleId: string): Promise<{ success: true }> {
    const role = await this.repository.findForTenant(tenantId, roleId);
    if (!role) {
      throw new NotFoundException('Role not found');
    }
    if (role.isSystem) {
      throw new ConflictException('System roles cannot be deleted');
    }
    if (role._count.users > 0) {
      throw new ConflictException('Role is assigned to one or more users');
    }

    await this.repository.delete(roleId);
    return { success: true };
  }

  private async resolvePermissionIds(permissionCodes: string[]): Promise<string[]> {
    const uniqueCodes = [...new Set(permissionCodes)];
    const permissions = await this.repository.findPermissions(uniqueCodes);

    if (permissions.length !== uniqueCodes.length) {
      throw new BadRequestException('One or more permission codes are invalid');
    }

    return permissions.map(({ id }) => id);
  }
}
