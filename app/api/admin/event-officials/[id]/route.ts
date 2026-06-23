import { NextRequest, NextResponse } from "next/server";
import {
  jsonError,
  requireAmostAdmin,
} from "../../../../lib/amostServerAuth";
import {
  deleteEventOfficial,
  getEventOfficialById,
  normalizeOfficialStatus,
  normalizePermissionLevel,
  toPositiveBigInt,
  updateEventOfficial,
} from "../../../../lib/eventOfficialAccess";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: {
    id: string;
  };
};

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const auth = await requireAmostAdmin(request);
    if (auth.response) return auth.response;

    const id = toPositiveBigInt(context.params.id);
    if (!id) return jsonError("ID Official Event tidak valid.", 400, "INVALID_ID");

    const official = await getEventOfficialById(id);
    if (!official) {
      return jsonError("Official Event tidak ditemukan.", 404, "NOT_FOUND");
    }

    return NextResponse.json({
      ok: true,
      data: official,
    });
  } catch (error) {
    console.error("GET /api/admin/event-officials/[id] error", error);
    return jsonError("Gagal memuat Official Event.", 500, "SERVER_ERROR");
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const auth = await requireAmostAdmin(request);
    if (auth.response) return auth.response;

    const id = toPositiveBigInt(context.params.id);
    if (!id) return jsonError("ID Official Event tidak valid.", 400, "INVALID_ID");

    const body = await request.json().catch(() => null);
    if (!body) {
      return jsonError("Body request tidak valid.", 400, "INVALID_BODY");
    }

    const official = await updateEventOfficial({
      id,
      permissionLevel:
        body.permission_level || body.permissionLevel
          ? normalizePermissionLevel(body.permission_level ?? body.permissionLevel)
          : undefined,
      status: body.status ? normalizeOfficialStatus(body.status) : undefined,
      notes: typeof body.notes === "string" ? body.notes.trim() : undefined,
    });

    if (!official) {
      return jsonError("Official Event tidak ditemukan.", 404, "NOT_FOUND");
    }

    return NextResponse.json({
      ok: true,
      message: "Official Event berhasil diperbarui.",
      data: official,
    });
  } catch (error) {
    console.error("PATCH /api/admin/event-officials/[id] error", error);
    return jsonError("Gagal memperbarui Official Event.", 500, "SERVER_ERROR");
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const auth = await requireAmostAdmin(request);
    if (auth.response) return auth.response;

    const id = toPositiveBigInt(context.params.id);
    if (!id) return jsonError("ID Official Event tidak valid.", 400, "INVALID_ID");

    const deleted = await deleteEventOfficial(id);
    if (!deleted) {
      return jsonError("Official Event tidak ditemukan.", 404, "NOT_FOUND");
    }

    return NextResponse.json({
      ok: true,
      message: "Official Event berhasil dihapus.",
    });
  } catch (error) {
    console.error("DELETE /api/admin/event-officials/[id] error", error);
    return jsonError("Gagal menghapus Official Event.", 500, "SERVER_ERROR");
  }
}
