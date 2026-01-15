# Bright - Project Structure

This document provides an overview of the project's file and folder organization.

---

## Root Directory Structure

```
Bright/
├── dist/                      # Compiled TypeScript output (generated)
├── docs/                      # Project documentation
│   ├── choices.md            # Architecture decisions
│   ├── docker-setup.md       # Docker setup guide
│   ├── local-setup.md        # Local development guide
│   └── spec.md               # API specification
├── node_modules/             # npm dependencies (generated)
├── prisma/                   # Database schema and migrations
│   ├── migrations/           # Database migration files
│   └── schema.prisma         # Prisma schema definition
├── src/                      # Source code
│   ├── controllers/          # HTTP request handlers
│   ├── dtos/                 # Data Transfer Objects
│   ├── modules/              # Feature modules
│   ├── services/             # Business logic
│   ├── utils/                # Utility functions
│   ├── app.controller.spec.ts
│   ├── app.controller.ts
│   ├── app.module.ts         # Root application module
│   ├── app.service.ts
│   └── main.ts               # Application entry point
├── test/                     # Test files
├── .env                      # Environment variables (local)
├── .env.docker               # Environment variables (Docker)
├── .gitignore                # Git ignore rules
├── .prettierrc               # Prettier configuration
├── docker-compose.yml        # Docker Compose configuration
├── Dockerfile                # Docker image definition
├── nest-cli.json             # NestJS CLI configuration
├── package.json              # npm dependencies and scripts
├── package-lock.json         # Locked dependency versions
├── README.md                 # Project documentation
├── tsconfig.json             # TypeScript configuration
└── tsconfig.build.json       # TypeScript build configuration
```

---

## Source Code Structure (`src/`)

### Controllers (`src/controllers/`)

HTTP request handlers that define API endpoints.

```
src/controllers/
├── auth/                     # Authentication endpoints
│   └── auth.controller.ts    # POST /auth/register, /auth/login
└── user/                     # User management endpoints
    └── user.controller.ts    # GET/PATCH /users/:userId
```

**Purpose:** Handle incoming HTTP requests, validate input, and delegate to services.

---

### DTOs (`src/dtos/`)

Data Transfer Objects for request/response validation.

```
src/dtos/
├── auth/
│   ├── register.dto.ts       # Registration request validation
│   └── login.dto.ts          # Login request validation
├── user/
│   ├── update-user.dto.ts    # User update validation
│   └── user-response.dto.ts  # User response structure
└── health-data/
    ├── ingest-health-data.dto.ts
    ├── query-health-data.dto.ts
    └── summary-query.dto.ts
```

**Purpose:** Define request/response structure with validation rules using `class-validator`.

---

### Modules (`src/modules/`)

Feature-based NestJS modules that encapsulate related functionality.

```
src/modules/
├── auth/                     # Authentication module
│   ├── auth.module.ts        # Module definition
│   ├── auth.service.ts       # Auth business logic
│   ├── auth.controller.ts    # Auth endpoints
│   ├── jwt.strategy.ts       # JWT authentication strategy
│   └── guards/
│       └── jwt-auth.guard.ts # JWT guard for protected routes
├── prisma/                   # Database module
│   ├── prisma.module.ts      # Module definition
│   └── prisma.service.ts     # Prisma client wrapper
└── user/                     # User management module
    ├── user.module.ts        # Module definition
    ├── user.service.ts       # User business logic
    └── user.controller.ts    # User endpoints
```

**Purpose:** Organize code by feature, each module is self-contained with its own controllers, services, and providers.

---

### Services (`src/services/`)

Business logic layer that handles data processing and database operations.

```
src/services/
├── auth/
│   └── auth.service.ts       # User registration, login, JWT generation
├── prisma/
│   └── prisma.service.ts     # Database connection and lifecycle
└── user/
    └── user.service.ts       # User CRUD operations, health data management
```

**Purpose:** Implement business logic, interact with database, and provide reusable functionality.

---

### Utilities (`src/utils/`)

Helper functions and shared utilities.

```
src/utils/
├── date.utils.ts             # Date parsing and formatting
├── validation.utils.ts       # Custom validation helpers
└── merge.utils.ts            # Health data merging logic
```

**Purpose:** Provide reusable utility functions across the application.

---

### Core Files

```
src/
├── main.ts                   # Application bootstrap
│                             # - Configure port from environment
│                             # - Enable CORS
│                             # - Set up Swagger
│                             # - Start NestJS application
│
├── app.module.ts             # Root module
│                             # - Import feature modules
│                             # - Configure global providers
│
├── app.controller.ts         # Root controller
│                             # - Health check endpoint
│
└── app.service.ts            # Root service
                              # - Application-level logic
```

---

## Database (`prisma/`)

```
prisma/
├── schema.prisma             # Database schema definition
│                             # - User model
│                             # - HealthData model
│                             # - Relationships and indexes
│
└── migrations/               # Version-controlled schema changes
    ├── 20240101_init/
    ├── 20240102_add_health_data/
    └── migration_lock.toml
```

**Key Models:**

- **User**: User accounts with authentication
- **HealthData**: Health metrics from various sources
- **Relations**: User → HealthData (one-to-many)

---

## Documentation (`docs/`)

```
docs/
├── spec.md                   # API specification and requirements
├── choices.md                # Architecture and technology decisions
├── local-setup.md            # Local development setup guide
└── docker-setup.md           # Docker and Cloud Run deployment guide
```

---

## Configuration Files

### Environment Files

```
.env                          # Local development environment variables
.env.docker                   # Docker environment variables
```

**Contains:**
- Database connection strings
- JWT secrets
- Application port
- Node environment

### Docker Files

```
docker-compose.yml            # Local PostgreSQL setup
Dockerfile                    # Production container definition
.dockerignore                 # Files to exclude from Docker build
```

### TypeScript Configuration

```
tsconfig.json                 # Base TypeScript configuration
tsconfig.build.json           # Build-specific TypeScript config
```

### NestJS Configuration

```
nest-cli.json                 # NestJS CLI settings
                              # - Source root
                              # - Compiler options
```

### Code Quality

```
.prettierrc                   # Code formatting rules
.gitignore                    # Git exclusion rules
```

---

## Module Architecture

### Authentication Flow

```
Client Request
    ↓
auth.controller.ts (POST /auth/register or /auth/login)
    ↓
auth.service.ts (validate credentials, hash password, generate JWT)
    ↓
prisma.service.ts (database operations)
    ↓
Database (PostgreSQL)
```

### Protected Endpoint Flow

```
Client Request (with JWT)
    ↓
jwt-auth.guard.ts (validate JWT token)
    ↓
user.controller.ts (GET /users/:userId)
    ↓
user.service.ts (fetch user data)
    ↓
prisma.service.ts (database query)
    ↓
Database (PostgreSQL)
```

### Health Data Ingestion Flow

```
Client Request (with health data JSON)
    ↓
health-data.controller.ts (POST /users/:userId/health-data)
    ↓
ingest-health-data.dto.ts (validate structure)
    ↓
health-data.service.ts (parse, deduplicate, merge)
    ↓
prisma.service.ts (bulk insert)
    ↓
Database (PostgreSQL)
```

---

## Key Design Patterns

### 1. Module Pattern
Each feature is encapsulated in its own module with controllers, services, and DTOs.

### 2. Dependency Injection
NestJS automatically injects dependencies (services, repositories) into controllers and other services.

### 3. Repository Pattern
Prisma service acts as a repository layer, abstracting database operations.

### 4. DTO Pattern
All API inputs/outputs are validated using DTOs with class-validator decorators.

### 5. Guard Pattern
JWT authentication is handled by guards that protect routes.

---

## Build and Output

### Development Build

```
npm run start:dev
```

- Uses `ts-node` to run TypeScript directly
- Hot-reload on file changes
- Source maps enabled

### Production Build

```
npm run build
```

Output directory:

```
dist/
├── controllers/
├── dtos/
├── modules/
├── services/
├── utils/
├── main.js
└── app.module.js
```

- Compiled JavaScript files
- Optimized for production
- Source maps (optional)

---

## Testing Structure

```
test/
├── unit/                     # Unit tests
│   ├── auth.service.spec.ts
│   └── user.service.spec.ts
├── integration/              # Integration tests
│   └── health-data.spec.ts
└── e2e/                      # End-to-end tests
    └── app.e2e-spec.ts
```

**Test Commands:**
```bash
npm test                      # Run all unit tests
npm run test:watch            # Watch mode
npm run test:e2e              # End-to-end tests
npm run test:cov              # Coverage report
```
---

## Environment-Specific Configuration

### Local Development
- Uses `.env` file
- PostgreSQL in Docker via `docker-compose.yml`
- Hot-reload enabled
- Swagger available at `/docs`

### Production (Cloud Run)
- Uses `.env.docker` or Secret Manager
- Cloud SQL for PostgreSQL
- Compiled JavaScript in `dist/`
- No hot-reload

---

## Summary

The project follows a **modular, feature-based architecture** with clear separation of concerns:

- **Controllers** handle HTTP requests
- **Services** contain business logic
- **DTOs** validate input/output
- **Modules** group related features
- **Prisma** manages database operations

This structure makes the codebase:
- ✅ **Scalable** - Easy to add new features
- ✅ **Testable** - Clear boundaries for unit testing
- ✅ **Maintainable** - Organized by feature
- ✅ **Type-safe** - TypeScript throughout
