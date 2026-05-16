# syntax=docker/dockerfile:1.7
# ---------------------------------------------------------------------------
# fh API — FastAPI + asyncpg
# Build from repo root:  docker build -f apps/api/Dockerfile -t fh-api .
# ---------------------------------------------------------------------------

FROM python:3.13-slim AS base
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# ---------------------------------------------------------------------------
# Builder stage — install Python deps into a virtualenv
# ---------------------------------------------------------------------------
FROM base AS builder

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /build

# Cache deps separately from source — only invalidates when pyproject changes
COPY pyproject.toml ./
RUN python -m venv /opt/venv \
    && /opt/venv/bin/pip install --upgrade pip \
    && /opt/venv/bin/pip install -e .

# ---------------------------------------------------------------------------
# Runtime stage — minimal image with only what's needed to run
# ---------------------------------------------------------------------------
FROM base AS runtime

# libpq is needed at runtime for asyncpg fallback paths
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    curl \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd --system app \
    && useradd --system --gid app --create-home app

ENV PATH=/opt/venv/bin:$PATH \
    PYTHONPATH=/srv:/srv/apps/api

WORKDIR /srv

COPY --from=builder /opt/venv /opt/venv
COPY --chown=app:app pyproject.toml ./
COPY --chown=app:app apps/api ./apps/api
COPY --chown=app:app packages ./packages
COPY --chown=app:app infra ./infra

USER app

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD curl -fsS http://localhost:8000/health || exit 1

# Railway sets $PORT. Auto-run alembic migrations on boot so deploys stay
# self-contained — matches the previous Dockerfile.api behaviour.
CMD ["sh", "-c", "alembic -c infra/alembic.ini upgrade head && exec uvicorn apps.api.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
