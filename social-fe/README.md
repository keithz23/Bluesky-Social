# Konekt Frontend

Next.js web application for Konekt. It contains the public social experience, authentication screens, profile and feed surfaces, chat, notifications, settings, and the admin dashboard.

## Runtime

- Next.js 16 with the App Router
- React 19
- TypeScript
- Tailwind CSS
- TanStack Query
- Zustand
- Socket.IO client

## Structure

```text
app/
|-- (auth)/              # login, signup, password recovery
|-- (main)/              # social app pages
|-- admin/               # admin login, dashboard, services, hooks
|-- components/          # app-specific UI
|-- hooks/               # frontend hooks
|-- interfaces/          # UI-local types and API type re-exports
|-- services/            # API clients
|-- store/               # Zustand stores
`-- utils/               # frontend utilities

components/ui/           # shared UI primitives
lib/                     # axios, query helpers, utility setup
providers/               # app-level providers
public/                  # static assets
```

API-facing types should come from `@social/api-contracts`. Local interface files may re-export those contracts to keep existing imports stable. UI-only types can stay local under `app/interfaces`.

## Setup

```bash
npm ci
```

Create `social-fe/.env.development` when running locally:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_SERVER_URL=http://localhost:8000
```

## Development

```bash
npm run dev
```

Open `http://localhost:3000`. Make sure the backend is running at `http://localhost:8000`.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Run the Next.js dev server with Turbopack |
| `npm run build` | Create a production build |
| `npm run start` | Start the production server |
| `npm run lint` | Run ESLint |
| `npm run format` | Format the frontend project |
| `npm run format:check` | Check formatting |
| `./node_modules/.bin/tsc -p tsconfig.json --noEmit` | Typecheck without building |

## Shared Contracts

The frontend resolves `@social/api-contracts` through `tsconfig.json` and transpiles it through `next.config.ts`.

After editing shared contracts, run from the repository root:

```bash
npm run build:contracts
```

Then validate the frontend:

```bash
./node_modules/.bin/tsc -p tsconfig.json --noEmit
npm run build
```
