import { NextRequest, NextResponse } from "next/server";
import { dbQuery } from "../../../lib/amostDb";
import { getCurrentAmostUser, jsonError } from "../../../lib/amostServerAuth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentAmostUser(request);

    if (!user) {
      return jsonError("Sesi login tidak valid. Silakan login ulang.", 401, {
        code: "UNAUTHORIZED",
      });
    }

    const result = await dbQuery(
      `
        SELECT
          eo.id,
          eo.event_id,
          eo.user_id,
          eo.permission_level,
          eo.status,
          eo.notes,
          eo.created_at,
          eo.updated_at,
          e.title AS event_title,
          e.title AS event_name,
          e.slug,
          e.status AS event_status,
          e.category,
          e.quota,
          e.doorprize_count
        FROM event_officials eo
        LEFT JOIN events e ON e.id = eo.event_id
        WHERE eo.user_id = $1
          AND eo.status = 'active'
        ORDER BY eo.created_at DESC, eo.id DESC
      `,
      [user.id]
    );

    return NextResponse.json({
      ok: true,
      data: result.rows,
      items: result.rows,
      total: result.rows.length,
      hasOfficialAccess: result.rows.length > 0,
    });
  } catch (error: any) {
    console.error("GET /api/account/event-officials failed:", error);

    return jsonError(
      error?.message || "Data akses Official Event belum bisa dimuat.",
      500,
      {
        code: "SERVER_ERROR",
      }
    );
  }
}
