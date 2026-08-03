import { NextResponse, type NextRequest } from "next/server";
import { AUTH_COOKIE_NAME } from "@/lib/authCookies";

/**
 * Routes that should render without a valid token. Everything else redirects
 * to /login. Keep this list tight - this is an admin dashboard, public
 * surface should be minimal.
 */
const PUBLIC_PATHS = [
  "/login",
  // Embeddable forms are anonymous and framed by third-party sites. The auth
  // cookie is SameSite=Lax so it never arrives in a cross-site iframe anyway -
  // gating these would 302 to /login, which sends frame-ancestors 'none'.
  "/embed",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Let Next internals and static files through untouched.
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname === "/favicon.ico" ||
    pathname.match(/\.(svg|png|jpg|jpeg|gif|webp|ico|css|js|woff2?)$/)
  ) {
    return NextResponse.next();
  }

  const isPublic = PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );

  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

  // Unauthenticated user trying to reach a protected page → /login
  if (!token && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("returnTo", pathname + request.nextUrl.search);
    return NextResponse.redirect(url);
  }

  // Authenticated user trying to reach /login → bounce them to root.
  if (token && pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // Run on every request except Next internals. We still do the fine-grained
  // filtering inside the function above.
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
