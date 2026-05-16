# Railway Deployment Runbook

## Prerequisites

- GitHub account with this repo pushed
- Railway account (railway.app)
- Cloudflare R2 bucket + access keys
- AWS S3 bucket + IAM user keys

## Generate secrets

```bash
openssl rand -hex 32   # JWT_SECRET_KEY
```

The first super_admin is **not** seeded from env. You'll create it interactively after the first deploy (see step 6).

## 1. Create the project

1. railway.app → **New Project** → **Deploy from GitHub repo** → pick `fh`.
2. Railway will auto-detect a service. Delete it — we'll create services explicitly.

## 2. Add infra plugins

- **+ New** → **Database** → **PostgreSQL** (named `Postgres`)
- **+ New** → **Database** → **Redis** (named `Redis`)

## 3. Create the API service

- **+ New** → **GitHub Repo** → same repo.
- Settings → **Source**:
  - Root Directory: `/`
  - Dockerfile Path: `Dockerfile.api`
- Settings → **Networking** → **Generate Domain** (gets `<name>.up.railway.app`).
- Settings → **Variables**, add:

```
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}
JWT_SECRET_KEY=<paste openssl output>
JWT_ALGORITHM=HS256
JWT_ACCESS_TTL_MIN=30
JWT_REFRESH_TTL_DAYS=7
CORS_ORIGINS=["https://<web-domain>.up.railway.app"]
FRONTEND_BASE_URL=https://<web-domain>.up.railway.app
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_S3_BUCKET=fh-private-docs
AWS_REGION=me-central-1
CF_R2_ACCESS_KEY_ID=...
CF_R2_SECRET_ACCESS_KEY=...
CF_R2_BUCKET=fh-public-media
CF_R2_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
CF_R2_PUBLIC_BASE_URL=https://pub-<hash>.r2.dev
```

(`CORS_ORIGINS` and `FRONTEND_BASE_URL` will be filled in after step 4 generates the web domain.)

## 4. Create the Web service

- **+ New** → **GitHub Repo** → same repo.
- Settings → **Source**:
  - Root Directory: `apps/web`
  - Dockerfile Path: `Dockerfile` (auto-detected)
- Settings → **Networking** → **Generate Domain**.
- Settings → **Variables**:

```
NEXT_PUBLIC_API_URL=https://<api-domain>.up.railway.app
```

`NEXT_PUBLIC_API_URL` is baked at build time — set it before the first deploy.

## 5. Wire the domains

Once both services have generated domains:

- API service → update `CORS_ORIGINS` and `FRONTEND_BASE_URL` to the real web URL → redeploy.
- Web service → confirm `NEXT_PUBLIC_API_URL` points to the real API URL → redeploy.

## 6. First deploy

Push to `main`. Railway builds both services in parallel.

API startup runs `alembic upgrade head` automatically (CMD in `Dockerfile.api`).

Creating the first super_admin is **one-time, manual, and interactive** — credentials are entered at the prompt and written straight to the database:

```bash
railway run --service api python -m apps.api.scripts.create_superadmin
```

(Requires `railway login` + `railway link` locally.)

> Once created, super_admin rows are protected by a Postgres trigger that
> blocks `DELETE` from any client (including the API). If you ever need to
> remove one, you must disable the trigger in a direct DB session first:
>
> ```sql
> ALTER TABLE platform_users DISABLE TRIGGER trg_block_super_admin_delete;
> DELETE FROM platform_users WHERE email = '...';
> ALTER TABLE platform_users ENABLE TRIGGER trg_block_super_admin_delete;
> ```

## 7. Verify

- `curl https://<api-domain>.up.railway.app/health` → `{"status":"healthy"}`
- Open `https://<web-domain>.up.railway.app` → login with seeded super-admin.

## Custom domain (optional)

Per service → Settings → **Networking** → **Custom Domain** → add CNAME at your registrar. Then update `CORS_ORIGINS`, `FRONTEND_BASE_URL`, `NEXT_PUBLIC_API_URL` to the custom hostnames and redeploy.

## Rollback

Service → **Deployments** tab → click any prior deploy → **Redeploy**.

## Common gotchas

- `NEXT_PUBLIC_*` vars are baked into the Next build — changing them requires a redeploy of the web service, not just a restart.
- Local uploads (`./uploads`) won't persist on Railway. R2 + S3 must be configured before users upload anything.
- If `DATABASE_URL` is missing the `+asyncpg` suffix, `config.py` coerces it on load — no manual transform needed.
- Migrations run on every API boot. If a migration fails, the container crash-loops; check Logs.
