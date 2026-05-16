# syntax=docker/dockerfile:1.7
# ---------------------------------------------------------------------------
# fh-web — AqarFlow tenant portal (Next.js 15, standalone output)
# Build from repo root:  docker build -f apps/web/Dockerfile -t fh-web .
# ---------------------------------------------------------------------------

ARG NODE_VERSION=20

# ---------------------------------------------------------------------------
# deps — install workspace dependencies with pnpm
# ---------------------------------------------------------------------------
FROM node:${NODE_VERSION}-alpine AS deps

RUN apk add --no-cache libc6-compat \
    && corepack enable \
    && corepack prepare pnpm@9.0.0 --activate

WORKDIR /app

# Copy workspace manifests first for better layer caching
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/web/package.json apps/web/
COPY packages/portal-types/package.json packages/portal-types/
COPY packages/api-client/package.json packages/api-client/

RUN pnpm install --frozen-lockfile --filter fh-web...

# ---------------------------------------------------------------------------
# builder — compile Next.js
# ---------------------------------------------------------------------------
FROM node:${NODE_VERSION}-alpine AS builder

RUN apk add --no-cache libc6-compat \
    && corepack enable \
    && corepack prepare pnpm@9.0.0 --activate

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/web ./apps/web
COPY packages ./packages

ENV NEXT_TELEMETRY_DISABLED=1 \
    NODE_ENV=production

RUN pnpm --filter fh-web build

# ---------------------------------------------------------------------------
# runtime — minimal Node image with the standalone bundle
# ---------------------------------------------------------------------------
FROM node:${NODE_VERSION}-alpine AS runtime

RUN addgroup -S app && adduser -S app -G app

WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

# Standalone output: server bundle + minimal node_modules
COPY --from=builder --chown=app:app /app/apps/web/.next/standalone ./
COPY --from=builder --chown=app:app /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=app:app /app/apps/web/public ./apps/web/public

USER app

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD wget -qO- http://localhost:${PORT}/ >/dev/null 2>&1 || exit 1

CMD ["node", "apps/web/server.js"]
