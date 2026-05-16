# syntax=docker/dockerfile:1.7
# ---------------------------------------------------------------------------
# fh-marketplace — PropertyPoint public site (Next.js 15, standalone output)
# Build from repo root:  docker build -f apps/marketplace/Dockerfile -t fh-marketplace .
# ---------------------------------------------------------------------------

ARG NODE_VERSION=20

# ---------------------------------------------------------------------------
# deps — install workspace dependencies (resolves @fh/* packages)
# ---------------------------------------------------------------------------
FROM node:${NODE_VERSION}-alpine AS deps

RUN apk add --no-cache libc6-compat \
    && corepack enable \
    && corepack prepare pnpm@9.0.0 --activate

WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/marketplace/package.json apps/marketplace/
COPY packages/portal-types/package.json packages/portal-types/
COPY packages/api-client/package.json packages/api-client/

RUN pnpm install --frozen-lockfile --filter fh-marketplace...

# ---------------------------------------------------------------------------
# builder — compile Next.js (workspace packages resolved via symlinks)
# ---------------------------------------------------------------------------
FROM node:${NODE_VERSION}-alpine AS builder

RUN apk add --no-cache libc6-compat \
    && corepack enable \
    && corepack prepare pnpm@9.0.0 --activate

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/marketplace/node_modules ./apps/marketplace/node_modules
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/marketplace ./apps/marketplace
COPY packages ./packages

ENV NEXT_TELEMETRY_DISABLED=1 \
    NODE_ENV=production

RUN pnpm --filter fh-marketplace build

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

# next.config sets outputFileTracingRoot=../../ so standalone is rooted at workspace
COPY --from=builder --chown=app:app /app/apps/marketplace/.next/standalone ./
COPY --from=builder --chown=app:app /app/apps/marketplace/.next/static ./apps/marketplace/.next/static
COPY --from=builder --chown=app:app /app/apps/marketplace/public ./apps/marketplace/public

USER app

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD wget -qO- http://localhost:${PORT}/ >/dev/null 2>&1 || exit 1

CMD ["node", "apps/marketplace/server.js"]
