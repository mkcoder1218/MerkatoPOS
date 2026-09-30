# MerkatoPOS

Configurable multi-tenant POS and business-management platform.

## Workspace

- `apps/web` — Next.js web application
- `apps/api` — NestJS REST API
- `packages/database` — Prisma/PostgreSQL integration
- `packages/shared` — shared contracts, permissions, and decimal-safe domain math

## Implemented platform foundation

- tenant-aware authentication and rotating sessions
- branches, users, roles, permissions
- devices and POS registers
- categories and POS visibility
- custom units and unit conversions
- inclusive/exclusive tax profiles
- products with SKU/barcode, branch availability, and branch price overrides
- modifier groups/options and product attachment
- timed percentage discounts
- branch-scoped inventory items
- auditable stock-movement ledger
- negative-stock rules
- optimistic inventory concurrency protection
- decimal-safe tax and quantity calculations

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

## Catalog and inventory API

- `GET|POST /api/v1/categories`
- `PATCH /api/v1/categories/:categoryId`
- `GET|POST /api/v1/units`
- `PATCH /api/v1/units/:unitId`
- `GET|POST /api/v1/units/conversions`
- `GET|POST /api/v1/taxes`
- `PATCH /api/v1/taxes/:taxProfileId`
- `GET|POST /api/v1/products`
- `PATCH /api/v1/products/:productId`
- `GET|POST /api/v1/modifiers/groups`
- `PATCH /api/v1/modifiers/groups/:groupId`
- `POST /api/v1/modifiers/groups/:groupId/options`
- `PATCH /api/v1/modifiers/options/:optionId`
- `PUT /api/v1/modifiers/products/:productId/groups`
- `GET|POST /api/v1/discounts`
- `PATCH /api/v1/discounts/:discountId`
- `GET|POST /api/v1/inventory`
- `GET|POST /api/v1/inventory/:itemId/movements`

See `DEVELOPMENT_INSTRUCTIONS.md` and `CODING_RULES.md` before architectural changes.
