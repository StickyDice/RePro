# RePro — Resource Management SaaS Platform

Multitenant SaaS platform for companies to manage internal resources and rentals. Built according to [docs/plan/detailed-development-plan.md](docs/plan/detailed-development-plan.md).

## Stack

- **Frontend**: Next.js 16, shadcn/ui, Tailwind CSS, Formik, Zod, FSD architecture
- **Backend**: Nest.js, Prisma, PostgreSQL
- **Auth & DB admin**: Supabase Auth; data in PostgreSQL (same database as Prisma). [Supabase Studio](https://supabase.com/docs/guides/local-development/overview) is used for SQL, table browser, and auth users when you run the bundled self-hosted stack.

## Quick start

### Prerequisites

- Node.js 20+
- pnpm
- Either **Docker** (recommended for a one-command stack) or a **Supabase Cloud** project / **Supabase CLI** on the host

### Option A — Docker Compose (app + self-hosted Supabase)

Root `docker-compose.yml` **includes** the upstream Supabase Docker stack (`docker/supabase/compose.yaml`) plus RePro **backend** and **frontend**. You get Postgres, Kong, Auth, Studio, REST, and the rest of the default services.

1. **Environment**

   ```bash
   cp .env.example .env
   ```

   Edit `.env` at the **repository root**. It must define all variables expected by `docker/supabase/compose.yaml` (JWT secrets, `ANON_KEY`, `SERVICE_ROLE_KEY`, Logflare tokens, pooler settings, etc.). The example file uses **demo** JWT keys suitable only for local development.

2. **Run**

   ```bash
   pnpm docker:up
   ```

   This copies `.env.example` → `.env` when `.env` is missing or empty, then runs `docker compose up --build`. You can use plain `docker compose` instead **only after** `cp .env.example .env` (Compose substitutes `${VAR}` from `.env` for the whole stack; without it, `supabase-db` stays unhealthy).

   If you previously ran an older compose file with a standalone `postgres` service, free the old pooler port and drop orphan containers:

   ```bash
   docker compose down --remove-orphans
   pnpm docker:up
   ```

   If the DB container stays unhealthy after a failed first start (e.g. empty env left bad data), reset the local data directory and try again:

   ```bash
   docker compose down
   rm -rf docker/supabase/volumes/db/data
   pnpm docker:up
   ```

3. **URLs**

   | What | URL |
   |------|-----|
   | RePro app | http://localhost:3000 |
   | RePro API | http://localhost:4000 |
   | Supabase API (Kong) & Studio entry | `SUPABASE_PUBLIC_URL` (default http://localhost:54321) |
   | Postgres from host (Supavisor) | `localhost:54322` (see `POSTGRES_HOST_PORT` in `.env`) |

   Open Studio in the browser at the same base URL as the Supabase API. Kong will prompt for **HTTP basic auth** using `DASHBOARD_USERNAME` and `DASHBOARD_PASSWORD` from `.env`. The dashboard also links to Studio (“Supabase Studio (database & auth)”).

4. **Data directory**

   Postgres files are stored under `docker/supabase/volumes/db/data` (ignored by git).

### Option B — Local development with pnpm (no Docker for the app)

Use this when you run the API and Next dev server on the host and either use **Supabase Cloud** or **`pnpm dlx supabase start`** for Auth/Postgres.

#### 1. Install dependencies

```bash
pnpm install
```

#### 2. Backend

```bash
cd services/backend
cp .env.example .env
```

Edit `services/backend/.env`: set `DATABASE_URL`, `DIRECT_URL`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and `PLATFORM_ADMIN_EMAILS`. See comments in `.env.example` for Cloud vs local CLI vs Docker-on-host.

```bash
pnpm prisma:generate
pnpm prisma:migrate
pnpm prisma:seed
```

#### 3. Frontend

```bash
cd services/frontend
cp .env.local.example .env.local
```

Edit `.env.local` with `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `NEXT_PUBLIC_API_URL`.

#### 4. Run

```bash
# Terminal 1 — API (port 4000)
pnpm backend start:dev

# Terminal 2 — Frontend (port 3000)
pnpm frontend dev
```

## Project structure

```
RePro/
├── docker/
│   └── supabase/          # Vendored Supabase Docker assets (compose fragment + volumes)
├── services/
│   ├── backend/           # Nest.js API
│   │   ├── prisma/        # Schema, migrations, seed
│   │   └── src/           # Modules: auth, companies, resources, rentals, etc.
│   └── frontend/          # Next.js app
│       ├── app/           # Routes & pages
│       └── src/           # FSD: shared, entities, features, widgets
└── docs/
```

## Main features

- **Company onboarding**: Public application form; platform admin approves/rejects
- **Auth**: Supabase login, password reset, `pending_verification` after reset
- **Storage**: Prisma models live in PostgreSQL alongside Supabase’s schemas; inspect them in Studio when using the Docker stack
- **Multi-company**: User selects active company; tenant isolation by `company_id`
- **Roles**: employee, support, moderator, company_admin (per company)
- **Resources**: CRUD, min role, user exceptions (allow/deny)
- **Rentals**: Request → support approve/reject → Google Calendar integration
- **Statistics**: Overview, resource utilization, peak demand (moderator+)

## API overview

- `POST /company-applications` — submit application (public)
- `GET/PATCH /platform/company-applications` — platform admin review
- `GET /auth/me`, `POST /auth/select-company`, `POST /auth/password-reset/request`
- `GET /companies/my`, `GET /companies/:id/members`, `GET /companies/:id/roles`
- `GET/POST /companies/:id/resources`, `GET /companies/:id/resources/:id/availability`
- `GET/POST /companies/:id/rentals`, `PATCH .../approve`, `.../reject`, `.../cancel`
- `GET /companies/:id/statistics/overview`, `.../resources`, `.../rentals`

All tenant endpoints require `Authorization: Bearer <token>` and `X-Company-Id` (or company in URL).
