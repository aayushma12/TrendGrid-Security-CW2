# API Development Workflow & Project Standards

## Purpose

This document is the **single source of truth** for developing APIs in this project.

Every developer and AI assistant **must read and follow this workflow before implementing any new API**. The objective is to maintain a consistent, scalable, maintainable, and production-ready backend.

---

# Development Workflow

Every API must follow this workflow without exception.

```text
Requirement
    │
    ▼
Study Existing Project Structure
    │
    ▼
Understand Database Design
    │
    ▼
Create DTOs
    │
    ▼
Create Validation Rules
    │
    ▼
Create Repository Methods
    │
    ▼
Implement Business Logic in Service
    │
    ▼
Create Controller
    │
    ▼
Register Routes
    │
    ▼
Implement Pagination / Search / Filters
    │
    ▼
Standardize Response
    │
    ▼
Implement Global Error Handling
    │
    ▼
Add Logging
    │
    ▼
Update Swagger Documentation
    │
    ▼
Testing
    │
    ▼
Code Review
    │
    ▼
Ready for Merge
```

---

# Request Pipeline

Every request must travel this exact path — no endpoint may bypass a stage:

```text
Client Request
    → Route (features/<name>/route, registered via defineRoutes)
    → Global Middleware (ipFilter → helmet → cors → compression → body parsing → tunnelContext → rate limit → requestLogger → auditLog)
    → Authentication (requireAuth — when route auth ≠ 'public')
    → Authorization (requireRole — when route auth names a role)
    → Validation (validate(schema) — Zod, before the controller)
    → Controller (thin)
    → Service (business logic)
    → Repository (all database access)
    → Response Formatter (utils/response success()/error())
    → Client Response
```

All routes are declared with `defineRoutes` (utils/defineRoute.ts), which wires
auth → validation → asyncHandler in the correct order automatically. Never
register a raw `router.get(...)` inside a feature.

---

# Project Folder Structure

Every feature should follow the same folder structure.

```text
Feature/
│
├── controller/
├── service/
├── repository/
├── dto/
├── validator/
├── route/
├── swagger/
├── types/
├── utils/
└── constants/
```

**Rules**

- Never skip layers.
- Keep folder names consistent.
- Reuse existing modules whenever possible.
- Follow the existing project architecture.
- A folder may be omitted only when the feature genuinely has no content for
  it (e.g. a feature with no shared helpers needs no `utils/`). Never leave
  empty placeholder folders.

---

# Layer Responsibilities

## Controller

Responsible only for:

- Receiving request
- Calling service
- Returning standardized response

Controllers should **never** contain:

- Business logic
- Database queries
- Validation logic
- Complex calculations

---

## Service

Responsible for:

- Business logic
- Workflow
- Calling repositories
- Combining multiple repositories
- Data processing
- Transforming response data

Services should never return raw database errors.

---

## Repository

Responsible only for:

- Database queries
- Insert
- Update
- Delete
- Read
- Transactions

Repositories should not contain business logic.

**Prisma may only be imported inside a repository (and `config/prisma.ts`).**
Services and controllers must never touch the Prisma client directly — not
even inside a transaction. Repositories expose transaction helpers
(`runInTx(fn)`) and transaction-aware methods that accept a
`Prisma.TransactionClient` so services can orchestrate multi-step workflows
without owning queries.

---

## DTO

Responsible for:

- Request structure
- Response structure
- Data Transfer Objects

---

## Validator

Responsible for validating:

- Request Body
- Query Parameters
- Route Parameters

Validation must occur before reaching the service layer.

---

# Naming Convention

## Routes

Always use RESTful naming.

### Correct

```http
GET    /users
GET    /users/:id
POST   /users
PUT    /users/:id
DELETE /users/:id
```

### Avoid

```text
getUsers
createUserNow
deleteUsersData
```

---

## Controller Naming

```ts
createUserController()
updateUserController()
deleteUserController()
getUsersController()
```

---

## Service Naming

```ts
createUser()
updateUser()
deleteUser()
getUsers()
getUserById()
```

---

## Repository Naming

```ts
create()
update()
delete()
findOne()
findById()
findMany()
```

---

## Variable Naming

Use camelCase.

```ts
firstName
phoneNumber
createdAt
updatedAt
```

---

## Constants

Use uppercase.

```ts
DEFAULT_PAGE_SIZE
MAX_FILE_SIZE
MAX_LIMIT
```

---

# API Response Standard

Every API must return the same response format.

## Success Response

```json
{
  "success": true,
  "statusCode": 200,
  "message": "User retrieved successfully.",
  "data": {},
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  },
  "timestamp": "2026-07-06T10:00:00Z"
}
```

## Error Response

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed.",
  "errors": [],
  "timestamp": "2026-07-06T10:00:00Z"
}
```

Never create custom response formats for individual APIs.

---

# Authentication & Authorization

Declared per route in `defineRoutes` via the `auth` field:

```ts
auth: 'public'          // no token required (storefront reads)
auth: 'authenticated'   // any valid JWT (customer actions)
auth: 'ADMIN'           // single role
auth: ['ADMIN', 'EDITOR'] // any of the listed roles
```

**Rules**

- Auth always executes before validation and business logic.
- Ownership checks (a customer may only touch their own resource) live in the
  service layer, checking `reqUser.id` against the record's `userId` and
  exempting ADMIN.
- Access tokens are short-lived JWTs; refresh tokens are stored hashed with
  rotation-on-use and server-side revocation (`RefreshToken` model).
- Never trust client-supplied ids for identity — the authenticated user comes
  from the verified token only.

---

# Transactions

Use a transaction whenever a workflow writes more than one row that must
succeed or fail together (e.g. place order = stock decrement + order +
items + coupon usage + cart clear; cancel order = status update + stock
restore + history row).

- Transactions are opened by the service through a repository `runInTx`
  helper — never via a direct Prisma import.
- Guarded conditional writes (`updateMany` with a `where` guard) are the
  standard pattern for stock and usage-limit decrements so counts can never
  go negative under concurrency.

---

# File Uploads

- Uploads go through the shared Multer memory uploader (`config/cloudinary.ts`)
  with size/count limits; Multer failures are mapped to 400s by the global
  error handler.
- Image storage/removal is handled by the shared image service — features
  never call the storage SDK directly.
- Always store both the public URL and the provider public id so images can
  be deleted later.

---

# Global Error Handling

Every error should pass through the global error handler.

Handle:

- Validation Errors (ZodError → 400 with `errors[{field,message,code}]`)
- Upload Errors (MulterError → 400)
- Database Errors (Prisma known request errors)
  - `P2002` unique violation → 409 Conflict
  - `P2025` record not found → 404 Not Found
  - `P2003` foreign-key violation → 409 Conflict
- Duplicate Records
- Not Found
- Bad Request
- Internal Server Errors
- Unexpected Exceptions

Repositories should still pre-check friendly cases (duplicate email/SKU) and
throw typed `AppError`s with feature-specific messages; the Prisma mapping is
the safety net for races, not the primary UX.

Never expose:

- Stack traces
- SQL errors
- Internal implementation details

---

# Pagination Standard

Every listing API must support pagination.

```text
?page=1
&limit=10
```

Response:

```json
{
  "page": 1,
  "limit": 10,
  "total": 150,
  "totalPages": 15
}
```

---

# Filtering

Support filtering whenever applicable.

Example:

```text
?status=ACTIVE
?category=Technology
?type=Premium
?isActive=true
```

---

# Searching

Support searching through query parameters.

Example:

```text
?search=laptop
?search=john
```

---

# Sorting

Support sorting wherever applicable.

```text
?sortBy=name
&sortOrder=asc
```

or

```text
?sortBy=createdAt
&sortOrder=desc
```

---

# Validation Standards

Every request must be validated.

Validate:

- Required fields
- Data types
- Length
- Min / Max values
- Enums
- UUIDs
- Arrays
- Nested Objects
- Dates
- Numbers
- Booleans

Invalid requests should never reach the service layer.

---

# Logging

Every API should generate logs.

Include:

- HTTP Method
- Endpoint
- Request Time
- Response Time
- Status Code
- Error Details (if applicable)

Logs should remain structured and readable.

---

# Swagger Documentation

Every API must be documented.

Include:

- Summary
- Description
- Tags
- Parameters
- Request Body
- Success Response
- Error Response
- Sample Payloads

Swagger should always match the implementation.

---

# Performance Guidelines

When creating APIs:

- Fetch only required fields.
- Avoid duplicate queries.
- Reuse repository methods.
- Minimize database calls.
- Use pagination.
- Optimize filtering.
- Optimize searching.
- Batch operations whenever possible.
- Move long-running operations to background workers.

---

# Code Quality Standards

Follow:

- Clean Architecture
- SOLID Principles
- DRY
- KISS
- Single Responsibility Principle

Code should be:

- Readable
- Reusable
- Maintainable
- Scalable

---

# Testing Checklist

Before completing an API:

- Validation works
- Success response works
- Error response works
- Pagination works
- Filtering works
- Searching works
- Sorting works
- Logs are generated
- Swagger updated
- No duplicate code
- Repository methods are reusable

---

# API Development Checklist

Before marking an API as complete:

- [ ] Folder structure followed
- [ ] Controller is lightweight
- [ ] Business logic is inside Service
- [ ] Database logic is inside Repository
- [ ] DTO created
- [ ] Validation implemented
- [ ] Standard response format used
- [ ] Global error handling implemented
- [ ] Pagination implemented (if required)
- [ ] Filtering implemented (if required)
- [ ] Searching implemented (if required)
- [ ] Sorting implemented (if required)
- [ ] Logging implemented
- [ ] Swagger updated
- [ ] Performance reviewed
- [ ] No duplicate code
- [ ] Code is clean and readable

---

# Mandatory Rules

Every time a new API is requested:

1. Read this document before starting.
2. Follow the workflow from top to bottom.
3. Never skip architecture layers.
4. Keep controllers lightweight.
5. Place all business logic inside services.
6. Place all database operations inside repositories.
7. Validate every incoming request.
8. Return the standard API response.
9. Use the global error handler.
10. Implement pagination, filtering, searching, and sorting where applicable.
11. Update Swagger before considering the API complete.
12. Generate proper logs.
13. Write clean, reusable, maintainable code.
14. Ensure consistency with the rest of the project.

---

# Configuration & Environment

- All configuration is read once in `config/env.ts` with validation and
  defaults — features import `env`, never `process.env` directly.
- Commerce knobs (tax rate, shipping flat rate, free-shipping threshold)
  currently live in env; migrate to an admin-editable settings table when the
  settings feature lands (see BUSINESS_LOGIC_AUDIT.md BL-17).
- No secrets, keys, or environment-specific values hardcoded in source.

---

# Soft Delete Convention

- Models that support soft delete carry `isDeleted` (+ `deletedAt`).
- Default queries exclude soft-deleted rows; admin endpoints may opt in via
  an explicit `includeDeleted` flag.
- Soft delete must never hide a record from a user who has a legitimate
  ongoing claim to it (e.g. a customer's placed order).

---

# Final Principle

> Every API added to this project must look and behave as if it was written by the same developer. Consistency, maintainability, scalability, readability, and proper architecture are more important than simply making the API work.