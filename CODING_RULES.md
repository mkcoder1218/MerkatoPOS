# CODING RULES

These rules apply to all code in the MerkatoPOS repository.

They supplement `DEVELOPMENT_INSTRUCTIONS.md`. If a task-specific instruction conflicts with this file, follow the explicit task instruction while preserving the intent of these rules wherever possible.

---

## 1. CORE PRINCIPLES

Write code that is:

- readable
- maintainable
- testable
- modular
- explicit
- secure
- tenant-safe
- easy to debug

Prefer the smallest clean solution that fits the existing architecture.

Do not overengineer.

Do not refactor unrelated code while implementing a focused task.

Do not introduce abstractions before they are useful.

Do not duplicate domain logic when an existing reusable implementation already exists.

---

## 2. FILE SIZE RULES

Keep source files focused on one clear responsibility.

### Recommended limits

- Normal source file: target **300 lines or fewer**
- React / React Native component: target **250 lines or fewer**
- NestJS service: target **300 lines or fewer**
- NestJS controller: target **200 lines or fewer**
- Repository / DAL file: target **300 lines or fewer**
- Utility / helper file: target **200 lines or fewer**
- Test file: target **400 lines or fewer**

### Hard limit

A handwritten source file should normally **not exceed 500 lines**.

If a file approaches 500 lines, split it by responsibility before adding more unrelated behavior.

Exceptions may include:

- generated code
- migrations
- generated Prisma artifacts
- large declarative configuration
- fixture/test data
- files where splitting would clearly reduce readability

Do not use the exception as a reason to create giant services or components.

---

## 3. FUNCTION AND METHOD SIZE

Functions should do one thing.

Guidelines:

- target **40 lines or fewer** for normal functions
- avoid functions above **80 lines**
- keep nesting shallow
- prefer early returns over deeply nested conditionals
- extract meaningful domain operations rather than arbitrary chunks of code

Do not split a simple readable function merely to satisfy a line count.

The purpose of the limit is clarity, not artificial fragmentation.

---

## 4. COMPONENT RULES

React and React Native components should remain focused.

A component should not simultaneously own:

- API access
- complex business rules
- large state machines
- formatting logic
- permission calculation
- multiple unrelated UI sections

Prefer:

- page/container component
- focused child components
- reusable hooks
- shared domain utilities
- query/mutation hooks where appropriate

Before creating a component, search for an existing reusable component.

Do not create tiny wrapper components that add no meaningful reuse or readability.

Keep business rules outside UI components.

---

## 5. NESTJS RULES

Follow this flow:

Controller
→ DTO validation
→ Guard / authorization
→ Service
→ Repository / DAL
→ Prisma / database

Controllers must remain thin.

Controllers must not:

- query Prisma directly
- contain complex business logic
- calculate financial totals
- manually duplicate permission logic
- contain tenant-isolation logic that belongs in shared authorization/data-access mechanisms

Services own business behavior.

Repositories / DAL own database access.

Repositories must not become business-rule containers.

Avoid giant catch-all services such as:

- `AppService`
- `CommonService`
- `HelperService`

when the logic belongs to a specific domain.

---

## 6. TYPESCRIPT RULES

Use strict TypeScript.

Do not use `any` unless there is a documented, unavoidable reason.

Prefer:

- explicit domain types
- discriminated unions
- enums/constants for shared domain values
- typed DTOs
- typed API responses
- typed query results

Avoid:

- `as any`
- broad type assertions
- `@ts-ignore`
- `@ts-nocheck`

If suppression is absolutely required, explain why in a nearby comment and keep the scope minimal.

Do not weaken compiler settings to make errors disappear.

Fix the actual type issue.

---

## 7. NAMING

Names must explain intent.

Use descriptive names for:

- files
- variables
- functions
- classes
- DTOs
- database models
- permissions
- constants

Avoid vague names such as:

- `data`
- `item`
- `obj`
- `temp`
- `thing`
- `stuff`
- `helper`
- `manager`

when a more specific domain name is available.

Boolean names should read naturally:

- `isActive`
- `hasPermission`
- `canVoidSale`
- `shouldPrintReceipt`

Functions should generally use verbs:

- `createOrder`
- `calculateTotal`
- `findActiveShift`
- `validateStockAvailability`

---

## 8. IMPORTS AND DEPENDENCIES

Keep imports clean and intentional.

Do not leave:

- unused imports
- unused variables
- dead exports
- abandoned helpers

Avoid circular dependencies.

Respect package and domain boundaries.

Do not reach into another module's internal files when a public export exists.

Do not install a new dependency for functionality that can be implemented cleanly with the existing stack or standard platform APIs.

Before adding a dependency:

1. Check whether the repository already contains an equivalent.
2. Confirm the dependency is maintained.
3. Confirm it is appropriate for the runtime.
4. Consider bundle size and security impact.

---

## 9. ERROR HANDLING

Do not silently swallow errors.

Do not use empty catch blocks.

Errors should:

- preserve useful debugging context
- expose safe client-facing messages
- use appropriate HTTP status codes
- avoid leaking stack traces, SQL details, secrets, or internal infrastructure information

NestJS endpoints should use consistent exceptions/error responses.

Expected business failures should be represented clearly.

Examples:

- insufficient stock
- permission denied
- shift already closed
- duplicate idempotency key
- invalid order state

Unexpected failures should be logged through the project's logging mechanism.

Do not use random `console.log` statements in production code.

---

## 10. COMMENTS

Prefer self-explanatory code.

Comments should explain **why**, not repeat **what** the code already says.

Good reasons for comments include:

- non-obvious business rules
- external protocol requirements
- financial rounding decisions
- synchronization conflict behavior
- compatibility workarounds
- security-sensitive reasoning

Remove obsolete comments when code changes.

Do not leave commented-out code in source files.

Git history is the archive.

---

## 11. DUPLICATION AND ABSTRACTION

Avoid copy-pasting business logic.

If the same meaningful rule appears in multiple places, consider extracting it.

However:

- do not build generic abstractions for one use case
- do not create unnecessary base classes
- do not create "utils" dumping grounds
- do not force unrelated domains through the same abstraction

Prefer domain-specific clarity over clever generic code.

---

## 12. FINANCIAL CODE

Financial calculations require extra care.

Never rely on JavaScript floating-point arithmetic for precise monetary values.

Use decimal-safe types and utilities consistently.

Financial calculations should:

- have explicit rounding rules
- use one source of truth
- be test-covered
- preserve auditability
- avoid recalculating historical values from mutable current configuration unless explicitly intended

Do not scatter tax, discount, subtotal, or total calculations across controllers and UI components.

Centralize domain calculations in testable backend/domain code.

---

## 13. DATABASE CODE

Use Prisma through repositories / DAL according to the project architecture.

Do not call Prisma directly from controllers.

Every tenant-owned query must enforce tenant isolation.

Branch-owned data must enforce branch access where applicable.

Avoid N+1 query patterns.

Select only fields required by the operation when practical.

Use database aggregation for large datasets rather than loading everything into application memory.

Use transactions when multiple database changes must succeed or fail together.

Do not create unnecessarily long transactions.

Use indexes based on real query patterns.

Schema changes must use migrations.

Never manually alter production data unless explicitly requested.

---

## 14. MULTI-TENANT SAFETY

Tenant isolation is non-negotiable.

Never trust a frontend-provided `tenantId` when tenant identity is available from authenticated context.

A repository method operating on tenant-owned data should make tenant scope explicit.

Unsafe pattern:

```ts
findById(id)
```

Prefer a tenant-scoped contract such as:

```ts
findByIdForTenant(id, tenantId)
```

or an equivalent architecture that guarantees tenant scope automatically.

Tests must cover cross-tenant access for security-critical modules.

---

## 15. PERMISSIONS

Authorization is permission-based.

Do not hard-code business access around role names.

Avoid:

```ts
if (user.role === 'MANAGER') {
  // ...
}
```

Prefer permission checks such as:

```text
sales.create
sales.void
void.approve
inventory.adjust
reports.sales.view
```

Use reusable guards/decorators and centralized permission logic.

Frontend permission checks are UX only.

Backend checks are authoritative.

---

## 16. VALIDATION

Validate every external input.

Use DTO validation on API boundaries.

Do not pass unvalidated request bodies directly into Prisma.

Validate:

- strings
- numbers
- enums
- IDs
- dates
- money
- quantities
- pagination
- sort fields
- uploaded files
- configuration values

Reject impossible domain states early.

Do not rely only on frontend validation.

---

## 17. API QUALITY

Keep REST endpoints versioned and consistent.

Use predictable:

- request structures
- response structures
- pagination
- filtering
- sorting
- error formats
- status codes

Do not casually break an existing API contract.

Breaking changes require explicit intent and coordinated client updates.

Avoid returning database models blindly when an API DTO/response model is more appropriate.

---

## 18. PERFORMANCE

Do not optimize blindly, but avoid obvious inefficiencies.

Watch for:

- N+1 queries
- unbounded list endpoints
- loading full tables into memory
- repeated database calls inside loops
- repeated expensive calculations during React renders
- unnecessary client re-renders
- oversized API payloads
- synchronous heavy work in request handlers

List endpoints should normally support pagination when datasets can grow.

Common POS actions must remain fast.

Common reports should aggregate in PostgreSQL where practical.

Heavy background work should use BullMQ when appropriate.

---

## 19. OFFLINE AND SYNC CODE

Offline writes must remain idempotent and retry-safe.

Do not generate synchronization logic that can create duplicate sales.

Every sync operation should have clear:

- identity
- status
- retry behavior
- error state
- conflict behavior

Completed local sales must never disappear because synchronization failed.

Do not mix printing success with sale persistence success.

---

## 20. SECURITY

Never commit:

- passwords
- API keys
- access tokens
- private keys
- production credentials
- secret connection strings

Do not log secrets.

Do not expose internal errors to clients.

Use secure authentication and authorization patterns.

Sanitize and validate file uploads.

Rate-limit sensitive/public endpoints where appropriate.

Use least-privilege access.

Security checks must live on the backend.

---

## 21. TESTING RULES

Add tests for critical business logic.

Prioritize:

- tenant isolation
- permissions
- money calculations
- discounts
- payments
- order state transitions
- inventory movements
- stock validation
- void approval
- shifts
- offline synchronization
- idempotency
- duplicate prevention

A bug fix should include a regression test when practical.

Tests should verify behavior, not merely mirror implementation details.

Keep test setup readable and reusable without building overly abstract test frameworks.

---

## 22. FRONTEND STATE

Use the right state tool for the right job.

Prefer:

- TanStack Query for server state
- local component state for local UI state
- Zustand for genuinely shared client state

Do not mirror server data unnecessarily into global client stores.

Do not create global state for values used by one component.

Keep derived values derived rather than storing duplicate state.

---

## 23. REACT PERFORMANCE

Do not add `useMemo`, `useCallback`, or memoization everywhere by default.

Use them when they solve a real rerender or referential-stability problem.

Avoid expensive computation directly inside render paths.

Use stable keys for lists.

Do not use array indexes as keys when item identity exists.

Keep effects focused.

Do not use `useEffect` as a substitute for normal data flow.

Clean up subscriptions, timers, and listeners.

---

## 24. STYLING AND UI

Reuse existing UI components before creating new ones.

Keep visual behavior consistent across the application.

Avoid:

- one-off spacing systems
- arbitrary colors when design tokens exist
- duplicated modal implementations
- duplicated form controls
- layout hacks that only work at one screen size

POS UI must remain touch-friendly and fast.

Responsive behavior should be intentional.

Accessibility should not be sacrificed for visual styling.

---

## 25. INTERNATIONALIZATION

Do not hard-code user-facing English text throughout components.

Use translation keys according to the application's i18n architecture.

Keep domain values separate from translated labels.

Do not store translated UI labels as database enum values.

---

## 26. LOGGING

Use structured application logging.

Logs should provide enough context to debug issues.

Useful context may include:

- request/correlation ID
- tenant ID
- branch ID
- user ID
- device/register ID
- entity ID
- operation name

Never log sensitive credentials or payment secrets.

Avoid noisy logs inside hot loops or frequently rendered frontend code.

---

## 27. DEAD CODE

Remove code that is no longer used.

Do not leave:

- commented-out implementations
- unused feature branches inside code
- obsolete functions
- duplicate legacy paths
- unused imports
- stale TODOs with no actionable meaning

TODO comments must describe a concrete remaining task.

---

## 28. FORMATTING AND LINTING

Code must pass the repository's configured formatter, linter, and TypeScript checks.

Do not disable lint rules globally just to make code pass.

Fix the underlying problem.

If an exception is necessary, scope it to the smallest possible line/block and explain why.

Maintain consistent formatting through project tooling rather than manual style differences.

---

## 29. BEFORE ADDING NEW CODE

Before creating a new:

- component
- hook
- service
- repository
- DAL
- guard
- decorator
- utility
- helper
- type
- DTO
- modal
- table
- form abstraction

search the relevant area of the repository first.

Reuse or extend an existing implementation when it fits cleanly.

Do not create parallel architectures for the same concern.

---

## 30. BUG FIX RULES

When debugging:

1. Reproduce or identify the actual failure.
2. Trace the flow to the responsible file/function.
3. Determine the root cause.
4. Fix the root cause rather than masking the symptom.
5. Avoid unrelated refactoring.
6. Add/update a regression test when practical.
7. Run relevant validation.
8. Confirm existing behavior remains intact.

Do not "fix" an error by disabling functionality.

---

## 31. CHANGE SCOPE

Keep changes focused.

A task should not become an excuse to rewrite unrelated modules.

Do not rename files, reorganize folders, replace libraries, or reformat large unrelated areas unless the task requires it.

Preserve existing public behavior unless a change is explicitly requested.

---

## 32. VALIDATION BEFORE COMPLETION

When practical, run the relevant:

- formatter
- lint
- TypeScript typecheck
- unit tests
- integration tests
- build

Only run checks relevant to the changed area when the repository becomes large enough that full validation is unnecessarily expensive.

Fix errors caused by the change before considering the task complete.

Do not hide failing checks.

---

## 33. CODE REVIEW CHECKLIST

Before considering implementation complete, verify:

- Is the file still reasonably sized?
- Is each function focused?
- Is there duplicated business logic?
- Is tenant scope enforced?
- Are permissions enforced on the backend?
- Are external inputs validated?
- Are money calculations decimal-safe?
- Are errors handled intentionally?
- Are API contracts preserved?
- Are queries bounded and efficient?
- Is the code testable?
- Are critical rules tested?
- Are there unused imports or dead code?
- Did we reuse existing abstractions?
- Did we avoid unrelated refactors?
- Does the implementation remain understandable to another developer?

---

## FINAL RULE

Code quality is not measured by cleverness.

Prefer code that another developer can open six months later and understand quickly.

Keep files focused.

Keep functions focused.

Keep domain boundaries clear.

Keep security and tenant isolation explicit.

Keep the daily workflow simple.
