## Agenda
1. Integer → UUID Migration
2. Redis Session Implementation
3. Epic 2 — Transactions
4. Unit/Integration Test

---

## 1. Integer → UUID Migration

### What Changed
We migrated all primary keys and foreign keys from auto-increment integers (BIGINT) to UUIDs (CHAR(36)) across the entire project.

### Why UUIDs?
- **Security**: Sequential IDs (1, 2, 3) are predictable — an attacker can guess other resource IDs. UUIDs are random and unguessable.
- **No information leakage**: `account/3` tells you there are roughly 3 accounts. `account/550e8400-...` reveals nothing.



### Before → After (Prisma Schema)
```
BEFORE:  id  BIGINT UNSIGNED  @id @default(autoincrement())
AFTER:   id  String           @id @default(uuid()) @db.Char(36)
```

---

## 2. Redis Session Implementation

### What Changed
Replaced direct JWT Bearer token authentication with Redis-backed session management.



### Architecture Flow

```
LOGIN FLOW:
┌──────────┐     POST /auth/login      ┌──────────┐
│          │  ───────────────────────> │          │     
│  Client  │                           │  Server  │
│          │  <──── { sessionId }───── │          │
└──────────┘                           └─────┬────┘
                                             │
                                    Signs JWT (never sent to client)
                                    Generates random sessionId (UUID)
                                             │
                                             ▼
                                       ┌──────────┐
                                       │  Redis   │
                                       │          │
                                       │ SET      │
                                       │ session: │
                                       │ <uuid>   │
                                       │ = JWT    │
                                       │ TTL:900s │
                                       └──────────┘


AUTHENTICATED REQUEST FLOW:
┌──────────┐  GET /transactions         ┌──────────┐
│          │  Header: x-session-id      │          │
│  Client  │  ────────────────────────> │  Server  │
│          │                            │          │
│          │  <──── 200 { data } ────── │          │
└──────────┘                            └─────┬────┘
                                              │
                                     requireAuth() middleware:
                                     1. Read x-session-id header
                                     2. GET session:<id> from Redis
                                     3. Verify JWT
                                     4. Attach user to request
                                              │
                                              ▼
                                        ┌──────────┐
                                        │  Redis   │
                                        │          │
                                        │ GET      │
                                        │ session: │
                                        │ <uuid>   │
                                        │ → JWT    │
                                        └──────────┘


SESSION EXPIRY (automatic):
Time 0:00   → Login, Redis stores session (TTL: 900s)
Time 5:00   → Request works (TTL: 595s remaining)
Time 15:01  → Redis auto-deletes key
Time 15:02  → Request fails → 401 Unauthorized
```

### Key Files
- `src/redis/redisClient.ts` — Redis client connection, connect/disconnect functions
- `src/auth/authService.ts` — Login now stores JWT in Redis, returns sessionId
- `src/auth/authMiddleware.ts` — Reads x-session-id header, looks up JWT from Redis
- `src/lifecycle.ts` — Graceful shutdown closes Redis connection
- `src/server.ts` — Connects to Redis before starting Express

### Infrastructure
- Redis runs in a Docker container: `docker run --name redis-dev -p 6379:6379 redis`
- Connection URL: `redis://localhost:6379`



---

## 3. Epic 2 — Transactions (Ledger) + Derived Balance

### What We Built
A full transaction system for recording deposits (CREDIT) and withdrawals (DEBIT) with atomic balance updates, pagination, filtering, and an account summary endpoint.

### New Endpoints

```
POST   /transactions                              → Create transaction
GET    /transactions?account_id=...&limit=&offset= → List with pagination/filters
GET    /transactions/:id                          → Get single transaction
GET    /accounts/:id/summary                      → Account summary + recent activity
```

### Database Model (Prisma)

```
Transaction
├── id                   String (UUID)
├── account_id           String (FK → accounts)
├── type                 Enum: DEBIT | CREDIT
├── amount               Decimal(12,2)
├── description          String? (max 255)
├── category             String? (max 100)
├── related_transfer_id  String? (for Epic 3)
├── created_at           DateTime
│
├── @@index([account_id])
└── @@index([related_transfer_id])

Key design decisions:
- No updated_at: Transactions are immutable ledger entries
- amount always positive: type (DEBIT/CREDIT) determines direction
- Decimal not Float: Prevents floating-point rounding errors (0.1 + 0.2 ≠ 0.3)
- related_transfer_id: Nullable, prepped for Epic 3 transfers
```

### Architecture (follows existing pattern)

```
Request Flow:

Client
  │
  ▼
transactionRouter.ts
  │  requireAuth()          → Validates session via Redis
  │  validate(schema)       → Zod validates body/query/params
  │  
  │
  ▼
transactionController.ts
  │  Extracts validated data from req.validated
  │  Calls service layer
  │
  ▼
transactionService.ts
  │  Business logic
  │  prisma.$transaction()
  │  Structured logging via mapper functions
  │
  ▼
prismaClient → MySQL
```

### Critical Feature: Atomic Balance Update (POST /transactions)

This is the most important piece. When creating a transaction, FOUR things happen inside a single database transaction:

```
prisma.$transaction(async (tx) => {

  Step 1: FETCH account
          → 404 if not found

  Step 2: VALIDATE account is ACTIVE
          → 409 if closed

  Step 3: CALCULATE new balance
          CREDIT: balance + amount
          DEBIT:  balance - amount
          → 409 if DEBIT causes overdraft (balance < 0)

  Step 4: CREATE transaction record + UPDATE account balance
          Both happen atomically

  If ANY step fails → entire transaction rolls back
  No partial state possible
})
```

### Pagination & Filtering (GET /transactions)

```
GET /transactions?account_id=...         → All transactions for account
GET /transactions?...&limit=10&offset=0  → First 10 results
GET /transactions?...&type=CREDIT        → Only deposits
GET /transactions?...&from=2026-03-01T00:00:00Z&to=2026-03-31T23:59:59Z
                                         → Date range filter

Results always ordered newest first (created_at DESC)
Default: limit=20, offset=0
```

### Account Summary (GET /accounts/:id/summary)

Returns a snapshot of the account with recent activity:
```json
{
  "account_id": "...",
  "balance": "450",
  "currency": "USD",
  "status": "ACTIVE",
  "total_credits": 1,
  "total_debits": 1,
  "recent_transactions": [
    { "id": "...", "type": "DEBIT",  "amount": "50",  "description": "ATM withdrawal" },
    { "id": "...", "type": "CREDIT", "amount": "500", "description": "Initial deposit" }
  ]
}
```

---

### What's Next
- Epic 3: Transfers between accounts (atomic two-sided transactions)
