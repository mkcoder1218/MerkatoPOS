# MerkatoPOS

Configurable multi-tenant POS and business-management platform.

## Workspace

- `apps/web` — Next.js web application
- `apps/api` — NestJS REST API
- `packages/database` — Prisma/PostgreSQL integration
- `packages/shared` — shared auth and permission contracts

## Implemented foundation

- tenant-aware authentication
- rotating refresh-token sessions
- logout/session revocation
- current-user endpoint
- password change and admin reset
- tenant management
- branch management
- user management and branch/role assignment
- permission catalog
- custom roles and permission assignment
- device registration, lifecycle, and heartbeat
- POS register management and device linking
- tenant/branch isolation checks
- first PostgreSQL migration
- focused security regression tests

## Local setup

```bash
cp .env.example .env
docker compose up -d postgres
pnpm install
pnpm db:generate
pnpm db:migrate:deploy
pnpm db:seed
pnpm dev
```

Set a strong `JWT_ACCESS_SECRET` and all `SEED_*` values before seeding.

## Validation

```bash
pnpm validate
```

This runs Prisma validation, TypeScript typechecking, linting, tests, and builds.

## API base

`http://localhost:3001/api/v1`

Core routes:

- `GET /health`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `GET /auth/me`
- `POST /auth/change-password`
- `GET|PATCH /tenants/current`
- `GET|POST /branches`
- `PATCH /branches/:branchId`
- `GET|POST /users`
- `PATCH /users/:userId`
- `POST /users/:userId/reset-password`
- `GET|POST /roles`
- `PATCH|DELETE /roles/:roleId`
- `GET /permissions`
- `GET /devices`
- `POST /devices/register`
- `PATCH /devices/:deviceId`
- `POST /devices/:deviceId/heartbeat`
- `GET|POST /registers`
- `PATCH /registers/:registerId`

See `DEVELOPMENT_INSTRUCTIONS.md` and `CODING_RULES.md` before architectural changes.
