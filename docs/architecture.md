# Architecture — how the four apps fit together

There are four deployable surfaces and one API. This doc explains who talks
to whom, what they share, and where the boundaries are.

```
                                  ┌─────────────────────────┐
                                  │      Postgres + Redis   │
                                  │   (single shared DB)    │
                                  └────────────▲────────────┘
                                               │
                                  ┌────────────┴────────────┐
                                  │       apps/api          │ (FastAPI)
                                  │   af-staging-api…       │
                                  │                         │
                                  │  Exposes 4 layers:      │
                                  │  • /auth, /tenants…     │  ← portal only
                                  │  • /public/sites/{slug} │  ← portal public site
                                  │  • /marketplace/*       │  ← marketplace only
                                  │  • /marketing/*         │  ← marketing only
                                  └─▲────────▲────────▲─────┘
                                    │        │        │
                  ┌─────────────────┘        │        └────────────────┐
                  │ (JWT auth)               │ (no auth)               │ (no auth)
        ┌─────────┴──────────┐    ┌──────────┴───────────┐    ┌────────┴──────────┐
        │  apps/web          │    │  apps/marketplace    │    │  aqarflow-website │
        │  (PORTAL)          │    │  (PROPERTYPOINT)     │    │  (same code as    │
        │  af-staging-portal │    │  af-staging-mkt…     │    │   apps/web today) │
        └────────────────────┘    └──────────────────────┘    └───────────────────┘
                                       │
                                       └─▶ @fh/api-client + @fh/portal-types
                                           (shared TS packages)
```

## Coupling, in order of tightness

### 1. Single database, single schema (tightest)

There is **one Postgres** behind everything. The API enforces tenant isolation
via:

- A `tenant_id` column on every table except `tenants`.
- Row-level scoping at the service layer (every query filters by `tenant_id`).
- A Postgres GUC `app.tenant_id` set via `SET LOCAL` before audit writes,
  used by RLS policies as a backstop.

Marketplace + marketing routes scope by
`tenants.aggregator_enabled = true AND status = 'active' AND public_site_enabled = true`
instead of an auth-bound `tenant_id`.

### 2. One API serves all four apps

The same FastAPI process (`apps/api`) hosts every endpoint. There is no
microservice split. Four logical surfaces:

| Surface | Routes (examples) | Auth | Consumer |
|---|---|---|---|
| **Tenant** | `/properties`, `/listings`, `/deals`, `/agents`, `/customers`, `/leads`, `/auth/login`, `/tenants/me` | JWT (tenant-scoped) | portal |
| **Per-tenant public site** | `/public/sites/{slug}`, `/public/sites/{slug}/listings`, `/public/sites/{slug}/leads` | none | portal's public `/p/{slug}` pages |
| **Marketplace** | `/marketplace/listings`, `/marketplace/agencies/{slug}`, `/marketplace/stats` | none | marketplace |
| **Marketing** | `/marketing/demo-request`, `/marketing/waitlist` | none | aqarflow-website / portal hero |

When a marketplace buyer submits a lead, that lead goes back into the same DB
and shows up in **that tenant's** inbox in the portal. End-to-end loop.

### 3. CORS allow-list

The API's `CORS_ORIGINS` env var lists the three frontend hosts. If you
forget to add a domain there, the browser blocks every fetch from that
frontend. Current value:

```
["https://af-staging-portal.up.railway.app",
 "https://af-staging-marketplace.up.railway.app",
 "https://af-staging.up.railway.app"]
```

### 4. Shared TypeScript packages

```
packages/
├── portal-types/     ← TS types for marketplace API responses
│   src/marketplace.ts   (MarketplaceListingItem, MarketplaceAgencyItem, …)
└── api-client/       ← axios factory + marketplace function library
    src/marketplace.ts   (getListings, getAgencies, getStats, …)
```

| Consumer | portal-types | api-client |
|---|---|---|
| `apps/web` (portal) | ✗ | ✗ |
| `apps/marketplace` | ✓ | ✓ |
| `apps/api` | ✗ (Python) | ✗ (Python) |

Today **only the marketplace** uses the shared packages. The portal is fully
standalone — it has its own internal types under `apps/web/src/lib/types/*`.
We can extract more shared types later (e.g. `Property`, `Listing`) if we
want the portal to drop its private copies — but right now the surface area
is small enough that the duplication is not worth the move.

### 5. Shared Python package — `packages/common`

```
packages/common/
├── db/                 ← SQLAlchemy Base + TenantMixin + UUIDMixin
├── storage/            ← R2 + S3 client wrappers
├── utils/              ← error_handlers (bad_request, forbidden, not_found)
└── ...
```

Used by `apps/api` only. The frontends never touch this.

### 6. Storage layer

Both R2 (public media) and S3 (private docs) sit beside the API. The
frontends never authenticate to R2/S3 directly — they get:

- **Public media**: a CDN URL embedded in the JSON response
  (`primary_photo_url`, `logo_url`, `banner_url`, etc.).
- **Private docs**: a short-lived signed URL the API generates on demand.

So R2/S3 are coupled through the API only.

### 7. Hosting (Railway)

```
Project: fh
├── api                ←  apps/api/Dockerfile
├── portal             ←  apps/web/Dockerfile      ┐ same Dockerfile,
├── aqarflow-website   ←  apps/web/Dockerfile      ┘ same image, two domains
├── marketplace        ←  apps/marketplace/Dockerfile  (uses @fh/* packages)
├── Postgres
└── Redis
```

`portal` and `aqarflow-website` currently build from the **same** Dockerfile.
They are literally the same Next.js bundle. The user experience differs
only because:

- Different env vars → marginally different (right now: identical).
- Different domains → could later route differently via middleware.

Once the AqarFlow marketing site is extracted into its own
`apps/aqarflow-marketing/` (the way marketplace was), `aqarflow-website`
will get its own dedicated Dockerfile and zero portal code.

## What "completely separate" means in practice today

- **Marketplace ↔ portal**: zero TypeScript imports between them. Both could
  be deleted independently. They communicate only through HTTPS calls to the
  API.
- **Marketplace ↔ API**: HTTP only, no auth header. Uses shared TS types so
  the two cannot drift in shape.
- **Portal ↔ API**: HTTP with JWT cookie. Types are still private to
  `apps/web` — could be unified later.
- **Aqarflow-website ↔ portal**: technically the same code today. Different
  Railway deploys, different env vars.

## The one cross-cutting concern

**Auth boundary**: marketplace and marketing pages must NEVER show
authenticated tenant data. The API enforces this by giving those endpoints
no `tenant_id` — they go through different service classes
(`MarketplaceService`, public-site service) that scope by tenant
aggregator/status flags only. The frontends can't bypass this because the
JWT they don't send would be required to hit the tenant-scoped routes.

If we ever want a single sign-on flow ("Sign in to PropertyPoint to save
listings"), we would need to add a **buyer-account domain** to the API.
This currently does not exist — it's the "buyer accounts" item in the
deferred list at the bottom of `docs/`.

## Why a single API, not three

The same FastAPI process at `af-staging-api.up.railway.app` serves **all
three frontends**. There is no microservice split — different routes are
reachable by different frontends, controlled at the API layer (auth +
scoping rules), not by deploying separate APIs.

| Frontend | What it hits on the API |
|---|---|
| **portal** (`af-staging-portal`) | `/auth/*`, `/tenants/*`, `/properties/*`, `/listings/*`, `/deals/*`, `/agents/*`, `/customers/*`, `/leads/*` — **JWT required**, every query scoped to the user's `tenant_id`. Also hits `/public/sites/{slug}/*` for its own public tenant pages at `/p/{slug}`. |
| **marketplace** (`af-staging-marketplace`) | `/marketplace/listings`, `/marketplace/agencies/*`, `/marketplace/stats`, `/marketplace/featured` — **no auth**, scoped to tenants where `aggregator_enabled = true AND status = 'active' AND public_site_enabled = true`. |
| **aqarflow-website** (`af-staging`) | `/marketing/demo-request`, `/marketing/waitlist` — **no auth**. Today this is the same Next.js bundle as the portal, so it also has access to the JWT routes, but the public pages don't call them. |

### Why this is a deliberate choice (not laziness)

1. **One source of truth for data.** A listing created in the portal shows
   up in the marketplace the same instant — no replication, no sync drift.
2. **Buyer leads close the loop.** A lead submitted on
   `marketplace/listings/{id}` posts to a public lead endpoint, lands in
   the same DB, then the agent sees it in their portal inbox.
3. **One auth + RBAC system to reason about.** The `MarketplaceService`
   and `PublicSiteService` classes literally can't return rows from
   non-eligible tenants because the SQL filters are in the service
   constructor.

### Where the boundaries live in the API codebase

Separation is by **router + service**:

```
apps/api/routers/
├── auth.py                ┐
├── tenants.py             │  tenant-scoped, JWT-gated
├── properties.py          │  → consumed by portal
├── listings.py            │
├── deals.py               │
├── agents.py              ┘
├── public_site.py         ←  per-tenant public site → portal's /p/{slug}
├── marketplace.py         ←  cross-tenant aggregator → marketplace app
├── marketing.py           ←  demo-request, waitlist → aqarflow-website
└── ...
```

The router chooses the auth dependency (`CurrentUser` for JWT,
`Depends(get_public_session)` for unauth) and which service class to
instantiate. The service then decides what tenant_ids are visible.

### Could we ever split them?

Yes — if traffic on the marketplace grows much larger than the portal, we
could:

1. Spin a second FastAPI deployment that imports only the marketplace
   router.
2. Point the marketplace frontend's `NEXT_PUBLIC_API_BASE_URL` at it.
3. Database stays single; read replicas can be added if needed.

Nothing in the code prevents this — the routers are independent modules.
We just haven't needed the split yet.
