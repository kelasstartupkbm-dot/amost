import { NextRequest, NextResponse } from "next/server";
import { dbQuery } from "../../../../lib/amostDb";
import { jsonError, requireAmostAdmin } from "../../../../lib/amostServerAuth";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: {
    id: string;
  };
};

function toPositiveId(value: string) {
  const clean = String(value || "").trim();

  if (!/^\d+$/.test(clean)) {
    return null;
  }

  return clean;
}

async function requireAdminResponse() {
  const auth: any = await requireAmostAdmin();

  if (auth?.response) {
    return auth.response;
  }

  return null;
}

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const authResponse = await requireAdminResponse();
    if (authResponse) return authResponse;

    const id = toPositiveId(context.params.id);

    if (!id) {
      return jsonError("ID Official Event tidak valid.", 400, {
        code: "INVALID_ID",
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
          eo.created_by,
          eo.created_at,
          eo.updated_at,
          u.full_name AS user_name,
          u.email AS email
        FROM event_officials eo
        LEFT JOIN users u ON u.id = eo.user_id
        WHERE eo.id = $1
        LIMIT 1
      `,
      [id]
    );

    const official = result.rows[0];

    if (!official) {
      return jsonError("Official Event tidak ditemukan.", 404, {
        code: "NOT_FOUND",
      });
    }

    return NextResponse.json({
      ok: true,
      data: official,
      official,
    });
  } catch (error: any) {
    console.error("GET /api/admin/event-officials/[id] failed:", error);

    return jsonError(error?.message || "Gagal memuat Official Event.", 500, {
      code: "SERVER_ERROR",
    });
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const authResponse = await requireAdminResponse();
    if (authResponse) return authResponse;

    const id = toPositiveId(context.params.id);

    if (!id) {
      return jsonError("ID Official Event tidak valid.", 400, {
        code: "INVALID_ID",
      });
    }

    const body = await request.json().catch(() => ({}));

    const permissionLevel =
      body.permissionLevel || body.permission_level || body.level || "";
    const status = body.status || "";
    const notes =
      body.notes === undefined || body.notes === null
        ? undefined
        : String(body.notes);

    const updates: string[] = [];
    const params: unknown[] = [];

    if (permissionLevel) {
      params.push(String(permissionLevel).trim());
      updates.push(`permission_level = $${params.length}`);
    }

    if (status) {
      params.push(String(status).trim());
      updates.push(`status = $${params.length}`);
    }

    if (notes !== undefined) {
      params.push(notes.trim() || null);
      updates.push(`notes = $${params.length}`);
    }

    if (updates.length === 0) {
      return jsonError("Tidak ada data yang diubah.", 400, {
        code: "NO_UPDATE",
      });
    }

    updates.push(`updated_at = NOW()`);

    params.push(id);

    const result = await dbQuery(
      `
        UPDATE event_officials
        SET ${updates.join(", ")}
        WHERE id = $${params.length}
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
      params
    );

    const official = result.rows[0];

    if (!official) {
      return jsonError("Official Event tidak ditemukan.", 404, {
        code: "NOT_FOUND",
      });
    }

    return NextResponse.json({
      ok: true,
      message: "Official Event berhasil diperbarui.",
      data: official,
      official,
    });
  } catch (error: any) {
    console.error("PATCH /api/admin/event-officials/[id] failed:", error);

    return jsonError(error?.message || "Gagal memperbarui Official Event.", 500, {
      code: "SERVER_ERROR",
    });
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const authResponse = await requireAdminResponse();
    if (authResponse) return authResponse;

    const id = toPositiveId(context.params.id);

    if (!id) {
      return jsonError("ID Official Event tidak valid.", 400, {
        code: "INVALID_ID",
      });
    }

    const result = await dbQuery(
      `
        DELETE FROM event_officials
        WHERE id = $1
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
      [id]
    );

    const official = result.rows[0];

    if (!official) {
      return jsonError("Official Event tidak ditemukan.", 404, {
        code: "NOT_FOUND",
      });
    }

    return NextResponse.json({
      ok: true,
      message: "Official Event berhasil dihapus.",
      data: official,
      official,
    });
  } catch (error: any) {
    console.error("DELETE /api/admin/event-officials/[id] failed:", error);

    return jsonError(error?.message || "Gagal menghapus Official Event.", 500, {
      code: "SERVER_ERROR",
    });
  }
}
