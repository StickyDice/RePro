FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Enable corepack for pnpm
RUN corepack enable pnpm

# Copy workspace configuration files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY .npmrc* ./

# Copy all service package.json files to respect workspace structure
COPY services/frontend/package.json ./services/frontend/package.json

# Install dependencies for the entire workspace
# This ensures all workspace dependencies are resolved correctly
RUN pnpm install --frozen-lockfile

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app

# Enable corepack for pnpm
RUN corepack enable pnpm

# Copy workspace files
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/services/frontend/node_modules ./services/frontend/node_modules

# Copy workspace configuration
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY .npmrc* ./

# Copy the entire frontend service source code
COPY services/frontend ./services/frontend

# Build the frontend service
WORKDIR /app/services/frontend

RUN pnpm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy public assets
COPY --from=builder /app/services/frontend/public ./public

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/services/frontend/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/services/frontend/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000

# server.js is created by next build from the standalone output
# https://nextjs.org/docs/pages/api-reference/config/next-config-js/output
ENV HOSTNAME="0.0.0.0"
CMD ["node", "services/frontend/server.js"]
