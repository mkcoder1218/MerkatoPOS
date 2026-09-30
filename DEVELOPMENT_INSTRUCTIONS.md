# MASTER DEVELOPMENT INSTRUCTIONS

You are working on a multi-tenant SaaS platform for restaurants, bakeries, cafés, bars, fast-food businesses, mini-markets, and other retail businesses.

The long-term goal is to build a configurable business-management platform while keeping the daily user experience extremely simple.

The two main product principles are:

- This is ridiculously easy to use.
- Everything my restaurant needs is in one place.

Do not make assumptions that every tenant is a restaurant. Features such as tables, kitchen printing, production, QR ordering, inventory, delivery, or bakery functionality must be configurable.

---

## TECHNOLOGY STACK

Use the following stack unless explicitly instructed otherwise:

- Nx monorepo
- pnpm
- TypeScript
- NestJS backend
- PostgreSQL
- Prisma ORM
- Redis
- BullMQ when background jobs are required
- Next.js for web
- React
- Tailwind CSS
- shadcn/ui when suitable
- TanStack Query
- Expo / React Native for mobile
- Electron for Windows desktop application
- SQLite for desktop/offline storage where appropriate
- IndexedDB for browser offline persistence where appropriate

Do not change major framework choices unless explicitly requested.

---

## ARCHITECTURAL STYLE

The backend should begin as a modular monolith.

Do not introduce microservices unless there is a clear operational or scalability reason.

NestJS modules should correspond to business domains.

Examples:

- auth
- tenants
- branches
- users
- permissions
- products
- categories
- modifiers
- orders
- sales
- payments
- shifts
- inventory
- production
- waste
- suppliers
- purchases
- expenses
- printers
- reports
- notifications
- subscriptions
- settings
- audit

Do not create giant modules or giant service files.

Prefer small domain-focused modules with clear responsibilities.

---

## BACKEND LAYERING

Follow a consistent flow:

Route / Controller
→ DTO validation
→ Authorization / permission check
→ Service
→ Repository / DAL
→ Database

Controllers must stay thin.

Controllers should:

- parse request information
- use DTOs
- call services
- return responses

Controllers must not:

- contain complex business logic
- directly query Prisma
- calculate financial totals
- implement permission logic manually in every endpoint

Services contain business rules.

Repositories / DAL contain database access.

Do not place business rules inside repositories.

Do not call Prisma directly from controllers.

---

## DATABASE RULES

PostgreSQL is the source of truth for cloud data.

Use Prisma for database access unless explicitly instructed otherwise.

Keep Prisma models organized by domain where project tooling allows it.

Use migrations for schema changes.

Never manually modify production data unless explicitly requested.

Financial values must never use JavaScript floating-point calculations when precision matters.

Use decimal-safe database and application types.

Never hard-delete financial or operational history when an auditable status change can be used instead.

Examples:

- VOIDED
- CANCELLED
- REFUNDED
- ARCHIVED

Historical records must remain traceable.

---

## MULTI-TENANCY

Tenant isolation is a critical invariant.

Every tenant-owned entity must be scoped correctly.

Examples include:

- products
- sales
- orders
- staff
- branches
- inventory
- expenses
- suppliers
- printers
- reports
- settings

Never trust a tenantId coming directly from frontend input when it can be derived from authentication context.

Every query that accesses tenant-owned information must enforce tenant isolation.

Branch-level access must also be enforced where applicable.

Never allow data from one tenant to become visible to another tenant.

---

## ROLES AND PERMISSIONS

The authorization system is permission-based.

Roles are labels/groupings only.

Never implement authorization using checks such as:

if role === "MANAGER"

unless the user explicitly requests a special-case rule.

Prefer permissions such as:

- sales.create
- sales.view
- sales.void
- sales.discount
- orders.create
- orders.update
- products.create
- products.update
- inventory.view
- inventory.adjust
- inventory.transfer
- reports.sales.view
- reports.profit.view
- void.approve
- staff.manage
- settings.manage

Users gain permissions through configurable roles or assignments.

The backend is the authority for authorization.

Frontend permission checks are for UX only and must never be treated as security.

Use reusable NestJS guards/decorators for permissions rather than duplicating permission checks throughout controllers.

---

## BUSINESS CONFIGURATION

The platform must be configuration-driven.

A tenant may enable or disable features such as:

- tables
- dine-in
- takeaway
- pickup
- delivery
- QR menu
- QR ordering
- kitchen printing
- production
- label printing
- inventory
- ingredient inventory
- waste
- suppliers
- expenses

Do not force irrelevant features into the UI.

Example:

A mini-market should not be forced to see table management.

A bakery should be able to use production and ingredient tracking.

A restaurant should be able to use tables and kitchen printers.

---

## POS PRINCIPLES

The POS is speed-critical.

Prioritize:

- minimal clicks
- large touch targets
- fast product selection
- fast category switching
- quick checkout
- keyboard support where useful
- barcode support
- predictable navigation

Do not add unnecessary dialogs or confirmation screens.

Confirmation should mainly be used for risky actions such as:

- voiding
- large discounts
- stock adjustment
- shift closing
- destructive configuration changes

The main POS flow should remain simple:

Products
→ Cart
→ Payment
→ Print

---

## ORDERS AND TABLES

Order types are configurable.

Possible types include:

- dine-in
- takeaway
- delivery
- pickup

Do not hard-code these as mandatory.

Tables are optional.

If table functionality is enabled, table selection should be explicit.

If table functionality is disabled, no table logic should block order creation.

---

## INVENTORY

Inventory must support both simple stock and advanced ingredient-based inventory.

Use an inventory ledger / stock movement model rather than silently overwriting quantities.

Typical movement types:

- purchase
- sale
- waste
- production
- transfer_out
- transfer_in
- adjustment
- return

Every stock-changing operation should be auditable.

Where recipes are configured, selling or producing products may reduce ingredients according to configuration.

Units and conversions must support scenarios such as:

- kg ↔ g
- liter ↔ ml
- box ↔ pieces

Avoid building inventory logic specifically for only food businesses.

---

## PRODUCTION AND WASTE

Production is optional and configurable.

Production may:

- consume ingredients
- increase finished product inventory
- record quantity
- record responsible staff
- record branch
- record production cost
- record batch information

Waste tracking should support configurable reasons such as:

- expired
- burned
- damaged
- spoiled
- staff meal
- complimentary
- production error
- other

Waste should affect inventory when configured to do so.

---

## PRINTING

Printing is a first-class domain, not an afterthought.

Support configurable printing for:

- customer receipts
- kitchen tickets
- production tickets
- product labels
- barcode labels
- invoices
- reports

A branch may have several printers.

Products/categories may route to different printers.

Example:

Pizza → Kitchen printer
Coffee → Bar printer
Cake → Bakery printer

Printing failures must never cause a completed sale to disappear or roll back.

Correct flow:

Sale saved
→ Print job created
→ Print attempted

Print jobs should have states such as:

- queued
- printing
- printed
- failed
- retrying

Allow authorized reprinting.

---

## OFFLINE-FIRST REQUIREMENT

POS functionality must continue when internet access is unavailable.

Offline support is not optional.

At minimum, local operation should support:

- product access
- category access
- sales
- orders
- payments
- receipt printing
- kitchen printing
- opening shifts
- closing shifts
- basic stock changes

Use locally generated globally unique IDs for offline records.

Offline synchronization must be:

- idempotent
- retryable
- conflict-aware
- auditable

Use idempotency keys for synchronized writes.

Never duplicate a sale because the client retried a request.

Never delete an offline transaction simply because synchronization failed.

Maintain a synchronization queue with clear statuses and retry rules.

---

## SHIFTS

Registers may operate using cashier shifts.

A shift can contain:

- opening amount
- opening time
- register
- staff member
- sales
- refunds
- voids
- expenses
- expected amount
- actual amount
- difference
- closing time

Shift discrepancies must remain visible and auditable.

---

## VOID AND CORRECTION RULES

Before checkout, cart items may be removed normally.

Once an order/sale has been committed, sensitive changes should follow configured permission rules.

A business may require:

Employee requests void
→ authorized manager approves
→ void processed
→ audit log created

Do not permanently delete committed financial records.

---

## REPORTING

Reports should support filtering by relevant dimensions such as:

- date range
- branch
- user
- register
- product
- category
- payment method
- order type

Core reports eventually include:

- daily sales
- weekly sales
- monthly sales
- product sales
- category sales
- profit
- expenses
- inventory
- waste
- cashier performance
- payment methods
- tax
- best-selling products
- hourly sales
- production
- purchases
- supplier balances
- branch comparison
- shift discrepancies
- discounts
- voids

Optimize common dashboard queries.

Do not load massive datasets into memory when aggregation belongs in PostgreSQL.

---

## AUDIT LOGGING

Sensitive mutations must generate audit records.

Examples:

- price changed
- discount changed
- order voided
- void approved
- stock adjusted
- permissions changed
- user suspended
- shift corrected
- printer configuration changed

Audit records should capture enough information to understand:

- who
- what
- when
- where
- previous value
- new value

Audit history must not be editable by normal users.

---

## API RULES

Use versioned REST APIs initially.

Example:

/api/v1/products
/api/v1/orders
/api/v1/inventory

Validate all external input using DTOs.

Use consistent error structures.

Do not leak internal stack traces or database errors to clients.

Use correct HTTP status codes.

Avoid breaking existing API response contracts unless the task explicitly requires a breaking change.

---

## CODE QUALITY

Use strict TypeScript.

Avoid `any` unless there is a justified reason.

Prefer readable explicit code over clever abstractions.

Do not overengineer.

Before creating a new:

- component
- service
- utility
- guard
- decorator
- repository
- hook
- type
- helper

check whether the project already contains something reusable.

Do not refactor unrelated code while fixing a focused issue.

Keep functions reasonably small.

Use descriptive names.

Avoid magic strings and magic numbers.

Use enums/constants where domain values are shared.

Keep domain logic testable.

---

## TESTING

Critical business rules require tests.

Prioritize tests for:

- tenant isolation
- permissions
- pricing calculations
- discounts
- payments
- inventory movements
- offline synchronization
- duplicate prevention
- void workflows
- shifts

When fixing bugs, add or update tests when practical to protect against regression.

Do not create tests that only mirror implementation details.

---

## SECURITY

Always treat backend authorization as authoritative.

Use:

- secure password hashing
- secure session/token handling
- refresh-token rotation when used
- rate limiting
- validation
- tenant isolation
- permission checks
- secure uploads
- audit logging

Never expose secrets in frontend code.

Never commit environment secrets.

Do not log passwords, tokens, payment credentials, or other sensitive secrets.

---

## UI AND UX

Keep UI visually clean and operationally fast.

Do not clutter dashboards.

The primary dashboard metric initially is:

Today's Sales

Additional cards should be added only when useful.

Use loading skeletons rather than disruptive layout jumps.

Support responsive layouts.

Design POS screens for touch usage.

Support internationalization from the beginning.

Do not hard-code English strings throughout components.

---

## DEVELOPMENT WORKFLOW

When asked to implement something:

1. Inspect the actual repository first.
2. Confirm the repository and requested branch.
3. Find the existing architecture/pattern.
4. Reuse existing components and utilities.
5. Identify the actual root cause for bugs.
6. Make the smallest clean change.
7. Avoid unrelated refactoring.
8. Run relevant typecheck/tests/build where practical.
9. Fix issues caused by the change.
10. Create one final commit only when requested or when repository instructions require it.

Do not create temporary/WIP commits.

Do not create branches or switch branches unless explicitly requested.

Do not deploy automatically unless explicitly requested.

Do not create pull requests unless explicitly requested.

---

## FINAL IMPLEMENTATION PRINCIPLE

Always optimize for this balance:

Powerful configuration for owners and administrators.

Extreme simplicity for the employee using the system every day.

Complexity belongs in configuration.

Simplicity belongs in the workflow.