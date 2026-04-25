# Real Estate Multi-Tenant SaaS Platform

## Architecture

Modular monolith with NestJS backend + Next.js frontend + PostgreSQL + Redis.

```
apps/web/          — Next.js frontend (port 3000)
apps/api/          — FastAPI backend (port 8000)
packages/common/   — Shared Python: base classes, error handlers, utilities
infra/             — Docker, Alembic migrations (PostgreSQL 5432, Redis 6379)
```

## Tech Stack
- **Frontend**: Next.js (React 19), TypeScript strict
- **Backend**: FastAPI (Python), async via asyncpg
- **Database**: PostgreSQL via SQLAlchemy 2.0 + Alembic migrations
- **Cache/Queue**: Redis + background workers for async jobs
- **Public Media**: Cloudflare R2 + Cloudflare CDN (WebP/AVIF, multi-size)
- **Private Docs**: AWS S3 + signed URLs only — never expose raw S3 URLs

## Core Entities
Tenant, User, Agent, Property, Listing, Media, PrivateDocument, Lead, Deal, Commission, DocumentRequest, PaymentLink, Subscription, Invoice, AuditLog

## Non-Negotiable Architecture Rules

### 1. Multi-Tenancy
- Every entity (except Tenant itself) must have `tenant_id`
- Every query must be scoped by `tenant_id` — no exceptions
- No cross-tenant data access under any circumstances
- RBAC enforced at service layer, not just route guards

### 2. Property vs Listing (critical distinction)
- Property = inventory record (internal)
- Listing = market representation (external/public)
- They are SEPARATE entities with a relationship — never merge them into one

### 3. Storage Split
- **Public media** (images, videos, thumbnails) → Cloudflare R2 + CDN
  - Always convert to WebP/AVIF
  - Always generate multiple sizes
  - Never serve raw unoptimized uploads
- **Private documents** (passports, RERA IDs, contracts, KYC) → AWS S3
  - Always use signed URLs with expiry — never public URLs
  - Access requires audit log entry
  - Strict access control per role

### 4. Commission Chain
- Default commission set at agent level
- Copied to deal on creation
- Override allowed at deal level only
- Every change requires audit trail entry

### 5. Customer Document Collection
- Agent creates DocumentRequest
- System generates unique token-based URL with expiry
- Customer must pass verification code to access
- Every upload action logged in AuditLog

### 6. Audit Everything Critical
AuditLog entries required for: document access, commission overrides, tenant status changes, user role changes, deal stage transitions, payment link state changes

### 7. Pluggable Portal Integrations
- Connector-based architecture (Dubizzle, Property Finder, Bayut)
- Mapping engine between internal Listing and portal format
- Validate before publish
- Track sync status and handle retries

## User Roles

### Platform Roles (cross-tenant)
- Super Admin, Operations Admin, Finance Admin

### Tenant Roles
- Company Owner, Company Admin, Property Admin, Listing Manager, Agent, Finance User, Read-only User

## Tenant Lifecycle
pending_approval → active (requires platform admin approval)

## Implementation Phases

### Phase 1 (current)
Tenants, Users, Agents, Properties, Media, Leads, Document Collection, Deals, Commission

### Phase 2
Portal integration, Payment links, Advanced reporting

### Phase 3
KYC integrations, Automation, Mobile apps

## File Size Limits (non-negotiable)
- 300 LOC max per file
- 150 LOC max per hook (frontend)
- 50 LOC max per utility function
- Split proactively before hitting the limit


## Agent Delegation Rules

When implementing a new domain, spawn agents in this order:
1. **db-engineer** — SQLAlchemy model + Alembic migration first
2. **backend-dev** — FastAPI router, service, Pydantic schemas
3. **frontend-dev** — TypeScript types, repository, hooks, components
4. **test-engineer** — pytest for backend, Vitest for frontend
5. **code-reviewer** — final review before declaring done

Never implement across layers in one session — delegate each layer to its specialist.
Always wait for db-engineer to finish before backend-dev starts.
Always wait for backend-dev to finish before frontend-dev starts.
Test-engineer and code-reviewer run only after all implementation layers are complete.
