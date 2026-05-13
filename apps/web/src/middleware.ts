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
