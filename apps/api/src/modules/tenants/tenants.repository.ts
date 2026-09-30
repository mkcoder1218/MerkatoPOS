import { Injectable } from '@nestjs/common';
import { PrismaService } from '@merkatopos/database';

@Injectable()
export class TenantsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string) {
    return this.prisma.tenant.findUnique({
      where: { id },
      select: { id: true, name: true, slug: true, isActive: true, createdAt: true },
    });
  }

  update(id: string, data: { name?: string }) {
    return this.prisma.tenant.update({
      where: { id },
      data,
      select: { id: true, name: true, slug: true, isActive: true, createdAt: true },
    });
  }
}
