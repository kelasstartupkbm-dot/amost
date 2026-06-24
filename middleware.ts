import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    const entryToken = searchParams.get("entry") || "";
    const cookieToken = request.cookies.get("amost_admin_entry")?.value || "";

    if (entryToken && cookieToken && entryToken === cookieToken) {
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
