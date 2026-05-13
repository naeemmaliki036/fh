# Custom Domains per Tenant — Design Note

**Status:** Not planned for current iteration. Deferred until paying customers ask.
**Last reviewed:** 2026-05-13

---

## Problem

Today every tenant's public site lives at `fhportal.com/p/{slug}` (e.g.
`fhportal.com/p/marina-realty`). Some tenants will want their listings served
under their own brand:

- **Flavor A:** a subdomain on a domain we own — `marina.aqarflow.com`
- **Flavor B:** a fully custom domain they own — `marinarealty.ae`

The two flavors have very different complexity.

---

## Flavor A — Subdomain on a domain we own

Example: `marina.aqarflow.com`

### How it works
1. We own `aqarflow.com`. DNS wildcard `*.aqarflow.com → Railway/Cloudflare edge`.
2. Tenant picks a subdomain in their settings (default = their slug).
3. Wildcard TLS cert covers everything (one cert, free via Cloudflare / Let's Encrypt).
4. Next.js `middleware.ts` reads `request.headers.host`, splits off the
   subdomain, looks up the tenant by subdomain, rewrites the URL internally
   to `/p/{slug}/...`.

### Codebase changes
- 1 migration adding `tenants.subdomain TEXT UNIQUE` (or repurpose `slug`).
- ~20 lines in `apps/web/src/middleware.ts` — host parser + URL rewrite for
  non-app subdomains.
- Settings UI for the tenant to claim/change their subdomain (admin-approved
  or self-serve).

### Cost
~$10/year for the apex domain. No per-tenant fees.

### Effort
~1 day for a solo dev.

### Limitation
Branded as `marina.**aqarflow**.com`, not `marinarealty.ae`. Some clients
won't like this.

---

## Flavor B — True custom apex / third-party domains

Example: `marinarealty.ae` belongs to the tenant.

### How it works
1. Tenant pastes their domain in settings.
2. We generate a verification token (TXT record value).
3. Tenant adds two DNS records at their registrar:
   - `_aqarflow-verify.marinarealty.ae TXT <token>` — ownership proof.
   - `marinarealty.ae CNAME proxy.aqarflow.com` — or an A-record / ALIAS for
     apex domains (most consumer DNS hosts don't allow CNAME at apex).
4. Backend polls/checks the TXT, marks the domain verified.
5. We **issue a TLS cert** for `marinarealty.ae` via Let's Encrypt ACME
   (DNS-01 challenge against a domain we control, or HTTP-01 once the CNAME
   is live).
6. Cert renewed every ~90 days automatically.
7. Edge proxy reads `Host: marinarealty.ae`, looks up the tenant in a
   `custom_domains` table, serves their public site.

### Codebase + infra changes
- New table:
  ```
  tenant_custom_domains (
    id, tenant_id, domain, verification_token,
    verified_at, cert_status, cert_expires_at, created_at, updated_at
  )
  ```
- DNS verification worker (polls every minute until verified).
- Cert issuance + renewal worker (Let's Encrypt ACME, or delegate to a
  managed provider — see below).
- Cert storage layer (we need to terminate TLS somewhere).
- Settings UI: add-domain form, verification status display, troubleshooting
  help (DNS propagation notes etc).

### The hard part: TLS termination + routing

Railway doesn't natively support per-tenant custom domains in a usable way
— you can attach ~20 custom domains to a service, but they apply to the
*service*, not per-tenant data lookups.

| Option | Cost | Pain |
|---|---|---|
| **Cloudflare for SaaS** | ~$0.10/domain/mo + Business plan minimums (~$200/mo) | Easiest — Cloudflare issues certs + routes to us, we just call their API. **Recommended.** |
| **Vercel for SaaS** | Pay-per-domain | Same shape as Cloudflare. Vercel is Next-native so smoother integration. |
| **DIY (Caddy/Traefik on a VPS)** | $5/mo VPS | You operate cert issuance + reverse proxying yourself. Not solo-dev friendly. |

### Effort
- 2–4 days with Cloudflare for SaaS.
- 1–2 weeks DIY.
- Plus ongoing ops burden (renewal monitoring, expired-cert alerting).

---

## Recommendation

1. **Ship Flavor A first.** Subdomains on `aqarflow.com`. 1 day, no infra
   changes, no recurring costs. Most early customers won't care.
2. **Add Flavor B later**, only after a paying customer asks. Use
   **Cloudflare for SaaS** when you do — do not DIY TLS.

Doing Flavor A early is valuable because it forces us to build the
lookup-by-host plumbing. Once that exists, swapping in Cloudflare for SaaS
becomes a 2-day sprint instead of a 2-week project.

---

## Concrete implementation sketch (Flavor A)

When the time comes:

```
infra/alembic/versions/00XX_tenant_subdomain.py    # tenants.subdomain TEXT UNIQUE
apps/api/schemas/tenant.py                         # expose subdomain in TenantUpdateRequest
apps/api/routers/tenants.py                        # validate subdomain uniqueness + reserved list
apps/api/routers/public_site.py                    # accept lookup by subdomain (in addition to slug)
apps/web/src/middleware.ts                         # host parser: if subdomain not in {www, app, api, admin}, rewrite to /p/{tenant.slug}
apps/web/src/app/(app)/settings/public-site/...    # UI to claim/change subdomain
infra: DNS wildcard *.aqarflow.com -> edge
```

## Concrete implementation sketch (Flavor B, later)

```
+ migration: tenant_custom_domains (id, tenant_id, domain, status, cert_*, verification_token, ...)
+ service: custom_domain_verifier         # dnspython TXT lookup
+ service: cloudflare_saas_client         # API client: add hostname, fetch status, remove
+ background worker: poll verify + cert renewal status
+ settings UI: add-domain form + status badges + DNS-instructions display
+ backend: tenant lookup by host header (cached, since this fires on every public request)
```

---

## Decision

**Defer both flavors.** Revisit when:
- A paying customer explicitly asks (signal that the limitation is hurting sales), or
- We have ≥10 active tenants (subdomains become a UX nicety worth doing).
