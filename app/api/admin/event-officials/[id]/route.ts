import { NextRequest, NextResponse } from "next/server";
import { dbQuery } from "../../../lib/amostDb";
import { jsonError, requireAmostAdmin } from "../../../lib/amostServerAuth";

export const dynamic = "force-dynamic";

function toPositiveId(value: unknown) {
  const clean = String(value || "").trim();

  if (!/^\d+$/.test(clean)) {
    return null;
  }

  return clean;
}

function pickBodyValue(body: any, keys: string[]) {
  for (const key of keys) {
    if (body?.[key] !== undefined && body?.[key] !== null) {
      return body[key];
    }
  }

  return "";
}

async function requireAdminResponse() {
  const auth: any = await requireAmostAdmin();

  if (auth?.response) {
    return {
      response: auth.response as NextResponse,
      user: null,
    };
  }

  return {
    response: null,
    user: auth?.user || auth,
  };
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdminResponse();
    if (auth.response) return auth.response;

    const eventId = toPositiveId(request.nextUrl.searchParams.get("eventId"));

    const params: unknown[] = [];
    let whereSql = "";

    if (eventId) {
      params.push(eventId);
      whereSql = `WHERE eo.event_id = $${params.length}`;
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
          eo.created_by,
          eo.created_at,
          eo.updated_at,
          u.full_name AS user_name,
          u.full_name AS full_name,
          u.email AS email,
          e.title AS event_title,
          e.title AS event_name
        FROM event_officials eo
        LEFT JOIN users u ON u.id = eo.user_id
        LEFT JOIN events e ON e.id = eo.event_id
        ${whereSql}
        ORDER BY eo.created_at DESC, eo.id DESC
        LIMIT 300
      `,
      params
    );

    return NextResponse.json({
      ok: true,
      data: result.rows,
      items: result.rows,
      eventOfficials: result.rows,
      total: result.rows.length,
    });
  } catch (error: any) {
    console.error("GET /api/admin/event-officials failed:", error);

    return jsonError(error?.message || "Data Official Event belum bisa dimuat.", 500, {
      code: "SERVER_ERROR",
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdminResponse();
    if (auth.response) return auth.response;

    const body = await request.json().catch(() => ({}));

    const eventId = toPositiveId(
      pickBodyValue(body, ["eventId", "event_id", "event"])
    );
    const userId = toPositiveId(
      pickBodyValue(body, ["userId", "user_id", "user"])
    );

    const permissionLevel = String(
      pickBodyValue(body, [
        "permissionLevel",
        "permission_level",
        "level",
        "accessLevel",
      ]) || "operator"
    )
      .trim()
      .toLowerCase();

    const notesValue = pickBodyValue(body, ["notes", "note", "catatan"]);
    const notes =
      notesValue === undefined || notesValue === null
        ? null
        : String(notesValue).trim() || null;

    if (!eventId || !userId) {
      return jsonError("Event ID dan User ID wajib diisi.", 400, {
        code: "VALIDATION_ERROR",
      });
    }

    const eventCheck = await dbQuery(
      `
        SELECT id
        FROM events
        WHERE id = $1
        LIMIT 1
      `,
      [eventId]
    );

    if (eventCheck.rows.length === 0) {
      return jsonError("Event tidak ditemukan.", 404, {
        code: "EVENT_NOT_FOUND",
      });
    }

    const userCheck = await dbQuery(
      `
        SELECT id
        FROM users
        WHERE id = $1
        LIMIT 1
      `,
      [userId]
    );

    if (userCheck.rows.length === 0) {
      return jsonError("User tidak ditemukan.", 404, {
        code: "USER_NOT_FOUND",
      });
    }

    const existing = await dbQuery(
      `
        SELECT id
        FROM event_officials
        WHERE event_id = $1
          AND user_id = $2
        LIMIT 1
      `,
      [eventId, userId]
    );

    if (existing.rows.length > 0) {
      return jsonError("User ini sudah menjadi Official Event pada event tersebut.", 409, {
        code: "DUPLICATE_OFFICIAL",
      });
    }

    const result = await dbQuery(
      `
        INSERT INTO event_officials (
          event_id,
          user_id,
          permission_level,
          status,
          notes,
          created_by,
          created_at,
          updated_at
        )
        VALUES ($1, $2, $3, 'active', $4, $5, NOW(), NOW())
        RETURNING
          id,
          event_id,
          user_id,
          permission_level,
          status,
          notes,
          created_by,
          created_at,
          updated_at
      `,
      [eventId, userId, permissionLevel || "operator", notes, auth.user?.id || null]
    );

    return NextResponse.json(
      {
        ok: true,
        message: "Official Event berhasil ditambahkan.",
        data: result.rows[0],
        official: result.rows[0],
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("POST /api/admin/event-officials failed:", error);

    return jsonError(error?.message || "Official Event gagal ditambahkan.", 500, {
      code: "SERVER_ERROR",
    });
  }
}
