import { Injectable } from '@nestjs/common';
import { PrismaService } from '@merkatopos/database';

@Injectable()
export class AuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  findLoginUser(tenantSlug: string, username: string) {
    return this.prisma.user.findFirst({
      where: {
        username,
        isActive: true,
        tenant: { slug: tenantSlug, isActive: true },
      },
      select: {
        id: true,
        tenantId: true,
        username: true,
        email: true,
        passwordHash: true,
      },
    });
  }

  findUserForAuth(userId: string) {
    return this.prisma.user.findFirst({
      where: { id: userId, isActive: true, tenant: { isActive: true } },
      include: {
        branches: { select: { branchId: true } },
        roles: {
          include: {
            role: {
              include: {
                permissions: { include: { permission: true } },
              },
            },
          },
        },
      },
    });
  }

  createSession(input: {
    userId: string;
    refreshTokenHash: string;
    expiresAt: Date;
    userAgent?: string;
    ipAddress?: string;
  }) {
    return this.prisma.session.create({
      data: input,
      select: { id: true },
    });
  }

  findSessionByRefreshTokenHash(refreshTokenHash: string) {
    return this.prisma.session.findUnique({
      where: { refreshTokenHash },
      include: { user: true },
    });
  }

  findActiveSession(sessionId: string) {
    return this.prisma.session.findFirst({
      where: {
        id: sessionId,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      select: { id: true, userId: true },
    });
  }

  rotateSession(sessionId: string, refreshTokenHash: string, expiresAt: Date) {
    return this.prisma.session.update({
      where: { id: sessionId },
      data: {
        refreshTokenHash,
        expiresAt,
        lastUsedAt: new Date(),
      },
    });
  }

  revokeSession(sessionId: string) {
    return this.prisma.session.updateMany({
      where: { id: sessionId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  revokeAllUserSessions(userId: string) {
    return this.prisma.session.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  updatePassword(userId: string, passwordHash: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });
  }
}
