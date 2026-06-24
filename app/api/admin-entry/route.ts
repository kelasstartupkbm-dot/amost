import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { hashSessionToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

function normalizeRole(value: unknown) {
  return String(value || "").trim().toLowerCase().replace(/\s+/g, "_");
}

function isGlobalAdminRole(role: unknown) {
  const clean = normalizeRole(role);

  return clean === "super_admin" || clean === "staff_amost";
}

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("amost_session")?.value;

    if (!token) {
      return NextResponse.redirect(new URL("/login?next=/home", request.url));
    }

    const db = getDb();
    const tokenHash = hashSessionToken(token);

    const result = await db.query(
      `
      SELECT
        users.id,
        users.full_name,
        users.email,
        users.status,
        roles.name AS role,
        sessions.expires_at
      FROM sessions
      JOIN users ON users.id = sessions.user_id
      JOIN roles ON roles.id = users.role_id
      WHERE sessions.token_hash = $1
        AND sessions.expires_at > NOW()
      LIMIT 1
      `,
      [tokenHash]
    );

    if (!result.rowCount) {
      return NextResponse.redirect(new URL("/login?next=/home", request.url));
    }

    const user = result.rows[0];

    if (user.status !== "active" || !isGlobalAdminRole(user.role)) {
      return NextResponse.redirect(new URL("/home?admin=forbidden", request.url));
    }

    const response = NextResponse.redirect(new URL("/admin", request.url));

    response.cookies.set("amost_admin_gate", "open", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/admin",
      maxAge: 10 * 60,
    });

    return response;
  } catch (error) {
    console.error("ADMIN_ENTRY_ERROR", error);

    return NextResponse.redirect(new URL("/home?admin=error", request.url));
  }
}
