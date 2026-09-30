import { Injectable } from '@nestjs/common';
import { PrismaService } from '@merkatopos/database';

@Injectable()
export class PermissionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.permission.findMany({
      orderBy: { code: 'asc' },
      select: { id: true, code: true, description: true },
    });
  }
}
