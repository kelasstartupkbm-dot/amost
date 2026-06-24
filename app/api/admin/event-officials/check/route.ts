import { NextRequest, NextResponse } from "next/server";
import { dbQuery } from "../../../../lib/amostDb";
import {
  getCurrentAmostUser,
  isGlobalAdminUser,
  jsonError,
} from "../../../../lib/amostServerAuth";

export const dynamic = "force-dynamic";

function toPositiveId(value: unknown) {
  const clean = String(value || "").trim();

  if (!/^\d+$/.test(clean)) {
    return null;
  }

  return clean;
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentAmostUser(request);

    if (!user) {
      return jsonError("Sesi login tidak valid. Silakan login ulang.", 401, {
        code: "UNAUTHORIZED",
      });
    }

    const eventId = toPositiveId(
      request.nextUrl.searchParams.get("eventId") ||
        request.nextUrl.searchParams.get("event_id")
    );

    if (isGlobalAdminUser(user)) {
      return NextResponse.json({
        ok: true,
        allowed: true,
        access: true,
        role: user.roleName,
        user,
        reason: "GLOBAL_ADMIN",
      });
    }

    if (!eventId) {
      return jsonError("Event ID wajib diisi.", 400, {
        code: "EVENT_ID_REQUIRED",
      });
    }

    const result = await dbQuery(
      `
        SELECT
          id,
          event_id,
          user_id,
          permission_level,
          status,
          notes
        FROM event_officials
        WHERE event_id = $1
          AND user_id = $2
          AND status = 'active'
        LIMIT 1
      `,
      [eventId, user.id]
    );

    const official = result.rows[0];

    if (!official) {
      return NextResponse.json({
        ok: true,
        allowed: false,
        access: false,
        user,
        official: null,
        reason: "NOT_EVENT_OFFICIAL",
      });
    }

    return NextResponse.json({
      ok: true,
      allowed: true,
      access: true,
      user,
      official,
      permissionLevel: official.permission_level,
      reason: "EVENT_OFFICIAL",
    });
  } catch (error: any) {
    console.error("GET /api/admin/event-officials/check failed:", error);

    return jsonError(error?.message || "Gagal mengecek akses Official Event.", 500, {
      code: "SERVER_ERROR",
    });
  }
}
