import { NextRequest, NextResponse } from "next/server";
import { getCurrentAmostUser } from "../../../lib/amostServerAuth";

export const dynamic = "force-dynamic";

function normalizeRole(value: unknown) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

function canOpenAdmin(user: any) {
  const role = normalizeRole(
    user?.role ||
      user?.role_name ||
      user?.roleKey ||
      user?.role_key ||
      user?.roleLabel ||
      user?.role_label,
  );

  const roleId = Number(user?.role_id || user?.roleId || 0);

  return (
    role === "super_admin" ||
    role === "staff_amost" ||
    roleId === 1 ||
    roleId === 2
  );
}

function getSafeAdminNext(rawNext: string | null) {
  if (!rawNext) return "/admin";

  if (!rawNext.startsWith("/admin")) return "/admin";

  if (rawNext.startsWith("//")) return "/admin";

  return rawNext;
}

export async function GET(request: NextRequest) {
  let user: any = null;

  try {
    user = await getCurrentAmostUser(request);
  } catch (error) {
    console.error("admin-entry auth error", error);
  }

  if (!user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", "/home");
    return NextResponse.redirect(loginUrl);
  }

  if (!canOpenAdmin(user)) {
    const homeUrl = new URL("/home", request.url);
    homeUrl.searchParams.set("admin", "forbidden");
    return NextResponse.redirect(homeUrl);
  }

  const token = crypto.randomUUID();
  const rawNext = request.nextUrl.searchParams.get("next");
  const safeNext = getSafeAdminNext(rawNext);

  const adminUrl = new URL(safeNext, request.url);
  adminUrl.searchParams.set("entry", token);

  const response = NextResponse.redirect(adminUrl);

  response.cookies.set("amost_admin_entry", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/admin",
    maxAge: 60,
  });

  return response;
}
