# RePro — SaaS для управления ресурсами компании

**RePro** — многотенантное B2B-приложение: компании ведут каталог общих активов (комнаты, техника, транспорт и т.п.), задают правила доступа по ролям и обрабатывают **заявки на бронирование** через поддержку.

Детальный продуктовый план: [docs/plan/detailed-development-plan.md](docs/plan/detailed-development-plan.md).

## О проекте

### Задача

Свести двойные брони и «устные» правила к одному процессу: что доступно кому, кто утверждает заявки и как видна история.

### Роли

| Роль | Что делает |
|------|------------|
| Платформенный администратор | Рассматривает публичные заявки на подключение компаний |
| Админ / модератор / поддержка в компании | Пользователи, ресурсы, очередь заявок на аренду |
| Сотрудник | Видит разрешённые ресурсы, подаёт заявки, смотрит статусы |

Вход через **Supabase Auth**. Данные изолированы по **активной компании** (`company_id`, заголовок `X-Company-Id` или `companyId` в пути API).

### Как обычно выглядит сценарий

1. Заявка на подключение компании → одобрение платформой.
2. Пользователи входят, при нескольких компаниях выбирают активную.
3. Модераторы настраивают **ресурсы** (минимальная роль, исключения для отдельных людей).
4. Сотрудник создаёт **заявку на аренду**; поддержка **одобряет** или **отклоняет**; пользователю уходит уведомление (в коде — заглушка email).
5. **Статистика** для модераторов: загрузка и спрос.

## Стек

- **Фронтенд**: Next.js 16, shadcn/ui, Tailwind, Formik, Zod, FSD
- **Бэкенд**: Nest.js, Prisma, PostgreSQL
- **Auth / админка БД**: Supabase; прикладные таблицы в той же PostgreSQL, что и Prisma. При Docker-стеке удобен [Supabase Studio](https://supabase.com/docs/guides/local-development/overview)

## Запуск через Docker (рекомендуется)

Корневой [`docker-compose.yml`](docker-compose.yml) подключает self-hosted **Supabase** ([`docker/supabase/compose.yaml`](docker/supabase/compose.yaml)) и сервисы **backend** и **frontend** RePro.

### Нужно установить

- Docker с **Compose v2** (`docker compose`)
- Для команды `pnpm docker:up` — **Node.js 20+** и **pnpm**

### Команды

```bash
cp .env.example .env
# Отредактируйте .env: пароли, JWT, ANON_KEY, SERVICE_ROLE_KEY, порты и т.д.
pnpm install
pnpm docker:up
```

Скрипт [`scripts/ensure-compose-env.sh`](scripts/ensure-compose-env.sh) при пустом или отсутствующем `.env` скопирует `.env.example`, затем запустит `docker compose up --build`.

Без pnpm, если `.env` уже готов:

```bash
docker compose up --build
```

При старте контейнера backend обычно выполняются миграции Prisma и сид (см. `CMD` в [`services/backend/Dockerfile`](services/backend/Dockerfile)).

### Куда открыть в браузере

| Сервис | Адрес |
|--------|--------|
| Веб-приложение | http://localhost:3000 |
| API | http://localhost:4000 |
| Supabase (Kong) и Studio | `SUPABASE_PUBLIC_URL` из `.env`, чаще всего http://localhost:54321 |
| Postgres с хоста (пулер) | `localhost:54322` (`POSTGRES_HOST_PORT`) |

Для дашборда Kong — **HTTP Basic**: `DASHBOARD_USERNAME` / `DASHBOARD_PASSWORD` из `.env`.

Остановка: `docker compose down`. Данные Postgres лежат в `docker/supabase/volumes/db/data` (в git не попадают).

### Если контейнеры не поднимаются

- **Нет или пустой корневой `.env`** — БД Supabase может быть `unhealthy`. Заполните `.env`, перезапустите.
- Старый compose с другим сервисом Postgres:  
  `docker compose down --remove-orphans` → снова `pnpm docker:up`.
- После испорченного первого запуска:  
  `docker compose down`, удалить `docker/supabase/volumes/db/data`, снова `pnpm docker:up`.

## Локальная разработка (API и Next на хосте)

Postgres и Auth — через **Supabase Cloud** или `pnpm dlx supabase start`.

```bash
pnpm install
```

**Backend** (`services/backend`): `cp .env.example .env`, задать `DATABASE_URL`, `DIRECT_URL`, `SUPABASE_*`, `PLATFORM_ADMIN_EMAILS`; затем из каталога backend:

```bash
pnpm prisma:generate && pnpm prisma:migrate && pnpm prisma:seed
```

**Frontend** (`services/frontend`): `cp .env.local.example .env.local` — `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_API_URL`.

Два терминала из корня монорепо:

```bash
pnpm backend start:dev    # порт 4000
pnpm frontend dev         # порт 3000
```

## Структура репозитория

```
RePro/
├── docker/supabase/     # Compose-фрагмент и тома Supabase
├── services/
│   ├── backend/        # Nest, Prisma
│   └── frontend/       # Next.js (app/, src/)
└── docs/
```

## Возможности MVP

- Заявка компании на платформу и модерация суперпользователем
- Авторизация Supabase, сброс пароля, статус проверки после сброса
- Несколько компаний у одного пользователя, изоляция по `company_id`
- Роли: employee, support, moderator, company_admin
- Ресурсы с минимальной ролью и исключениями allow/deny
- Аренда: заявка → approve/reject/cancel со стороны поддержки при необходимости
- Статистика по ресурсам и арендам (модератор+)

## Краткий обзор API

Публично: `POST /company-applications`.

Платформа: `GET` / `PATCH /platform/company-applications`.

Прочее (с токеном и контекстом компании):

- `GET /auth/me`, `POST /auth/select-company`, `POST /auth/password-reset/request`
- `GET /companies/my`, `GET /companies/:id/members`, `GET /companies/:id/roles`
- `GET|POST /companies/:id/resources`, `GET .../resources/:id/availability`
- `GET|POST /companies/:id/rentals`, `PATCH .../approve|reject`, `PATCH .../cancel`
- `GET /companies/:id/statistics/overview`, `/statistics/resources`, `/statistics/rentals`

Для тенантных маршрутов: `Authorization: Bearer <jwt>` и `X-Company-Id` (либо `:id` компании уже в URL).
