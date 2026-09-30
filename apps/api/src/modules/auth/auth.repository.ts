import { Injectable } from '@nestjs/common';
import { PrismaService } from '@merkatopos/database';

@Injectable()
export class AuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  findLoginUser(tenantSlug: string, email: string) {
    return this.prisma.user.findFirst({
      where: {
        email,
        isActive: true,
        tenant: { slug: tenantSlug, isActive: true },
      },
      include: {
        branches: { select: { branchId: true } },
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: { permission: true },
                },
              },
            },
          },
        },
      },
    });
  }
}
