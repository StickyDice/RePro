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

RUN pnpm --filter backend exec prisma generate

RUN pnpm --filter backend run build

# ---

FROM node:20-alpine AS base

ENV NODE_ENV=production
# Workspace deps live under services/backend/node_modules; Node resolves from /app/dist/src.
ENV NODE_PATH=/app/services/backend/node_modules:/app/node_modules

WORKDIR /app

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY services/backend/package.json services/backend/
COPY services/backend/prisma ./services/backend/prisma

# Root workspace package.json is "type": "module"; Nest emits CommonJS — Node must not treat dist as ESM.
RUN node -e "const fs=require('fs');const p='package.json';const j=JSON.parse(fs.readFileSync(p));delete j.type;fs.writeFileSync(p,JSON.stringify(j,null,2));"

# pnpm --prod in an isolated /app install omits hoisted deps; copy the resolved tree from the builder.
COPY --from=builder /repo/node_modules ./node_modules
COPY --from=builder /repo/services/backend/node_modules ./services/backend/node_modules

RUN npm install -g prisma@6.19.2 tsx@4

COPY --from=builder /repo/services/backend/dist/ ./dist/

CMD ["sh", "-c", "prisma migrate deploy --schema=services/backend/prisma/schema.prisma && tsx services/backend/prisma/seed.ts && node dist/src/main.js"]