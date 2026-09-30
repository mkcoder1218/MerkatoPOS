import { Injectable } from '@nestjs/common';
import { PrismaService } from '@merkatopos/database';

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  listForTenant(tenantId: string) {
    return this.prisma.user.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        isActive: true,
        createdAt: true,
        branches: { select: { branchId: true } },
        roles: { select: { role: { select: { id: true, name: true } } } },
      },
    });
  }

  findForTenant(tenantId: string, userId: string) {
    return this.prisma.user.findFirst({ where: { id: userId, tenantId } });
  }

  findBranches(tenantId: string, branchIds: string[]) {
    return this.prisma.branch.findMany({
      where: { tenantId, id: { in: branchIds } },
      select: { id: true },
    });
  }

  findRoles(tenantId: string, roleIds: string[]) {
    return this.prisma.role.findMany({
      where: { tenantId, id: { in: roleIds } },
      select: { id: true },
    });
  }

  create(input: {
    tenantId: string;
    name: string;
    username: string;
    email: string;
    passwordHash: string;
    branchIds: string[];
    roleIds: string[];
  }) {
    return this.prisma.user.create({
      data: {
        tenantId: input.tenantId,
        name: input.name,
        username: input.username,
        email: input.email,
        passwordHash: input.passwordHash,
        branches: {
          create: input.branchIds.map((branchId) => ({ branchId })),
        },
        roles: {
          create: input.roleIds.map((roleId) => ({ roleId })),
        },
      },
      select: { id: true, name: true, username: true, email: true, isActive: true },
    });
  }

  async update(
    tenantId: string,
    userId: string,
    input: {
      name?: string;
      username?: string;
      email?: string;
      isActive?: boolean;
      branchIds?: string[];
      roleIds?: string[];
    },
  ) {
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.findFirstOrThrow({ where: { id: userId, tenantId } });

      await tx.user.update({
        where: { id: user.id },
        data: {
          ...(input.name !== undefined ? { name: input.name } : {}),
          ...(input.username !== undefined ? { username: input.username } : {}),
          ...(input.email !== undefined ? { email: input.email } : {}),
          ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
        },
      });

      if (input.branchIds) {
        await tx.userBranch.deleteMany({ where: { userId } });
        await tx.userBranch.createMany({
          data: input.branchIds.map((branchId) => ({ userId, branchId })),
          skipDuplicates: true,
        });
      }

      if (input.roleIds) {
        await tx.userRole.deleteMany({ where: { userId } });
        await tx.userRole.createMany({
          data: input.roleIds.map((roleId) => ({ userId, roleId })),
          skipDuplicates: true,
        });
      }

      return tx.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, username: true, email: true, isActive: true },
      });
    });
  }

  updatePassword(userId: string, passwordHash: string) {
    return this.prisma.user.update({ where: { id: userId }, data: { passwordHash } });
  }

  revokeSessions(userId: string) {
    return this.prisma.session.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}
