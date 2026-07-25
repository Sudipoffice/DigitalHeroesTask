# Legacy System Migration Plan

## Overview

This document outlines the migration of a monolithic order-processing endpoint from a legacy Express.js codebase into a clean, layered architecture. The plan prioritizes **incremental improvement** — each route is refactored only when touched for other work, avoiding a risky big-bang rewrite.

---

## Before: Legacy Code

The original `routes/orders.js` concentrated every concern into a single file:

| Issue | Example |
|---|---|
| **Hardcoded secrets** | Database connection string and Stripe secret key embedded in source |
| **SQL injection** | Raw queries built via string concatenation (`"SELECT ... WHERE id = " + userId`) |
| **Mixed concerns** | Business logic (pricing, coupons) inline inside the route handler |
| **Silent failures** | Invalid coupon codes are silently ignored; third-party payment errors are uncaught |
| **No input validation** | Request body fields are assumed to exist without any schema check |
| **Bare `res.send()` responses** | No structured error handling — inline `res.status().send()` throughout |

### Key Problems

- **Security**: Secrets in source code, SQL injection vector, unvalidated user input
- **Maintainability**: Business logic tangled with HTTP concerns; impossible to unit test
- **Reliability**: Payment failures cause partial state (order charged but not recorded)
- **Observability**: No logging, no transaction boundary, no error classification

---

## After: Improved Architecture

The refactored code separates the system into four distinct layers:

```
routes/        → Thin HTTP adapter (input validation + routing)
services/      → Business logic & orchestration (unit-testable)
repositories/  → Data access (parameterized queries, isolated)
config/        → Environment validation (fail-fast at startup)
```

### Layer 1: Config (`config/env.js`)

Secrets are loaded from environment variables and **validated at startup**. If a required variable is missing, the process exits immediately with a clear message — never silently defaults to a fallback.

### Layer 2: Repositories (`repositories/`)

All database access is isolated into repository classes. Queries use **parameterized placeholders** (`$1`, `$2`) instead of string concatenation, eliminating SQL injection risk. Each repository exposes a focused API (`getBalance`, `createOrder`) and maps database errors to domain exceptions (`NotFoundError`).

### Layer 3: Services (`services/`)

Business logic is extracted into two types of services:

- **Pure services** (`discountService.js`): Stateless, no I/O, easily unit-testable. Coupon validation throws `InvalidCouponError` for unknown codes instead of silently ignoring them.
- **Orchestration services** (`orderService.js`): Own the **transaction boundary**. The payment is charged inside a database transaction, so a DB failure triggers a rollback and the charge can be reconciled later. Dependencies are injected via the constructor, making the service testable with mocks.

### Layer 4: Routes (`routes/orders.js`)

Routes are now **thin adapters**:
1. Validate input with **Zod schemas** (typed, composable)
2. Call the service layer
3. Pass errors to centralized error-handling middleware

No business logic, no raw queries, no secret handling.

---

## Migration Strategy

Rather than a big-bang rewrite, we follow a **strangler fig pattern**:

```
Phase 1: Extract config     → Move secrets to env vars, validate at startup
Phase 2: Add validation     → Introduce Zod schemas (parse, don't crash)
Phase 3: Wrap data access   → Create repository classes behind existing queries
Phase 4: Extract services   → Move business logic into pure functions
Phase 5: Thin out routes    → Delegate to services, keep only HTTP concerns
```

Each phase is done **one route at a time**, only when that route is already being modified for other work. This minimizes risk and keeps the codebase deployable at every step.

---

## Key Improvements Summary

| Dimension | Before | After |
|---|---|---|
| Security | Secrets in source, SQL injection | Environment validation, parameterized queries |
| Testability | Zero unit-testable code | Pure services + injected dependencies |
| Error handling | Inline `res.send('error')` | Typed exceptions + centralized middleware |
| Input safety | Assumed valid | Zod schema validation |
| Transaction safety | None | DB-level transaction wrapping payment |
| Coupon logic | `if/else` chain silently ignoring bad codes | Map lookup throwing typed errors |
| Coupling | Monolithic route file | Layered: config → repositories → services → routes |
