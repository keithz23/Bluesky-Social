# Social

A full-stack social networking application with a Next.js frontend and a NestJS backend. The app includes authentication, profiles, posts, replies, feeds, follows, lists, notifications, real-time chat, bookmarks, moderation, and account security flows such as email/password changes and account deactivation with email OTP verification.

## Tech Stack

- Frontend: Next.js 16, React 19, TypeScript, Tailwind CSS, TanStack Query, Zustand, Socket.IO client
- Backend: NestJS 11, TypeScript, Prisma, PostgreSQL, Redis, BullMQ, Socket.IO
- Infrastructure: Docker Compose, Nginx, PostgreSQL, Redis
- Storage and mail integrations: S3-compatible object storage, Nodemailer

## AWS Deployment Flow

![AWS ECS production baseline flow](assets/flowchart.png)

> Note: The current AWS deployment is a production baseline designed around AWS Free Tier oriented resources. It is suitable for validating the deployment flow and small-scale usage, but it is not yet a high-scale or highly available production architecture.

## Repository Structure

```text
.
├── docker-compose.yml      # Production-style stack using published images
├── nginx.conf              # Reverse proxy configuration
├── social-be/              # NestJS API, Prisma schema, workers, sockets
└── social-fe/              # Next.js app
```

## Features

- Email/password authentication and Google OAuth
- HTTP-only cookie based access and refresh tokens
- Email verification, forgot password, password change with OTP
- Profile editing with avatar and cover uploads
- Posts, replies, likes, reposts, bookmarks, feeds, and search
- Follows, follow requests, user suggestions, and lists
- Real-time chat and notifications with Socket.IO
- Report/moderation endpoints
- Account settings for email, password, handle, birthday, and deactivation
- Audit logging for sensitive account actions

## Prerequisites

- Node.js 22+ for the backend
- Node.js 20+ for the frontend
- PostgreSQL 15+
- Redis
- npm
- Docker and Docker Compose, optional but recommended for local infrastructure

## Environment Variables

Create environment files before running the apps.

### Backend: `social-be/.env`

```env
NODE_ENV=development
PORT=8000
API_PREFIX=api/v1

DATABASE_URL=postgresql://postgres:postgres@localhost:5432/social
POSTGRES_DB=social
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres

REDIS_HOST=localhost
REDIS_PORT=6380
REDIS_URL=redis://localhost:6380

JWT_SECRET=change-me
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=change-me-too
JWT_REFRESH_EXPIRES_IN=7d
BCRYPT_SALT_ROUNDS=12

CLIENT_URL=http://localhost:3000
SERVER_URL=http://localhost:8000
CORS_ORIGIN=http://localhost:3000
CORS_CREDENTIALS=true

MAIL_HOST=
MAIL_PORT=
MAIL_USER=
MAIL_PASSWORD=
MAIL_FROM=
MAIL_SECURE=false

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=http://localhost:8000/api/v1/auth/google/callback

AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=
AWS_BUCKET_NAME=
AWS_ENDPOINT=
CLOUDFRONT_DOMAIN=
```

For the current AWS Free Tier oriented deployment, the backend uses ElastiCache with TLS enabled and disables the Socket.IO Redis adapter:

```env
REDIS_TLS=true
REDIS_BULL_PREFIX={bull}
SOCKET_REDIS_ADAPTER_ENABLED=false
```

- `REDIS_TLS=true` enables TLS for AWS ElastiCache connections.
- `REDIS_BULL_PREFIX={bull}` keeps BullMQ keys in the same Redis cluster hash slot.
- `SOCKET_REDIS_ADAPTER_ENABLED=false` avoids `PSUBSCRIBE`, which is not supported by ElastiCache Serverless. Redis is still used for cache, OTP storage, and BullMQ queues. With this adapter disabled, Socket.IO is intended for a single backend task; use a compatible Redis/Valkey setup before scaling realtime sockets across multiple backend tasks.

### Frontend: `social-fe/.env`

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_SERVER_URL=http://localhost:8000
```

## Local Development

### 1. Start PostgreSQL and Redis

You can run infrastructure from the backend compose file:

```bash
cd social-be
docker compose up -d db redis
```

Redis is exposed on `localhost:6380` and PostgreSQL on `localhost:5432`.

### 2. Install dependencies

```bash
cd social-be
npm install

cd ../social-fe
npm install
```

### 3. Prepare the database

```bash
cd social-be
npx prisma migrate deploy
```

For local schema iteration, use Prisma commands such as:

```bash
npx prisma migrate dev
npx prisma studio
```

### 4. Run the backend

```bash
cd social-be
npm run start:dev
```

The API uses the configured `PORT` and `API_PREFIX`. With the example env above:

- API: `http://localhost:8000/api/v1`
- Swagger: `http://localhost:8000/api/docs`

### 5. Run the frontend

```bash
cd social-fe
npm run dev
```

Open `http://localhost:3000`.

## Docker

The root `docker-compose.yml` is production-oriented and uses published images:

```bash
docker compose up -d
```

It starts:

- `social-fe` on port `3000`
- `social-app` on port `8000`
- `social-db` on port `5432`
- `social-redis` on port `6380`
- `social-nginx` on ports `80` and `443`

For local backend development with source-mounted containers, use:

```bash
cd social-be
docker compose up -d
```

## Useful Commands

Backend:

```bash
cd social-be
npm run start:dev
npm run build
npm run test
npm run test:e2e
npm run lint
```

Frontend:

```bash
cd social-fe
npm run dev
npm run build
npm run lint
```

Prisma:

```bash
cd social-be
npx prisma migrate dev
npx prisma migrate deploy
npx prisma studio
```

## API Notes

- Auth routes are mounted under `/api/v1/auth` when `API_PREFIX=api/v1`.
- Access and refresh tokens are stored in HTTP-only cookies.
- Refresh tokens are persisted in PostgreSQL and revoked on sensitive changes such as password change, email change, and account deactivation.
- Account deactivation uses an email OTP confirmation flow.
- Sockets are exposed through namespaces such as `/socket`, `/chat`, and `/notifications`.

## Development Notes

- The backend uses Prisma migrations from `social-be/prisma/migrations`.
- Redis is used for cache, OTP storage, queues, and Socket.IO scaling.
- Mail templates live in `social-be/src/mail/templates`.
- Frontend API calls are centralized in `social-fe/app/services`.
- Frontend server state is handled with TanStack Query; auth state is stored with Zustand.

## Verification

Before opening a pull request, run:

```bash
cd social-be
npm run build

cd ../social-fe
npm run lint
npm run build
```

## License

This project is private and currently marked as `UNLICENSED`.
