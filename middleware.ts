import { NextRequest, NextResponse } from "next/server";

const ADMIN_COOKIE_NAME = "amost_admin_entry";

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    const entryToken = searchParams.get("entry") || "";
    const cookieToken = request.cookies.get(ADMIN_COOKIE_NAME)?.value || "";

    if (entryToken) {
      const response = NextResponse.next();

      response.cookies.set(ADMIN_COOKIE_NAME, entryToken, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 8,
      });

      return response;
    }

    if (cookieToken) {
      return NextResponse.next();
    }

    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/home";
    redirectUrl.search = "?admin=use-control-panel";

    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
