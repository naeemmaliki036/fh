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
