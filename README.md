# MiniBankAPI

MiniBankAPI is a Node.js + TypeScript REST API built incrementally in epics.

**Epic 1** establishes the platform foundation and implements the Accounts module with:

- Centralized error handling
- Structured request + error logging
- Input validation using Zod
- MySQL integration using Prisma ORM
- Clean layered architecture (routes → controller → service → db)



---

# Tech Stack

- Node.js
- TypeScript
- Express (v5)
- MySQL
- Prisma ORM (no migrations in Epic 1)
- Zod (validation)
- Jest + Supertest (testing)
- SonarQube (static code analysis)

---

# Project Structure

```
MiniBankAPI/
│
├── src/
│   ├── app.ts
│   ├── server.ts
│   ├── config/
│   │   └── env.ts
│   ├── db/
│   │   └── prismaClient.ts
│   ├── routes/
│   │   ├── health.routes.ts
│   │   └── accountRouter.ts
│   ├── controller/
│   │   └── accountController.ts
│   ├── service/
│   │   └── accountService.ts
│   ├── validation/
│   │   └── accountSchemas.ts
│   ├── middleware/
│   │   ├── traceId.ts
│   │   ├── requestLogger.ts
│   │   ├── validate.ts
│   │   └── errorHandler.ts
│   └── utils/
│       ├── error.ts
│       ├── logger.ts
│       └── serializeAccount.ts
│
├── postman/
│   ├── epic1.json
│   └── local_env.json
│
├── tests/
├── package.json
├── tsconfig.json
├── README.md
└── .env.example
```

---

# Setup Instructions

## 1. Install dependencies

```bash
npm install
```

---

## 2. Configure Environment Variables

Create a `.env` file in the project root:

```env
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=your_password
MYSQL_DB=minibank
MYSQL_PORT=3306

PORT=3000
NODE_ENV=development
```

### Environment Variables Explained

| Variable | Description |
|----------|-------------|
| MYSQL_HOST | MySQL server hostname |
| MYSQL_USER | MySQL username |
| MYSQL_PASSWORD | MySQL password |
| MYSQL_DB | Database name |
| MYSQL_PORT | MySQL port |
| PORT | Application port |
| NODE_ENV | Environment (development / production) |

> Do not commit `.env` to version control.

---

# Database Setup (Epic 1)

Since migrations are excluded in Epic 1:

1. Manually create database:

```sql
CREATE DATABASE minibank;
```

2. Ensure required tables exist according to Prisma schema.



---

# Running the Application

## Development Mode

```bash
npm run dev
```

## Build

```bash
npm run build
```

## Start Production Build

```bash
npm run start
```

Application runs at:

```
http://localhost:3000
```

---

# Logging

## Request Logging Includes:

- traceId (generated per request)
- HTTP method
- path
- status code
- duration (ms)

Implemented via:

- `traceIdMiddleware`
- `requestLoggerMiddleware`

---

## Error Logging Includes:

- traceId
- error code
- HTTP status
- request path
- request method

Handled inside `errorHandler.ts`.

---

## Security Logging Rules

The following are NEVER logged:

- passwords
- tokens
- authorization headers
- raw request bodies

Only safe metadata is logged.

---

# Centralized Error Handling

All errors follow a consistent response structure:

```json
{
  "traceId": "uuid",
  "code": "ERROR_CODE",
  "message": "Human readable message",
  "details": {}
}
```

## How It Works

1. Controllers throw or forward `AppError`
2. `notFoundHandler` converts unknown routes to 404
3. `errorHandler` normalizes all errors
4. Response is returned in standard format

Available error helpers:

- BadRequestError
- NotFoundError
- ConflictError
- UnauthorizedError
- InternalServerError

---

# Validation (Zod)

Zod schemas validate:

- Route params
- Query parameters
- Request body

Validation failures return:

- `400 VALIDATION_ERROR`
- Includes `details.issues[]`

PUT `/accounts/:id` enforces strict allowlist validation.

---

# API Endpoints (Epic 1)

## Health

### GET /health

Returns service health status.

---

## Accounts

### POST /accounts

Create a new account.

### GET /accounts?customerId={id}

List accounts for a customer.

### GET /accounts/:id

Get account by ID.

### PUT /accounts/:id

Update account (allowed fields only).

### POST /accounts/:id/close

Close account.

---

# Postman Collection (Epic 1)

Postman files are located in:

```
postman/
```

## Files

- `epic1.json`
- `local_env.json`

---

## How to Import

1. Open Postman
2. Click **Import**
3. Import both:
   - Collection file
   - Environment file
4. Select environment: **MiniBankAPI - Local**

---

## Environment Variables

| Variable | Purpose |
|-----------|----------|
| baseUrl | API base URL (e.g., http://localhost:3000) |
| customerId | Used for GET /accounts |
| accountId | Used for GET/PUT/CLOSE |

---

## Running Collection

1. Start server (`npm run dev`)
2. Select environment
3. Run requests in order:
   - Health
   - Create Account
   - Get Accounts
   - Get Account
   - Update Account
   - Close Account

---

## Automated ID Capture (Recommended)

In "Create Account" request → Tests tab:

```javascript
let jsonData = pm.response.json();
pm.environment.set("accountId", jsonData.id);
```

This automatically saves the created account ID for subsequent requests.

---


# Running Tests

Run all tests:

```bash
npx jest
```

<!-- Run with coverage:

```bash
npm run test:coverage
``` -->

Tests include:
- Unit tests
- Integration tests 

---

<!-- # Running Sonar Scan

## Configure `sonar-project.properties`

Example:

```
sonar.projectKey=minibankapi
sonar.projectName=MiniBankAPI
sonar.sources=src
sonar.tests=tests
sonar.typescript.lcov.reportPaths=coverage/lcov.info
```

## Run Sonar Scanner

```bash
sonar-scanner
```

Or if configured via npm:

```bash
npm run sonar
```

--- -->

# Epic 1 Completion Checklist

| Requirement | Status |
|-------------|--------|
| Express foundation | ✅ |
| Logging implemented | ✅ |
| Centralized error handling | ✅ |
| Zod validation | ✅ |
| Accounts endpoints | ✅ |
| .env documented | ✅ |
| Tests | In progress |
| Sonar integration | Configurable |

---

# Next Epic

Epic 2 will introduce:

- Transactions
- Balance updates
- Idempotency handling
- Increased test coverage

---

# Author

MiniBankAPI – Backend Engineering Project (Epic-based implementation).
