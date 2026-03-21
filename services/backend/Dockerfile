FROM node:20-alpine AS builder

# Build with repo root as context:
# docker build -f services/backend/Dockerfile .

ENV NODE_ENV=build

WORKDIR /repo

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY services/backend/package.json services/backend/

RUN pnpm install --filter backend... --frozen-lockfile

COPY services/backend/ services/backend/

RUN pnpm --filter backend run build

# ---

FROM node:20-alpine AS base

ENV NODE_ENV=production

WORKDIR /app

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY services/backend/package.json services/backend/

RUN pnpm install --filter backend... --prod --frozen-lockfile

COPY --from=builder /repo/services/backend/dist/ ./dist/

CMD ["node", "dist/src/main.js"]