# MerkatoPOS

Configurable multi-tenant POS and business-management platform.

## Workspace

- `apps/web` — Next.js web application
- `apps/api` — NestJS REST API
- `packages/database` — Prisma/PostgreSQL integration
- `packages/shared` — shared contracts, permissions, and decimal-safe domain math

## Implemented foundation

- tenant-aware authentication, branches, users, roles, and permissions
- devices, POS registers, shifts, and optional tables
- categories, units, taxes, products, modifiers, discounts, and inventory
- server-priced orders and atomic idempotent checkout
- CASH, Bank Transfer, Telebirr, and Chapa payment records
- void approval with stock/payment reversal
- receipt, kitchen, and label printer configuration
- register receipt-printer assignment and branch default printers
- product/category kitchen routing
- immutable receipt and kitchen-ticket payload snapshots
- queued/printing/printed/failed/retrying print-job lifecycle
- local print-agent claim/acknowledge/fail contract
- automatic retry state and permission-controlled manual retry
- auditable reprint jobs that never alter sale state
- print failures isolated from completed financial transactions

## Local setup

Start PostgreSQL first, then run:

```bash
pnpm install
pnpm setup:local:db
pnpm dev
```

`pnpm setup:local` creates an untracked local `.env` only when one does not already exist. It generates a random JWT secret and local demo seed credentials.

Default local demo login created by the setup command (authentication uses username):

- tenant slug: `local-demo`
- username: `admin`
- email/contact: `admin@local.test`
- password: `ChangeMe123!`

These credentials are for local development only. Change them before using a shared or deployed environment.

## Validation

```bash
pnpm validate
```

## Printing API

- `GET|POST /api/v1/printers`
- `PATCH /api/v1/printers/:printerId`
- `PUT /api/v1/printers/receipt-assignment`
- `GET /api/v1/printers/kitchen-routes/list`
- `POST /api/v1/printers/kitchen-routes`
- `PATCH /api/v1/printers/kitchen-routes/:routeId`
- `GET /api/v1/print-jobs`
- `POST /api/v1/print-jobs/claim`
- `POST /api/v1/print-jobs/:jobId/printed`
- `POST /api/v1/print-jobs/:jobId/failed`
- `POST /api/v1/print-jobs/:jobId/retry`
- `POST /api/v1/print-jobs/:jobId/reprint`

The local print service authenticates as a user/service identity with `print_agent.process`, claims jobs for a configured printer, prints the returned payload, then acknowledges success or failure.

See `DEVELOPMENT_INSTRUCTIONS.md` and `CODING_RULES.md` before architectural changes.
