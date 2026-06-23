import { NextRequest, NextResponse } from "next/server";
import {
  getCurrentAmostUser,
  isGlobalAdminUser,
  jsonError,
} from "../../../../lib/amostServerAuth";
import {
  canManageEvent,
  isActiveEventOfficial,
  toPositiveBigInt,
} from "../../../../lib/eventOfficialAccess";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentAmostUser(request);
    if (!user) {
      return jsonError("Sesi login tidak valid. Silakan login ulang.", 401, "UNAUTHORIZED");
    }

    const { searchParams } = new URL(request.url);
    const eventId = toPositiveBigInt(searchParams.get("eventId"));

    if (!eventId) {
      return jsonError("eventId wajib diisi.", 400, "EVENT_ID_REQUIRED");
    }

    const globalAdmin = isGlobalAdminUser(user);
    const officialEvent = await isActiveEventOfficial(user.id, eventId);
    const allowed = await canManageEvent(user, eventId);

    return NextResponse.json({
      ok: true,
      data: {
        event_id: eventId,
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          roleLabel: user.roleLabel,
        },
        is_global_admin: globalAdmin,
        is_official_event: officialEvent,
        can_manage_event: allowed,
      },
    });
  } catch (error) {
    console.error("GET /api/admin/event-officials/check error", error);
    return jsonError("Gagal mengecek akses event.", 500, "SERVER_ERROR");
  }
}
