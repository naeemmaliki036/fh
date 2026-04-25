# fh — Multi-Tenant Real Estate SaaS Platform

## Local Setup

```bash
cp .env.example .env
make setup
```

This installs Python deps, starts Postgres 16 (port 5433) + Redis 7 (port 6379) via Docker, and runs Alembic migrations.
