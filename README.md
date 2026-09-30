# MerkatoPOS

Configurable multi-tenant POS and business-management platform.

## Workspace

- `apps/web` — Next.js web application
- `apps/api` — NestJS REST API
- `packages/database` — Prisma/PostgreSQL integration
- `packages/shared` — shared auth and permission contracts

The first backend foundation includes tenants, branches, users, roles, permissions, tenant-aware JWT authentication, and device registration.

## Local setup

```bash
cp .env.example .env
docker compose up -d postgres
pnpm install
pnpm db:generate
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Set a strong `JWT_ACCESS_SECRET` and all `SEED_*` values before seeding.

## Validation

```bash
pnpm db:validate
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

API base: `http://localhost:3001/api/v1`

See `DEVELOPMENT_INSTRUCTIONS.md` and `CODING_RULES.md` before architectural changes.
