.PHONY: setup docker-up docker-down db-migrate db-makemigration create-superadmin kill-ports dev-api dev-web test-api test-web test lint typecheck dev

# ── Infrastructure ─────────────────────────────────────────────────────────────

docker-up:
	docker compose -f infra/docker-compose.yml up -d

docker-down:
	docker compose -f infra/docker-compose.yml down

kill-ports:
	@lsof -ti:8000 | xargs kill -9 2>/dev/null || true
	@lsof -ti:3000 | xargs kill -9 2>/dev/null || true

# ── Database ───────────────────────────────────────────────────────────────────

db-migrate:
	alembic -c infra/alembic.ini upgrade head

db-makemigration:
	@read -p "Migration message: " msg; \
	alembic -c infra/alembic.ini revision --autogenerate -m "$$msg"

create-superadmin:
	python -m apps.api.scripts.create_superadmin

# ── Bootstrap ──────────────────────────────────────────────────────────────────

dev-api:
	uvicorn apps.api.main:app --reload --host 0.0.0.0 --port 8000

test:
	$(MAKE) test-api && $(MAKE) test-web

test-api:
	.venv/bin/pytest tests/api -v --tb=short

lint:
	.venv/bin/ruff check apps/ packages/ tests/

dev-web:
	cd apps/web && npm run dev

test-web:
	cd apps/web && npx vitest run

typecheck:
	cd apps/web && npm run typecheck

dev:
	$(MAKE) -j2 dev-api dev-web

setup:
	pip install -e ".[dev]"
	$(MAKE) docker-up
	@echo "Waiting for PostgreSQL..."
	@sleep 5
	$(MAKE) db-migrate
	cd apps/web && npm install
	@echo "Setup complete. Bootstrap your super_admin: 'make create-superadmin'"
	@echo "Then run 'make dev' to start API + web."
