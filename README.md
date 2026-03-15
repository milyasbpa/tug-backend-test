# Wellness Package Management — Backend API

Backend service for the TUG Technical Assessment. Built with NestJS + TypeScript, serving both the Admin Portal and Mobile App for managing wellness packages.

## Tech Stack

| Layer | Choice | Reason |
|-------|--------|--------|
| Framework | NestJS 11 | Modular, opinionated, production-ready |
| Language | TypeScript (strict mode) | Type safety, better DX |
| Database | PostgreSQL | Better standards compliance vs MySQL |
| ORM | Prisma | Type-safe client, superior migration tooling vs TypeORM |
| Validation | Zod + nestjs-zod | Schema = type automatically, Swagger auto-docs |
| Auth | JWT (access + refresh token) | Stateless, scalable |
| Docs | Swagger / OpenAPI | Auto-generated from decorators |
| Logging | Winston | Structured logs, file rotation |
| Containerization | Docker Compose | Reproducible local environment |

## Project Structure

```
src/
├── common/
│   ├── constants/       # Error codes
│   ├── decorators/      # @CurrentUser, @Public, @Roles, @ApiPaginatedResponse
│   ├── dto/             # Shared DTOs (PaginationDto)
│   ├── exceptions/      # Custom business exceptions
│   ├── filters/         # GlobalExceptionFilter (handles Prisma + Zod errors)
│   ├── interceptors/    # TransformInterceptor (standard response), LoggingInterceptor
│   ├── interfaces/      # ApiResponse<T>, PaginatedResponse<T>
│   └── pipes/           # ParseUUIDPipe
├── config/              # app, database, jwt, redis configs (validated with Zod)
├── database/            # PrismaModule, PrismaService, seeds
├── modules/
│   ├── auth/            # register, login, refresh, logout, me
│   └── packages/        # CRUD wellness packages (admin + mobile)
├── app.module.ts
└── main.ts              # Bootstrap: Swagger, global pipes/filters/interceptors
```

## System Design

```mermaid
graph TB
    subgraph Clients["Clients"]
        AP["Admin Portal\n(React / Next.js)\n:3000"]
        MA["Mobile App\n(Flutter)"]
    end

    subgraph Docker["Docker Compose"]
        PG[("PostgreSQL\n:5432")]
    end

    subgraph NestJS["NestJS Application :4000"]
        subgraph Bootstrap["main.ts — Bootstrap"]
            SW["Swagger UI\n/api/docs"]
            GP["Global Prefix /api · Versioning /v1"]
        end

        subgraph GlobalStack["Global Middleware Stack"]
            GEF["GlobalExceptionFilter"]
            LI["LoggingInterceptor"]
            TI["TransformInterceptor\n{ success, data, timestamp }"]
            ZVP["ZodValidationPipe"]
            JAG["JwtAuthGuard (global)"]
            RG["RolesGuard (global)"]
        end

        subgraph AppModule["AppModule"]
            subgraph ConfigModule["ConfigModule"]
                AC["app.config.ts — Zod env validation"]
                JC["jwt.config.ts"]
                DC["database.config.ts"]
            end

            subgraph AuthModule["AuthModule"]
                AuthCtrl["AuthController\n/auth/*"]
                AuthSvc["AuthService"]
                LS["LocalStrategy\npassport-local"]
                JWS["JwtStrategy\npassport-jwt"]
                JWRS["JwtRefreshStrategy"]
            end

            subgraph PackagesModule["PackagesModule"]
                AdminCtrl["AdminPackagesController\n/admin/packages"]
                MobileCtrl["MobilePackagesController\n/mobile/packages"]
                PkgSvc["PackagesService"]
            end

            subgraph PrismaModule["PrismaModule (Global)"]
                PS["PrismaService\n@prisma/adapter-pg"]
            end
        end

        subgraph Common["Common"]
            PUUID["ParseUUIDPipe"]
            Decs["@CurrentUser · @Public · @Roles"]
            BE["BusinessException"]
        end
    end

    AP -->|"HTTP REST · Bearer Token"| NestJS
    MA -->|"HTTP REST · Bearer Token"| NestJS
    PS -->|"pg adapter"| PG

    AuthCtrl --> AuthSvc
    AuthSvc --> PS
    AuthSvc --> JC
    AdminCtrl --> PkgSvc
    MobileCtrl --> PkgSvc
    PkgSvc --> PS
    JAG --> JWS
    LS --> AuthSvc
```

## API Design

All endpoints are prefixed with `/api/v1`.

### Auth

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/v1/auth/register` | Public | Register new user |
| POST | `/api/v1/auth/login` | Public | Login, returns access + refresh token |
| POST | `/api/v1/auth/refresh` | Refresh Token | Get new access token |
| POST | `/api/v1/auth/logout` | Bearer | Revoke refresh token |
| GET | `/api/v1/auth/me` | Bearer | Get current user profile |

### Admin — Wellness Packages

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/admin/packages` | ADMIN role | List all packages |
| POST | `/api/v1/admin/packages` | ADMIN role | Create new package |
| PUT | `/api/v1/admin/packages/:id` | ADMIN role | Update package |
| DELETE | `/api/v1/admin/packages/:id` | ADMIN role | Delete package |

### Mobile — Wellness Packages

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/mobile/packages` | Bearer | List packages (paginated) |

### Pagination, Search & Sort

Both list endpoints (`GET /admin/packages` and `GET /mobile/packages`) support the following query parameters:

| Param | Type | Default | Options / Max | Description |
|-------|------|---------|---------------|-------------|
| `page` | integer | `1` | — | Page number (1-based) |
| `limit` | integer | `10` | max `100` | Items per page |
| `search` | string | — | — | Case-insensitive search on `name` and `description` |
| `sortBy` | string | `createdAt` | `name` \| `price` \| `durationMinutes` \| `createdAt` | Field to sort by |
| `sortOrder` | string | `desc` | `asc` \| `desc` | Sort direction |

Paginated responses have the following shape inside `data`:

```json
{
  "success": true,
  "data": {
    "data": [ { "id": "...", "name": "...", "..." } ],
    "meta": {
      "total": 42,
      "page": 1,
      "limit": 10,
      "totalPages": 5
    }
  },
  "timestamp": "2026-03-14T10:00:00.000Z"
}
```

### Standard Response Format

All responses are wrapped by `TransformInterceptor`:

```json
{
  "success": true,
  "data": { "..." },
  "timestamp": "2026-03-14T10:00:00.000Z"
}
```

Error responses follow the same envelope:

```json
{
  "success": false,
  "statusCode": 404,
  "message": "Wellness package not found",
  "timestamp": "2026-03-14T10:00:00.000Z"
}
```

## Prerequisites

- Node.js >= 20.0.0
- npm >= 10.0.0
- Docker & Docker Compose

## Setup & Running

### 1. Clone & Install

```bash
git clone <repo-url>
cd backend
npm install
```

### 2. Environment

```bash
cp .env.example .env.development
# Edit .env.development — at minimum set DATABASE_URL and JWT_SECRET
```

### 3. Start Database

```bash
docker-compose up -d
```

### 4. Run Migrations & Seed

```bash
npm run migration:dev   # apply migrations
npm run seed            # seed admin user + sample packages (skips if data exists)
npm run reseed          # delete existing packages then reseed (useful for re-init)
```

Default credentials (from seed):

- Admin — `admin@example.com` / `admin123`
- User — `user@example.com` / `user123`

### 5. Start Dev Server

```bash
npm run start:dev
```

- Server: `http://localhost:4000`
- Swagger: `http://localhost:4000/api/docs`

## Running Tests

### Unit Tests

```bash
npm test
```

### E2E Tests

E2E tests run against a separate test database. Set it up once before running:

```bash
# 1. Create .env.test with a dedicated test DB URL
cp .env.example .env.test
# Edit .env.test — set DATABASE_URL to your test database

# 2. Apply migrations to test DB (run once, or after adding new migrations)
NODE_ENV=test npx prisma migrate deploy

# 3. Run E2E tests
npm run test:e2e
```

> The E2E suite creates its own admin user during setup and cleans up created packages after each run.

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run start:dev` | Run in watch mode |
| `npm run build` | Compile to `dist/` |
| `npm run start:prod` | Run production build |
| `npm run lint` | Lint & auto-fix |
| `npm run format` | Format with Prettier |
| `npm test` | Unit tests |
| `npm run test:cov` | Unit tests with coverage |
| `npm run test:e2e` | End-to-end tests (requires `.env.test`) |
| `npm run migration:dev` | Create & apply migration |
| `npm run migration:deploy` | Apply migrations (staging/prod) |
| `npm run seed` | Seed admin user + sample packages (skips if data exists) |
| `npm run reseed` | Delete existing packages and reseed with fresh data |

## Request & Auth Flow

```mermaid
flowchart TD
    A([HTTP Request]) --> B[GlobalExceptionFilter]
    B --> C[LoggingInterceptor]
    C --> D[TransformInterceptor]
    D --> E[ZodValidationPipe]
    E --> F{JwtAuthGuard}

    F -- "@Public() endpoint" --> G[Route Handler]
    F -- "No / invalid token" --> F1[401 Unauthorized]
    F -- "Valid token" --> H{RolesGuard}

    H -- "No @Roles() required" --> G
    H -- "@Roles(ADMIN), user is USER" --> H1[403 Forbidden]
    H -- "Role matches" --> G

    G --> I{Route}

    I -- "POST /auth/register" --> R1[Check email duplicate]
    R1 -- "Email exists" --> R1E[409 Conflict]
    R1 -- "New email" --> R2[Hash password bcrypt x12]
    R2 --> R3[Create user in DB]
    R3 --> RT[Issue access + refresh tokens]

    I -- "POST /auth/login" --> L1[LocalStrategy: validate credentials]
    L1 -- "Invalid" --> L1E[401 Unauthorized]
    L1 -- "Valid" --> RT

    I -- "POST /auth/refresh" --> RF1[JwtRefreshGuard: verify refresh JWT]
    RF1 -- "Invalid / expired" --> RF1E[401 Unauthorized]
    RF1 -- "Valid" --> RF2[Compare token vs bcrypt hash in DB]
    RF2 -- "No match" --> RF2E[401 Unauthorized]
    RF2 -- "Match" --> RT

    RT --> RT2[Hash refresh token, update DB]
    RT2 --> RES

    I -- "POST /auth/logout" --> LO1[Clear refreshTokenHash in DB]
    LO1 --> RES

    I -- "GET /auth/me" --> ME1[findUnique user by id]
    ME1 --> RES

    I -- "GET /admin/packages\nGET /mobile/packages" --> P1[PackagesService.findAll]
    P1 --> P1A[Build WHERE search filter]
    P1A --> P1B[Query DB with pagination + sort]
    P1B --> P1C[Serialize Decimal price to number]
    P1C --> RES

    I -- "POST /admin/packages" --> P2[ZodValidationPipe: validate body]
    P2 -- "Invalid" --> P2E[422 Unprocessable Entity]
    P2 -- "Valid" --> P2A[prisma.wellnessPackage.create]
    P2A --> P2B[Serialize price]
    P2B --> RES

    I -- "PUT /admin/packages/:id" --> P3[ParseUUIDPipe: validate id]
    P3 -- "Invalid UUID" --> P3E[400 Bad Request]
    P3 -- "Valid UUID" --> P3A[findOne — check exists]
    P3A -- "Not found" --> P3B[404 Not Found]
    P3A -- "Found" --> P3C[prisma.wellnessPackage.update]
    P3C --> P3D[Serialize price]
    P3D --> RES

    I -- "DELETE /admin/packages/:id" --> P4[ParseUUIDPipe: validate id]
    P4 -- "Invalid UUID" --> P4E[400 Bad Request]
    P4 -- "Valid UUID" --> P4A[findOne — check exists]
    P4A -- "Not found" --> P4B[404 Not Found]
    P4A -- "Found" --> P4C[prisma.wellnessPackage.delete]
    P4C --> P4D[Serialize price]
    P4D --> RES

    RES(["TransformInterceptor wraps response: success, data, timestamp"])
```

All endpoints are protected by `JwtAuthGuard` globally.
Use `@Public()` to opt-out, `@Roles(Role.ADMIN)` to restrict to admins.

## Architectural Decisions

**PostgreSQL over MySQL** — Better standards compliance, native UUID support. The assessment mentions MySQL as an example only; PostgreSQL is a drop-in superior alternative.

**Prisma over TypeORM** — Auto-generated type-safe client eliminates runtime errors from query typos. Migration system is explicit and version-controlled. Schema is the single source of truth.

**Zod over class-validator** — Schema doubles as TypeScript type automatically, no need to maintain separate validation decorators and type declarations. Integrates with Swagger via `nestjs-zod`.

**Refresh token stored as bcrypt hash** — Plain refresh tokens are never stored. Even if the database is compromised, tokens cannot be reused.

**Global guards with opt-out pattern** — All endpoints require authentication by default. Public endpoints explicitly declare `@Public()`. This is safer than opt-in auth where a missing guard silently exposes an endpoint.

## Assumptions

- Wellness packages are not soft-deleted (hard delete on `DELETE`)
- Any authenticated user (not just ADMIN) can read packages via the mobile endpoint
- Price is stored as `Decimal(10,2)` to avoid floating-point precision issues
- Package list endpoints are paginated (default: page 1, limit 10, max 100 per page)
