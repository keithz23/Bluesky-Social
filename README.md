# Bluesky Social

A production-minded social networking platform built with Next.js and NestJS. It supports social interactions, real-time conversations, moderation workflows, and account-security features in a Docker-ready architecture.

## Highlights

- **Social graph and content:** profiles, posts, replies, likes, reposts, bookmarks, follows, private accounts, lists, search, and personalized feeds.
- **Real-time experience:** chat, presence, typing indicators, and notifications through Socket.IO.
- **Security:** HTTP-only access and refresh cookies, JWT authentication, Google OAuth, email OTP flows, 2FA, RBAC, Redis-backed token-bucket rate limiting, and audit logs.
- **Administration:** dashboard analytics, user/content/report management, role and permission management, moderation rules, and system settings.
- **Operations:** Prisma migrations, Redis cache and BullMQ queues, Docker Compose, Nginx, CI/CD workflows, and AWS infrastructure definitions.

## Architecture

```text
Browser
  │
  ├── Next.js frontend (social-fe :3000)
  │       │ HTTP + Socket.IO
  │       ▼
  └── NestJS API (social-be :8000)
          ├── PostgreSQL / Prisma  - persistent application data
          ├── Redis / BullMQ       - cache, OTPs, queues, rate limiting
          ├── Socket.IO            - chat and notifications
          └── S3-compatible store  - media uploads
```

## Tech Stack

| Area | Technologies |
| --- | --- |
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS, TanStack Query, Zustand |
| Backend | NestJS 11, TypeScript, Prisma, Socket.IO, BullMQ |
| Data | PostgreSQL 15, Redis |
| Infrastructure | Docker Compose, Nginx, AWS ECS/Fargate, ALB, RDS, ElastiCache, S3 |

## Repository Structure

```text
.
├── social-fe/             # Next.js web application
├── social-be/             # NestJS API, Prisma schema, workers, gateways
├── infra/                 # Terraform for staging and production environments
├── docker-compose.yml     # Production-style stack using published images
└── nginx.conf             # Reverse proxy configuration
```

## Prerequisites

- Node.js 20+ and npm
- Docker Engine with Docker Compose (recommended)

## Local Development

### 1. Configure the backend

Create a local environment file from the tracked template:

```bash
cp social-be/.env.example social-be/.env
```

Update the secrets and optional mail, OAuth, and object-storage values before using those integrations. Do not commit `.env` files.

### 2. Start PostgreSQL and Redis

```bash
cd social-be
docker compose up -d db redis
```

PostgreSQL is available at `localhost:5432`; Redis is available at `localhost:6380`.

### 3. Install dependencies and migrate the database

```bash
cd social-be
npm ci
npx prisma migrate deploy

cd ../social-fe
npm ci
```

For local schema changes, use `npx prisma migrate dev`; use `npx prisma studio` to inspect data.

### 4. Configure and run the frontend

Create `social-fe/.env.development` if it does not exist:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_SERVER_URL=http://localhost:8000
```

Start each application in a separate terminal:

```bash
# Terminal 1
cd social-be && npm run start:dev

# Terminal 2
cd social-fe && npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The API is at `http://localhost:8000/api/v1` and Swagger is at `http://localhost:8000/api/docs`.

## Run the API with Docker

The backend Compose stack runs the API, PostgreSQL, and Redis together:

```bash
cd social-be
docker compose up --build
```

On startup, the API waits for healthy database/cache services, runs Prisma migrations, and starts on port `8000`.

### Database authentication and persisted volumes

PostgreSQL uses `POSTGRES_USER`, `POSTGRES_PASSWORD`, and `POSTGRES_DB` **only when its named volume is created for the first time**. Changing these values after `postgres-data` already exists does not update the database user/password and causes Prisma error `P1000`.

The Compose services now derive `DATABASE_URL` inside the API container from those same `POSTGRES_*` values and URL-encode the password. This prevents authentication failures when a password contains URL-reserved characters such as `@`, `:`, `/`, or `#`.

If you intentionally changed the local database credentials and do not need the existing local data, recreate only the local Compose volumes:

```bash
cd social-be
docker compose down -v
docker compose up --build
```

> `docker compose down -v` deletes the local PostgreSQL and Redis data for this stack. Back up any data you need first. If you need to preserve data, restore the original credentials instead.

## Production-Style Stack

The root Compose file uses published frontend/backend images and includes Nginx:

```bash
docker compose up -d
```

Create a root `.env` with the deployment-specific variables, including `GITHUB_SHA`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `REDIS_PASSWORD`, JWT secrets, and the `NEXT_PUBLIC_*` URLs. The API derives its database URL at runtime; it should not rely on a manually assembled `DATABASE_URL`.

## Useful Commands

| Component | Command |
| --- | --- |
| Backend build | `cd social-be && npm run build` |
| Backend tests | `cd social-be && npm test` |
| Backend E2E tests | `cd social-be && npm run test:e2e` |
| Backend lint | `cd social-be && npm run lint` |
| Frontend build | `cd social-fe && npm run build` |
| Frontend lint | `cd social-fe && npm run lint` |
| Prisma Studio | `cd social-be && npx prisma studio` |

## Deployment

The repository includes GitHub Actions workflows and Terraform environments under `infra/envs`:

- `infra/envs/staging` provisions a Docker-based staging environment.
- `infra/envs/production` provisions AWS resources for the ECS/Fargate deployment path.

See the environment-specific README files for Terraform inputs and deployment details.

## Verification

Before opening a pull request, run:

```bash
cd social-be && npm run build && npm test
cd ../social-fe && npm run lint && npm run build
```
