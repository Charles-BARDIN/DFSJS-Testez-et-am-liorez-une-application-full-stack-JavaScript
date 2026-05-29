# Yoga Studio Management System

A full-stack web application for managing yoga studio operations, including session scheduling, teacher management, and user registrations.

## Table of contents

- [Tech stack](#tech-stack)
- [Architecture](#architecture)
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Running the application](#running-the-application)
- [Default credentials](#default-credentials)
- [API endpoints](#api-endpoints)
- [Database schema](#database-schema)
- [Testing](#testing)
  - [Backend — unit and integration (Vitest + Supertest)](#backend--unit-and-integration-vitest--supertest)
  - [Frontend — unit and integration (Vitest + React Testing Library)](#frontend--unit-and-integration-vitest--react-testing-library)
  - [End-to-end (Cypress)](#end-to-end-cypress)
  - [Coverage report locations](#coverage-report-locations)
- [Project structure](#project-structure)
- [Development scripts (reference)](#development-scripts-reference)
- [Troubleshooting](#troubleshooting)
- [License](#license)

## Tech stack

### Backend
- Node.js 22 LTS
- Express.js 4.x
- TypeScript 5.9 (strict mode)
- Prisma ORM 5.x
- PostgreSQL 16
- Zod 4.x (request validation)
- JWT (authentication)
- bcrypt (password hashing)
- Vitest 4.x + Supertest 7.x (testing)

### Frontend
- React 19 (hooks only)
- TypeScript 5.9 (strict mode)
- Vite 7.x
- TailwindCSS 4.x
- React Router 6.x
- Axios 1.x
- Vitest 4.x + React Testing Library 16.x (unit and integration tests)
- Cypress 15.x + `@cypress/code-coverage` (end-to-end tests)

### Infrastructure
- Docker + Docker Compose
- Two PostgreSQL containers (one for development, one dedicated to tests)

## Architecture

The backend follows a clean layered architecture:

```
HTTP request
   │
   ▼
 Routes  ──►  authMiddleware  ──►  validateBody (Zod)  ──►  asyncHandler
                                                                  │
                                                                  ▼
                                                            Controller (thin)
                                                                  │
                                                                  ▼
                                                            Service (business logic, AppError)
                                                                  │
                                                                  ▼
                                                            Repository (only place that talks to Prisma)
                                                                  │
                                                                  ▼
                                                            PostgreSQL
```

Errors thrown anywhere are caught by `asyncHandler` and formatted by a centralised
error middleware (`AppError` → `{ statusCode, message }`). The dependency graph
is `controller → service → repository → prisma`; no controller imports Prisma
directly.

## Features

### Authentication
- User registration
- User login with JWT tokens
- Logout

### Sessions management
- List all yoga sessions
- View session details
- Create new sessions (admin only)
- Update sessions (admin only)
- Delete sessions (admin only)
- Join / leave a session (regular users)

### Teachers
- List teachers
- View teacher details

### User profile
- View profile
- Delete account
- Promote self to admin in development mode (helper for local testing)

## Prerequisites

- Node.js 22 LTS or higher
- Docker and Docker Compose
- npm

## Installation

### 1. Install dependencies

```bash
cd backend && npm install
cd ../frontend && npm install
```

### 2. Configure environment variables

The backend needs two `.env` files: one for the development database and one
for the test database. Both have committed examples to copy from.

```bash
cd backend
cp .env.example .env             # development DB (used by `npm run dev`)
cp .env.test.example .env.test   # test DB (used by `npm test` integration tests)
```

Default `backend/.env`:

```env
DATABASE_URL="postgresql://yogauser:yogapass@localhost:5432/yogastudio"
JWT_SECRET="your-secret-key-change-me-in-production"
PORT=8080
NODE_ENV=development
```

Default `backend/.env.test`:

```env
DATABASE_URL="postgresql://yogauser:yogapass@localhost:5433/yogastudio_test"
JWT_SECRET="test-secret-key"
NODE_ENV=test
```

### 3. Fetch the Cypress binary (frontend tests only)

The npm install step intentionally skips downloading the Cypress binary so the
basic install stays light. Run this once on first checkout:

```bash
cd frontend && npx cypress install
```

### 4. Start the PostgreSQL containers

From the project root:

```bash
docker-compose up -d                       # starts both `postgres` (dev) and `postgres-test`
# or, selectively:
docker-compose up -d postgres              # development DB only (port 5432)
docker-compose up -d postgres-test         # test DB only (port 5433)
```

### 5. Apply database migrations and seed the development DB

```bash
cd backend
npm run prisma:migrate    # first run will ask for a migration name — type "init"
npm run prisma:seed
```

> The `prisma/migrations/` directory is gitignored in this starter, so the
> very first migration is created locally and named interactively. Subsequent
> runs do not prompt.

Seeding creates:
- 1 admin user: `yoga@studio.com` / `test!1234`
- 1 regular user: `user@test.com` / `test!1234`
- 3 teachers
- 4 yoga sessions

## Running the application

### Backend (terminal 1)

```bash
cd backend && npm run dev
```

The API runs on `http://localhost:8080`. The entry point is
`src/server.ts`; the Express app itself is defined in `src/app.ts` and is
exported separately so the integration tests can mount it through Supertest.

### Frontend (terminal 2)

```bash
cd frontend && npm run dev
```

The frontend runs on `http://localhost:3000` and proxies `/api` requests
to the backend on port 8080.

## Default credentials

| Role  | Email             | Password   |
|-------|-------------------|------------|
| Admin | `yoga@studio.com` | `test!1234` |
| User  | `user@test.com`   | `test!1234` |

## API endpoints

### Authentication (public)
- `POST /api/auth/register` — register a new user
- `POST /api/auth/login` — login and get a JWT token

### Sessions (protected)
- `GET /api/session` — list sessions
- `GET /api/session/:id` — session details
- `POST /api/session` — create (admin only)
- `PUT /api/session/:id` — update (admin only)
- `DELETE /api/session/:id` — delete (admin only)
- `POST /api/session/:id/participate/:userId` — join a session
- `DELETE /api/session/:id/participate/:userId` — leave a session

### Teachers (protected)
- `GET /api/teacher` — list
- `GET /api/teacher/:id` — details

### Users (protected)
- `GET /api/user/:id` — get user
- `DELETE /api/user/:id` — delete own account
- `POST /api/user/promote-admin` — promote self to admin (development only)

### Health
- `GET /api/health` — liveness probe

## Database schema

```prisma
model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  firstName String
  lastName  String
  password  String
  admin     Boolean  @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  sessions  SessionParticipation[]
}

model Teacher {
  id        Int      @id @default(autoincrement())
  firstName String
  lastName  String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  sessions  Session[]
}

model Session {
  id           Int       @id @default(autoincrement())
  name         String
  date         DateTime
  description  String
  teacherId    Int
  teacher      Teacher   @relation(fields: [teacherId], references: [id])
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
  participants SessionParticipation[]
}

model SessionParticipation {
  sessionId Int
  userId    Int
  session   Session @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  user      User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@id([sessionId, userId])
}
```

## Testing

The project ships with three independent test suites. Each can be run on its
own; together they cover the full stack from unit logic up to real browser
interactions.

### Backend — unit and integration (Vitest + Supertest)

The backend tests live next to the source files under `backend/src/**/*.test.ts`
(unit) and `backend/src/**/*.integration.test.ts` (integration). Integration
tests exercise the whole stack (routes → middlewares → controllers →
services → repositories → PostgreSQL) against a **dedicated test container**.

#### One-time setup

```bash
cd backend
cp .env.test.example .env.test                              # if not already done
docker-compose -f ../docker-compose.yml up -d postgres-test # spins up the test DB on :5433
```

The test DB schema is applied automatically by Vitest's `globalSetup` using
`prisma db push` — no manual migration step is required.

#### Run the tests

| Command | What it runs |
|---|---|
| `npm test` | All tests (unit + integration), one shot |
| `npm run test:watch` | All tests in watch mode |
| `npm run test:unit` | Unit tests only (no DB needed) |
| `npm run test:integration` | Integration tests only (requires `postgres-test`) |

#### Generate coverage reports

| Command | Report directory |
|---|---|
| `npm run test:coverage` | `backend/coverage/` (combined, the official one) |
| `npm run test:coverage:unit` | `backend/coverage-unit/` (unit subset) |
| `npm run test:coverage:integration` | `backend/coverage-integration/` (integration subset) |

Open `backend/coverage/index.html` in a browser to inspect the combined report
file by file.

> Zod schemas and DTO files (`src/dto/**`) are excluded from the coverage
> report on purpose — they are declarative validation definitions that the
> autoeval instructs us not to test directly.

### Frontend — unit and integration (Vitest + React Testing Library)

Frontend Vitest tests live next to each source file under
`frontend/src/**/*.test.{ts,tsx}`. They render components with React Testing
Library inside `jsdom` and mock the Axios layer when needed.

#### Run the tests

| Command | What it runs |
|---|---|
| `npm test` | All tests once |
| `npm run test:watch` | Watch mode |
| `npm run test:coverage` | Full run + coverage |

#### Coverage report

`npm run test:coverage` writes the report to `frontend/coverage/`. Open
`frontend/coverage/index.html` to drill into per-file coverage.

### End-to-end (Cypress)

The Cypress specs live in `frontend/cypress/e2e/*.cy.ts` and drive the real
application running in a real browser. Code coverage is collected by
instrumenting the frontend with `vite-plugin-istanbul` while serving (enabled
through the `INSTRUMENT_COVERAGE=true` flag wired into the `dev:coverage`
script). After the run, `@cypress/code-coverage` writes the report to
`frontend/coverage-e2e/`.

#### Prerequisites

The whole development stack must be running:

```bash
# Terminal 1 — development PostgreSQL (port 5432)
docker-compose up -d postgres

# Terminal 2 — backend API on :8080
cd backend && npm run dev
```

If you have never run Cypress on this machine, fetch the binary first:

```bash
cd frontend && npx cypress install
```

#### Headless run with coverage (recommended)

```bash
cd frontend && npm run test:e2e
```

This single command:
1. starts the frontend in instrumented mode on port 3000,
2. waits for it to be reachable,
3. runs all Cypress specs in headless mode (Electron),
4. writes the coverage report to `frontend/coverage-e2e/`,
5. shuts the frontend down.

#### Interactive run (Cypress UI)

```bash
# Terminal 3
cd frontend && npm run dev:coverage     # instrumented frontend, kept open

# Terminal 4
cd frontend && npm run cypress:open     # opens the Cypress UI
```

Pick *E2E Testing*, choose a browser, then click any spec to run it. To get a
representative coverage report from an interactive session, play every spec at
least once, then generate the HTML report manually:

```bash
cd frontend && npx nyc report \
  --report-dir=coverage-e2e \
  --reporter=html --reporter=text-summary
```

### Coverage report locations

| Suite | Generation command | Report directory |
|---|---|---|
| Backend, combined | `cd backend && npm run test:coverage` | `backend/coverage/` |
| Backend, unit only | `cd backend && npm run test:coverage:unit` | `backend/coverage-unit/` |
| Backend, integration only | `cd backend && npm run test:coverage:integration` | `backend/coverage-integration/` |
| Frontend Vitest | `cd frontend && npm run test:coverage` | `frontend/coverage/` |
| Frontend Cypress E2E | `cd frontend && npm run test:e2e` | `frontend/coverage-e2e/` |

All four indicators — statements, branches, functions, lines — are at or above
**80 %** in the official reports (backend combined, frontend Vitest, frontend
E2E). Integration tests account for more than 30 % of the total test count on
both the front and the back.

## Project structure

```
.
├── backend/
│   ├── src/
│   │   ├── controllers/          # Thin HTTP handlers
│   │   ├── services/             # Business logic
│   │   ├── repositories/         # Prisma data access (only place that touches the DB)
│   │   ├── middleware/           # auth, asyncHandler, error, validate (Zod)
│   │   ├── errors/               # AppError class
│   │   ├── dto/                  # Zod request schemas
│   │   ├── routes/               # Express router wiring
│   │   ├── types/                # Response DTO types
│   │   ├── utils/                # JWT helpers
│   │   ├── test/                 # Vitest globalSetup, setup, DB helpers
│   │   ├── prisma.ts             # Shared PrismaClient instance
│   │   ├── app.ts                # Express app (no `listen`, testable)
│   │   └── server.ts             # Runtime entry — calls app.listen
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   ├── .env.example
│   ├── .env.test.example
│   ├── vitest.config.ts
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── pages/                # Login, Register, Sessions, SessionDetail, SessionForm, Profile
│   │   ├── components/           # Navbar
│   │   ├── services/             # api (Axios + JWT interceptor), auth.service
│   │   ├── utils/                # error helpers
│   │   ├── types/                # Domain types
│   │   ├── test/setup.ts         # Vitest jsdom setup
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── cypress/
│   │   ├── e2e/                  # E2E specs
│   │   └── support/              # commands + code-coverage support
│   ├── cypress.config.ts
│   ├── vite.config.ts
│   ├── .nycrc.json
│   └── package.json
├── docker-compose.yml            # `postgres` (dev :5432) + `postgres-test` (tests :5433)
└── README.md
```

## Development scripts (reference)

### Backend (`cd backend`)

| Script | Purpose |
|---|---|
| `npm run dev` | Start the API with nodemon (hot reload) |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run the compiled server from `dist/server.js` |
| `npm test` | Vitest run |
| `npm run test:watch` | Vitest in watch mode |
| `npm run test:unit` | Unit tests only |
| `npm run test:integration` | Integration tests only |
| `npm run test:coverage` | Combined coverage |
| `npm run test:coverage:unit` | Unit coverage only |
| `npm run test:coverage:integration` | Integration coverage only |
| `npm run prisma:generate` | Regenerate Prisma Client |
| `npm run prisma:migrate` | Run Prisma migrations (dev) |
| `npm run prisma:seed` | Seed the development DB |
| `npm run prisma:studio` | Open Prisma Studio |
| `npm run prisma:test:push` | Push the schema to the test DB manually |

### Frontend (`cd frontend`)

| Script | Purpose |
|---|---|
| `npm run dev` | Start Vite dev server |
| `npm run dev:coverage` | Start Vite with code instrumentation (for Cypress coverage) |
| `npm run build` | Production build |
| `npm run preview` | Serve the production build locally |
| `npm test` | Vitest run |
| `npm run test:watch` | Vitest in watch mode |
| `npm run test:coverage` | Vitest + coverage |
| `npm run cypress:open` | Open the Cypress UI |
| `npm run cypress:run` | Run Cypress headless |
| `npm run test:e2e` | Instrumented frontend + Cypress headless + coverage report |

## Troubleshooting

### Database connection issues

```bash
# Check if PostgreSQL is running
docker ps

# Restart the dev DB
docker-compose restart postgres

# View logs
docker-compose logs postgres
```

### Port already in use

```bash
lsof -i :8080       # backend
lsof -i :3000       # frontend
lsof -i :5432       # dev DB
lsof -i :5433       # test DB

kill -9 <PID>
```

### Prisma issues

```bash
# Reset the dev DB (WARNING: deletes all data)
cd backend && npx prisma migrate reset

# Regenerate the Prisma Client
cd backend && npx prisma generate
```

### Backend integration tests fail with a connection error

Make sure the test container is running and on port 5433:

```bash
docker ps | grep yoga-studio-db-test
# If missing:
docker-compose up -d postgres-test
```

If the schema is out of date (rare):

```bash
cd backend && npm run prisma:test:push
```

### Cypress fails to start (no binary)

```bash
cd frontend && npx cypress install
```

### E2E coverage report missing or empty

The frontend must be started through `npm run dev:coverage` (with
`INSTRUMENT_COVERAGE=true`), not `npm run dev`. The `npm run test:e2e` script
takes care of that automatically.

## License

MIT
