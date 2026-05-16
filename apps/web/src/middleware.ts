import { type NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = [
  "/login",
  "/signup",
  "/platform-login",
  "/pending-approval",
  "/d",
  "/api",
  "/account-status",
  "/contact",
  "/p",
  "/demo",
];

// ---------------------------------------------------------------------------
// Host-aware routing
// ---------------------------------------------------------------------------
// The same apps/web bundle is deployed to two domains:
//   - portal host: tenant agency portal (login-walled, no marketing pages)
//   - public host: AqarFlow marketing site (no /login, no /(app)/*)
// Comma-separated lists let us add custom domains later via Railway env.

const PORTAL_HOSTS = (
  process.env.NEXT_PUBLIC_PORTAL_HOSTS ?? "af-staging-portal.up.railway.app"
).split(",").map((h) => h.trim().toLowerCase()).filter(Boolean);

const PUBLIC_HOSTS = (
  process.env.NEXT_PUBLIC_MARKETING_HOSTS ?? "af-staging-public.up.railway.app"
).split(",").map((h) => h.trim().toLowerCase()).filter(Boolean);

// Routes that belong to the marketing surface (only reachable on the public host).
const MARKETING_ONLY_PREFIXES = ["/", "/demo", "/contact"];

// Routes that belong to the portal app (only reachable on the portal host).
// Login + signup live here so visitors who land on the marketing host with
// /login get bounced to the portal host.
const PORTAL_ONLY_PREFIXES = ["/login", "/signup", "/platform-login", "/pending-approval"];

function hostMatches(host: string, allowed: string[]): boolean {
  const norm = host.toLowerCase().split(":")[0];
  return allowed.some((h) => norm === h || norm.endsWith(`.${h}`));
}

function isMarketingOnlyPath(pathname: string): boolean {
  if (pathname === "/") return true;
  return MARKETING_ONLY_PREFIXES.filter((p) => p !== "/").some((p) =>
    pathname === p || pathname.startsWith(`${p}/`),
  );
}

function isPortalOnlyPath(pathname: string): boolean {
  return PORTAL_ONLY_PREFIXES.some((p) =>
    pathname === p || pathname.startsWith(`${p}/`),
  );
}

const PLATFORM_PATHS = [
  "/tenants",
  "/notifications",
  "/users",
  "/email-templates",
  "/email-outbox",
];

function isPublicPath(pathname: string): boolean {
  if (pathname === "/") return true;
  return PUBLIC_PATHS.some((p) => pathname.startsWith(p));
}

function isPlatformPath(pathname: string): boolean {
  return PLATFORM_PATHS.some((p) => pathname.startsWith(p));
}

export function middleware(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;
  const host = request.headers.get("host") ?? "";

  // 1. Host-aware redirects so portal + public domains serve distinct surfaces.
  //    Both hosts get the auth/api/p/d/account-status routes untouched.
  const onPortalHost = hostMatches(host, PORTAL_HOSTS);
  const onPublicHost = hostMatches(host, PUBLIC_HOSTS);

  if (onPortalHost && isMarketingOnlyPath(pathname)) {
    // Portal host: marketing pages don't belong here. Drop visitors at /login.
    const url = new URL("/login", request.url);
    return NextResponse.redirect(url);
  }
  if (onPublicHost && isPortalOnlyPath(pathname)) {
    // Public host: send login / signup to the portal subdomain when known.
    const target = PORTAL_HOSTS[0];
    if (target) {
      const url = new URL(request.url);
      url.host = target;
      url.protocol = "https:";
      url.port = "";
      return NextResponse.redirect(url);
    }
  }

  if (isPublicPath(pathname)) return NextResponse.next();

  if (isPlatformPath(pathname)) {
    const platformToken = request.cookies.get("fh_platform_access_token")?.value;
    if (!platformToken) {
      const url = new URL("/platform-login", request.url);
      url.searchParams.set("redirect", pathname);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // All other protected routes require tenant token
  const tenantToken = request.cookies.get("fh_tenant_access_token")?.value;
  if (!tenantToken) {
    const url = new URL("/login", request.url);
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
