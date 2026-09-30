import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { CORE_PERMISSION_CODES } from '@merkatopos/shared';

const prisma = new PrismaClient();

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required seed environment variable: ${name}`);
  }
  return value;
}

async function main(): Promise<void> {
  const tenantName = required('SEED_TENANT_NAME');
  const tenantSlug = required('SEED_TENANT_SLUG');
  const branchName = required('SEED_BRANCH_NAME');
  const adminName = required('SEED_ADMIN_NAME');
  const adminEmail = required('SEED_ADMIN_EMAIL').toLowerCase();
  const adminPassword = required('SEED_ADMIN_PASSWORD');

  const tenant = await prisma.tenant.upsert({
    where: { slug: tenantSlug },
    create: { name: tenantName, slug: tenantSlug },
    update: { name: tenantName },
  });

  const branch = await prisma.branch.upsert({
    where: { tenantId_name: { tenantId: tenant.id, name: branchName } },
    create: { tenantId: tenant.id, name: branchName },
    update: {},
  });

  const permissions = await Promise.all(
    CORE_PERMISSION_CODES.map((code) =>
      prisma.permission.upsert({ where: { code }, create: { code }, update: {} }),
    ),
  );

  const role = await prisma.role.upsert({
    where: { tenantId_name: { tenantId: tenant.id, name: 'Owner' } },
    create: { tenantId: tenant.id, name: 'Owner', isSystem: true },
    update: { isSystem: true },
  });

  await prisma.rolePermission.createMany({
    data: permissions.map((permission) => ({
      roleId: role.id,
      permissionId: permission.id,
    })),
    skipDuplicates: true,
  });

  const passwordHash = await bcrypt.hash(adminPassword, 12);
  const user = await prisma.user.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: adminEmail } },
    create: { tenantId: tenant.id, name: adminName, email: adminEmail, passwordHash },
    update: { name: adminName, passwordHash, isActive: true },
  });

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: user.id, roleId: role.id } },
    create: { userId: user.id, roleId: role.id },
    update: {},
  });

  await prisma.userBranch.upsert({
    where: { userId_branchId: { userId: user.id, branchId: branch.id } },
    create: { userId: user.id, branchId: branch.id },
    update: {},
  });
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error: unknown) => {
    await prisma.$disconnect();
    throw error;
  });
