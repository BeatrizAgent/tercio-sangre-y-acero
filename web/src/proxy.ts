import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE_NAME = "tercio_session";
const PUBLIC_PATHS = ["/login", "/favicon.ico", "/icon.png", "/apple-icon.png"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSessionCookie = Boolean(request.cookies.get(SESSION_COOKIE_NAME)?.value);
  if (pathname === "/login" && hasSessionCookie) {
    return NextResponse.redirect(new URL("/city", request.url));
  }

  if (
    PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`)) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/assets") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/health")
  ) {
    return NextResponse.next();
  }

  if (!hasSessionCookie && !pathname.startsWith("/api")) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("reason", "missing-session");
    const response = NextResponse.redirect(loginUrl);
    response.cookies.set(SESSION_COOKIE_NAME, "", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0,
    });
    return response;
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!.*\\.).*)"],
};
