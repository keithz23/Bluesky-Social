# Konekt Backend

NestJS API for Konekt. It owns authentication, users, posts, feeds, chat, notifications, moderation, admin workflows, Prisma persistence, Socket.IO gateways, and BullMQ workers.

## Runtime

- NestJS 11
- TypeScript
- Prisma and PostgreSQL
- Redis and BullMQ
- Socket.IO
- Swagger in non-production environments

## Module Conventions

API modules keep request and response boundaries explicit:

```text
src/modules/<module>/
|-- <module>.controller.ts
|-- <module>.service.ts          # facade when the module has multiple workflows
|-- services/                    # command/query/use-case services
`-- dto/
    |-- requests/                # validation DTO classes
    |-- responses/               # response DTOs or shared contract type exports
    `-- shared/                  # local shared DTO pieces
```

Large services should be split by responsibility, matching the current `auth`, `posts`, `chat`, `feed`, `lists`, and `follows` modules.

Shared FE/BE API shapes come from `@social/api-contracts` through the root workspace package at `../packages/api-contracts`.

## Setup

```bash
npm ci
cp .env.example .env
docker compose up -d db redis
npx prisma migrate deploy
```

For schema work, use:

```bash
npx prisma migrate dev
npx prisma studio
```

## Development

```bash
npm run start:dev
```

The API runs on `http://localhost:8000` by default. The versioned API prefix is `http://localhost:8000/api/v1`, and Swagger is available at `http://localhost:8000/api/docs` when `NODE_ENV` is not `production`.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run start:dev` | Run Nest in watch mode |
| `npm run build` | Compile the API |
| `npm run start:prod` | Run compiled output |
| `npm test` | Run unit tests |
| `npm run test:e2e` | Run E2E tests |
| `npm run test:cov` | Run tests with coverage |
| `npm run lint` | Run ESLint with fixes |
| `npm run format` | Format backend source and tests |
| `npm run seed` | Run migrations and seed base data |
| `npm run seed:rbac` | Seed RBAC data |
| `npm run seed:realistic` | Seed realistic demo data |
| `npm run seed:perf` | Seed performance test data |

## Docker

```bash
docker compose up --build
```

The backend Compose stack starts the API, PostgreSQL, and Redis. The API derives `DATABASE_URL` from `POSTGRES_*` values inside the container so passwords with URL-reserved characters are encoded correctly.

If local database credentials change and the existing local data is disposable:

```bash
docker compose down -v
docker compose up --build
```

## Contract Checks

From the repository root:

```bash
npm run build:contracts
```

From this directory:

```bash
npm run build
npm test
```
