# RePro — Resource Management SaaS Platform

Multitenant SaaS platform for companies to manage internal resources and rentals. Built according to [docs/plan/detailed-development-plan.md](docs/plan/detailed-development-plan.md).

## Stack

- **Frontend**: Next.js 16, shadcn/ui, Tailwind CSS, Formik, Zod, FSD architecture
- **Backend**: Nest.js, Prisma, PostgreSQL
- **Database/Auth/Admin**: Supabase Postgres, Supabase Auth, Supabase Studio

## Quick start

### Prerequisites

- Node.js 20+
- pnpm
- Supabase project or local Supabase CLI

### 1. Install dependencies

```bash
pnpm install
```

### 2. Backend setup

```bash
cd services/backend
cp .env.example .env
# Edit .env with your DATABASE_URL, DIRECT_URL, SUPABASE_* keys, PLATFORM_ADMIN_EMAILS
pnpm prisma:generate
pnpm prisma:migrate
pnpm prisma:seed
```

Use the PostgreSQL connection strings from the same Supabase project you use for auth:

- `DATABASE_URL` — application runtime connection. For Supabase Cloud, prefer the pooler URL.
- `DIRECT_URL` — direct PostgreSQL connection for Prisma migrations.
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` — API/Auth credentials for that same project.

### 3. Frontend setup

```bash
cd services/frontend
cp .env.local.example .env.local
# Edit with NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, NEXT_PUBLIC_API_URL
```

### 4. Run

```bash
# Terminal 1: Backend (port 4000)
pnpm backend start:dev

# Terminal 2: Frontend (port 3000)
pnpm frontend dev
```

### Docker Compose

The provided `docker-compose.yml` starts only the frontend and backend. Both services expect an external Supabase project:

```bash
cp .env.example .env
# Fill in DATABASE_URL, DIRECT_URL, SUPABASE_* values
docker compose up --build
```

For local Supabase CLI, the API usually runs on `http://localhost:54321` and PostgreSQL on `localhost:54322`. When using Docker Compose, point backend-facing host URLs to `host.docker.internal` as shown in `.env.example`.

## Project structure

```
RePro/
├── services/
│   ├── backend/       # Nest.js API
│   │   ├── prisma/    # Schema, migrations, seed
│   │   └── src/       # Modules: auth, companies, resources, rentals, etc.
│   └── frontend/      # Next.js app
│       ├── app/       # Routes & pages
│       └── src/       # FSD: shared, entities, features, widgets
└── docs/
```

## Main features

- **Company onboarding**: Public application form; platform admin approves/rejects
- **Auth**: Supabase login, password reset, `pending_verification` after reset
- **Storage**: Prisma models stored in the same Supabase Postgres project and visible in Supabase Studio
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
