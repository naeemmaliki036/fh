# Docker — build & run

Production Dockerfiles for every shippable surface in the repo. All builds use
the **repo root as build context** so they can pull in the pnpm workspace
(`pnpm-workspace.yaml` + `packages/*`).

## What's in here

| Service              | Image / Dockerfile                       | Default port | Notes                                                                 |
| -------------------- | ---------------------------------------- | ------------ | --------------------------------------------------------------------- |
| FastAPI backend      | `apps/api/Dockerfile`                    | `8000`       | Python 3.13 slim, multi-stage, runs `uvicorn` as non-root             |
| AqarFlow portal      | `apps/web/Dockerfile`                    | `3000`       | Next.js 15 standalone, pnpm `--filter fh-web`                         |
| PropertyPoint site   | `apps/marketplace/Dockerfile`            | `3000`       | Next.js 15 standalone, pnpm `--filter fh-marketplace` (uses `@fh/*`)  |

> **AqarFlow marketing site** is currently part of `apps/web` (unauthenticated
> routes). Extracting it into its own app is on the roadmap; until then,
> deploy `apps/web` and route marketing paths via the same container.

## Building locally

```bash
# API
docker build -f apps/api/Dockerfile -t fh-api .

# Portal (AqarFlow tenant portal)
docker build -f apps/web/Dockerfile -t fh-web .

# PropertyPoint marketplace
docker build -f apps/marketplace/Dockerfile -t fh-marketplace .
```

All three commands run from the repo root — that's required (not optional).

## Running locally with compose

`docker-compose.yml` at the repo root brings up the full stack — Postgres,
Redis, the API, and both Next.js apps.

```bash
docker compose up --build
```

Web ports: portal at `3000`, marketplace at `3001`, API at `8000`.

Environment overrides go in a top-level `.env` file (compose substitutes
`${VAR}` references in `docker-compose.yml`).

## Railway deploy

Railway can build each service directly from these Dockerfiles. For each
service in the Railway dashboard:

1. Connect the GitHub repo (use the `main` branch).
2. **Build settings → Build command**: leave blank — Railway respects the
   Dockerfile.
3. **Dockerfile path**:
   - `apps/api/Dockerfile` (for the API)
   - `apps/web/Dockerfile` (for the portal)
   - `apps/marketplace/Dockerfile` (for PropertyPoint)
4. **Watch paths**: leave default (the whole repo) — each Dockerfile is
   designed to invalidate cache only when its own slice of the repo changes.
5. **Environment variables**: see per-service list below.

### API env vars

| Var              | Notes                                                              |
| ---------------- | ------------------------------------------------------------------ |
| `DATABASE_URL`   | `postgresql+asyncpg://user:pass@host:port/dbname`                  |
| `REDIS_URL`      | `redis://host:port/0`                                              |
| `JWT_SECRET`     | Strong random string                                               |
| `CORS_ORIGINS`   | Comma-separated. Include both portal + marketplace web origins     |
| `ENVIRONMENT`    | `production` / `staging` / `development`                           |
| `R2_*` / `S3_*`  | Storage credentials (see `apps/api/config.py`)                     |
| `RESEND_API_KEY` | Email delivery                                                     |
| `PORT`           | Set by Railway automatically                                       |

### Portal env vars

| Var                          | Notes                              |
| ---------------------------- | ---------------------------------- |
| `NEXT_PUBLIC_API_BASE_URL`   | URL of the deployed API service    |
| `PORT`                       | Set by Railway automatically       |

### Marketplace env vars

| Var                                | Notes                                                |
| ---------------------------------- | ---------------------------------------------------- |
| `NEXT_PUBLIC_API_BASE_URL`         | URL of the deployed API service                      |
| `NEXT_PUBLIC_PORTAL_BRAND_NAME`    | Defaults to `PropertyPoint`                          |
| `NEXT_PUBLIC_PORTAL_BRAND_TAGLINE` | Defaults to `UAE's open property marketplace`        |
| `PORT`                             | Set by Railway automatically                         |

## Health checks

Every image declares a `HEALTHCHECK` directive (Railway uses these to detect
crash-looping containers):

- API: `GET /health` → expects `200`
- Portal & Marketplace: `GET /` → expects `200`

## Image size notes

- API runtime: `python:3.13-slim` + `libpq5` + venv ≈ 180 MB
- Web runtimes: `node:20-alpine` + standalone bundle ≈ 150 MB each

Multi-stage builds keep the build-only tooling (build-essential, pnpm,
Next.js dev deps) out of the final image.
