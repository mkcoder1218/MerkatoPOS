import { Injectable } from '@nestjs/common';
import { PrismaService } from '@merkatopos/database';

@Injectable()
export class RolesRepository {
  constructor(private readonly prisma: PrismaService) {}

  listForTenant(tenantId: string) {
    return this.prisma.role.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        isSystem: true,
        permissions: { select: { permission: { select: { code: true } } } },
        _count: { select: { users: true } },
      },
    });
  }

  findForTenant(tenantId: string, roleId: string) {
    return this.prisma.role.findFirst({
      where: { id: roleId, tenantId },
      include: { _count: { select: { users: true } } },
    });
  }

  findPermissions(permissionCodes: string[]) {
    return this.prisma.permission.findMany({
      where: { code: { in: permissionCodes } },
      select: { id: true, code: true },
    });
  }

  create(tenantId: string, name: string, permissionIds: string[]) {
    return this.prisma.role.create({
      data: {
        tenantId,
        name,
        permissions: {
          create: permissionIds.map((permissionId) => ({ permissionId })),
        },
      },
      include: {
        permissions: { include: { permission: true } },
      },
    });
  }

  update(
    roleId: string,
    input: { name?: string; permissionIds?: string[] },
  ) {
    return this.prisma.$transaction(async (tx) => {
      if (input.name !== undefined) {
        await tx.role.update({ where: { id: roleId }, data: { name: input.name } });
      }

      if (input.permissionIds !== undefined) {
        await tx.rolePermission.deleteMany({ where: { roleId } });
        await tx.rolePermission.createMany({
          data: input.permissionIds.map((permissionId) => ({ roleId, permissionId })),
          skipDuplicates: true,
        });
      }

      return tx.role.findUnique({
        where: { id: roleId },
        include: { permissions: { include: { permission: true } } },
      });
    });
  }

  delete(roleId: string) {
    return this.prisma.role.delete({ where: { id: roleId } });
  }

  revokeSessionsForRole(roleId: string) {
    return this.prisma.session.updateMany({
      where: {
        revokedAt: null,
        user: { roles: { some: { roleId } } },
      },
      data: { revokedAt: new Date() },
    });
  }
}
