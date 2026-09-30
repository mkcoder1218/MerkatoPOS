# MerkatoPOS

Configurable multi-tenant POS and business-management platform.

## Workspace

- `apps/web` — Next.js web application
- `apps/api` — NestJS REST API
- `packages/database` — Prisma/PostgreSQL integration
- `packages/shared` — shared contracts, permissions, and decimal-safe domain math

## Implemented foundation

- tenant-aware authentication and rotating sessions
- branches, users, roles, permissions
- devices and POS registers
- categories, units, tax profiles, products, modifiers, discounts
- branch-scoped inventory and auditable stock movements
- configurable POS settings
- shift opening/closing with cash reconciliation
- optional branch tables with occupancy derived from open orders
- server-side POS pricing snapshots
- dine-in, takeaway, pickup, and delivery orders
- CASH, Bank Transfer, Telebirr, and Chapa payments
- idempotent atomic sale finalization
- inventory deduction during checkout
- receipt numbering
- permission-based void request/approval
- void stock reversal and payment reversal

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

This generates Prisma Client and runs Prisma validation, TypeScript typechecking, linting, tests, and builds.

## Selling workflow API

- `GET|PATCH /api/v1/pos-settings`
- `GET /api/v1/shifts`
- `POST /api/v1/shifts/open`
- `POST /api/v1/shifts/:shiftId/close`
- `GET|POST /api/v1/tables`
- `PATCH /api/v1/tables/:tableId`
- `GET|POST /api/v1/orders`
- `GET|PATCH /api/v1/orders/:orderId`
- `POST /api/v1/orders/:orderId/complete`
- `POST /api/v1/orders/:orderId/void-request`
- `POST /api/v1/orders/:orderId/void-approve`
- `POST /api/v1/orders/:orderId/void-reject`
- `GET /api/v1/payments`

See `DEVELOPMENT_INSTRUCTIONS.md` and `CODING_RULES.md` before architectural changes.
