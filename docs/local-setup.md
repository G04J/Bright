# Local Installation and Development Setup Guide

This guide will walk you through:

- Installing required tools locally
- Setting up environment variables
- Running PostgreSQL locally or via Docker
- Running Prisma migrations
- Starting the NestJS API
- Useful development commands
- Debugging common local issues

## 1. Prerequisites

Make sure the following tools are installed on your system.

**Required:**
- Node.js 18 or newer
- npm 9 or newer
- Git
- PostgreSQL 14 or newer

**Optional but recommended:**
- Docker Desktop (used only for PostgreSQL if you do not want to install it locally)

Verify installations:

```bash
node --version
npm --version
psql --version
git --version
```

## 2. Clone the repository

```bash
git clone <your-repo-url>
cd Bright
```

Install dependencies:

```bash
npm install
```

## 3. Environment variables

The application uses environment variables for database connection, JWT authentication, and server configuration.

**Create .env file (project root):**

```env
PORT=3000
NODE_ENV=development

JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRES_IN=1d

DATABASE_URL=postgresql://bright:password123@localhost:5432/bright?schema=public
```

**Important notes:**
- Use `localhost` for local development.
- Use the same database name and credentials you create in PostgreSQL.

## 4. PostgreSQL setup

### Option A: PostgreSQL installed locally

Start PostgreSQL and create database and user:

```bash
psql postgres
```

```sql
CREATE DATABASE bright;
CREATE USER bright WITH PASSWORD 'password123';
ALTER ROLE bright SET client_encoding TO 'utf8';
ALTER ROLE bright SET default_transaction_isolation TO 'read committed';
ALTER ROLE bright SET timezone TO 'UTC';
GRANT ALL PRIVILEGES ON DATABASE bright TO bright;
```

Exit psql:

```
\q
```

### Option B: PostgreSQL via Docker (recommended)

If you prefer not to install PostgreSQL locally:

```bash
docker run --name bright-postgres \
  -e POSTGRES_USER=bright \
  -e POSTGRES_PASSWORD=password123 \
  -e POSTGRES_DB=bright \
  -p 5432:5432 \
  -d postgres:16
```

Confirm it is running:

```bash
docker ps
```

## 5. Prisma setup

Generate Prisma client:

```bash
npx prisma generate
```

Run database migrations:

```bash
npx prisma migrate dev
```

If Prisma reports schema drift and you are in development:

```bash
npx prisma migrate reset
```

## 6. Start the application locally

### Development mode (recommended)

```bash
npm run start:dev
```

You should see:

```
Nest application successfully started
```

## 7. Accessing the application

- **API base URL:** http://localhost:3000
- **Swagger documentation:** http://localhost:3000/docs

Swagger can be used to:
- Register and login users
- Test authenticated endpoints
- Ingest health data
- Retrieve merged data and summaries

## 8. Running tests

Run all unit tests:

```bash
npm test
```

Run tests in watch mode:

```bash
npm run test:watch
```

## 9. Common local development commands

**Restart the dev server:**

```
rs
```

**Regenerate Prisma client after schema change:**

```bash
npx prisma generate
```

**Format Prisma schema:**

```bash
npx prisma format
```

**Inspect database via Prisma Studio:**

```bash
npx prisma studio
```

## 10. Debugging common local issues

### A) Port already in use (EADDRINUSE)

**Error example:**

```
Error: listen EADDRINUSE: address already in use :::3000
```

**Fix:**
- Stop the process using port 3000
- Or change the port in `.env`

**macOS or Linux:**

```bash
lsof -i :3000
kill -9 <PID>
```

### B) Prisma cannot connect to database (P1001)

**Error example:**

```
Error: P1001: Can't reach database server at `localhost:5432`
```

**Fix:**
- Ensure PostgreSQL is running
- Verify `DATABASE_URL` in `.env`
- Ensure the database and user exist

### C) Authentication errors (401 Unauthorized)

**Fix checklist:**
- Ensure you are passing the JWT token as:
  ```
  Authorization: Bearer <token>
  ```
- Ensure the token is not expired
- Ensure the `userId` in the URL matches the token subject

### D) Swagger shows no input fields

**Cause:**
- Missing validation decorators in DTOs

**Fix:**
- Ensure DTO properties use `@IsString()`, `@IsOptional()`, etc.
- Optionally add `@ApiProperty()` decorators for clarity

## 11. Resetting the local environment

To fully reset the database and migrations:

```bash
npx prisma migrate reset
```

To reset Docker PostgreSQL (if used):

```bash
docker stop bright-postgres
docker rm bright-postgres
docker volume prune
```

## 12. Quick health check

Verify the API is reachable:

```bash
curl http://localhost:3000/docs
```

You should receive an HTML page for Swagger UI.