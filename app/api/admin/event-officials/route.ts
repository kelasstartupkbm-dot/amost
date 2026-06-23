import { NextRequest, NextResponse } from "next/server";
import {
  jsonError,
  requireAmostAdmin,
} from "../../../lib/amostServerAuth";
import {
  assignEventOfficial,
  ensureUserExists,
  listEventOfficials,
  normalizeOfficialStatus,
  normalizePermissionLevel,
  toPositiveBigInt,
} from "../../../lib/eventOfficialAccess";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAmostAdmin(request);
    if (auth.response) return auth.response;

    const { searchParams } = new URL(request.url);
    const eventId = toPositiveBigInt(searchParams.get("eventId"));
    const userId = toPositiveBigInt(searchParams.get("userId"));
    const rawStatus = searchParams.get("status");
    const status = rawStatus === "all" ? "all" : normalizeOfficialStatus(rawStatus);

    const officials = await listEventOfficials({
      eventId,
      userId,
      status,
    });

    return NextResponse.json({
      ok: true,
      data: officials,
    });
  } catch (error) {
    console.error("GET /api/admin/event-officials error", error);
    return jsonError("Gagal memuat daftar Official Event.", 500, "SERVER_ERROR");
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAmostAdmin(request);
    if (auth.response) return auth.response;

    const body = await request.json().catch(() => null);
    if (!body) {
      return jsonError("Body request tidak valid.", 400, "INVALID_BODY");
    }

    const eventId = toPositiveBigInt(body.event_id ?? body.eventId);
    const userId = toPositiveBigInt(body.user_id ?? body.userId);

    if (!eventId) {
      return jsonError("event_id wajib diisi.", 400, "EVENT_ID_REQUIRED");
    }

    if (!userId) {
      return jsonError("user_id wajib diisi.", 400, "USER_ID_REQUIRED");
    }

    const userExists = await ensureUserExists(userId);
    if (!userExists) {
      return jsonError("User tidak ditemukan.", 404, "USER_NOT_FOUND");
    }

    const permissionLevel = normalizePermissionLevel(
      body.permission_level ?? body.permissionLevel,
    );
    const status = normalizeOfficialStatus(body.status);
    const notes = typeof body.notes === "string" ? body.notes.trim() : null;

    const official = await assignEventOfficial({
      eventId,
      userId,
      permissionLevel,
      status,
      notes,
      createdBy: auth.user?.id || null,
    });

    return NextResponse.json({
      ok: true,
      message: "Official Event berhasil disimpan.",
      data: official,
    });
  } catch (error) {
    console.error("POST /api/admin/event-officials error", error);
    return jsonError("Gagal menyimpan Official Event.", 500, "SERVER_ERROR");
  }
}
