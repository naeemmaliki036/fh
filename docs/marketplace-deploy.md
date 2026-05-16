# Marketplace Railway Deployment

## New Railway Service

Service name: `fh-staging-marketplace`

Settings in Railway dashboard:

| Setting | Value |
|---|---|
| Root directory | `apps/marketplace` |
| Build command | `pnpm install && pnpm build` |
| Start command | `pnpm start` |

## Required Environment Variables

```
NEXT_PUBLIC_API_BASE_URL=https://fh-staging-api.up.railway.app
NEXT_PUBLIC_PORTAL_BRAND_NAME=PropertyPoint
NEXT_PUBLIC_PORTAL_BRAND_TAGLINE=UAE's open property marketplace
```

## CORS

The API reads `CORS_ORIGINS` from env (`settings.cors_origins`). Add the new
marketplace origin to that variable in the `fh-staging-api` Railway service:

```
CORS_ORIGINS=https://fh-staging-web.up.railway.app,https://fh-staging-marketplace.up.railway.app
```

No code change required — CORS is already env-driven in `apps/api/main.py`.
