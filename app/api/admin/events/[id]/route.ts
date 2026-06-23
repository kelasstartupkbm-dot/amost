import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getCurrentUser, isAdmin } from "@/lib/current-user";

type RouteContext = { params: { id: string } };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) return NextResponse.json({ ok: false, message: "Belum login." }, { status: 401 });
    if (!isAdmin(currentUser)) return NextResponse.json({ ok: false, message: "Akses ditolak." }, { status: 403 });

    const eventId = Number(context.params.id);
    if (!Number.isFinite(eventId)) return NextResponse.json({ ok: false, message: "ID event tidak valid." }, { status: 400 });

    const db = getDb();
    const result = await db.query(
      `
      SELECT
        e.id, e.title, e.slug, e.description, e.event_type, e.location,
        e.start_date, e.end_date, e.distance_km, e.ticket_price,
        e.max_participants, e.doorprize_count, e.status, e.cover_image,
        e.gpx_filename, e.gpx_content, e.created_by, e.created_at, e.updated_at,
        COALESCE(r.participant_count, 0)::int AS participant_count
      FROM events e
      LEFT JOIN (
        SELECT event_id, COUNT(*)::int AS participant_count
        FROM event_registrations
        GROUP BY event_id
      ) r ON r.event_id = e.id
      WHERE e.id = $1
      LIMIT 1
      `,
      [eventId]
    );

    if (!result.rowCount) return NextResponse.json({ ok: false, message: "Event tidak ditemukan." }, { status: 404 });
    return NextResponse.json({ ok: true, event: mapEvent(result.rows[0]) });
  } catch (error) {
    console.error("ADMIN_EVENT_DETAIL_GET_ERROR", error);
    return NextResponse.json({ ok: false, message: error instanceof Error ? error.message : "Gagal mengambil detail event." }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) return NextResponse.json({ ok: false, message: "Belum login." }, { status: 401 });
    if (!isAdmin(currentUser)) return NextResponse.json({ ok: false, message: "Akses ditolak." }, { status: 403 });

    const eventId = Number(context.params.id);
    if (!Number.isFinite(eventId)) return NextResponse.json({ ok: false, message: "ID event tidak valid." }, { status: 400 });

    const body = await request.json();

    const title = String(body.title || "").trim();
    const slug = createSlug(String(body.slug || title));
    const description = String(body.description || "").trim();
    const eventType = String(body.eventType || "Event").trim();
    const location = String(body.location || "").trim();
    const startDate = String(body.startDate || "").trim();
    const endDate = String(body.endDate || startDate).trim();
    const distanceKm = safeNumber(body.distanceKm);
    const ticketPrice = safeNumber(body.ticketPrice);
    const maxParticipants = Math.floor(safeNumber(body.maxParticipants));
    const doorprizeCount = Math.floor(safeNumber(body.doorprizeCount));
    const coverImage = String(body.coverImage || "").trim();
    const gpxFilename = String(body.gpxFilename || "").trim();
    const gpxContent = String(body.gpxContent || "").trim();
    const status = String(body.status || "draft").trim();

    if (!title) return NextResponse.json({ ok: false, message: "Nama event wajib diisi." }, { status: 400 });
    if (!slug) return NextResponse.json({ ok: false, message: "Slug event wajib diisi." }, { status: 400 });
    if (!location) return NextResponse.json({ ok: false, message: "Lokasi event wajib diisi." }, { status: 400 });
    if (!startDate) return NextResponse.json({ ok: false, message: "Tanggal mulai wajib diisi." }, { status: 400 });
    if (!["draft", "published", "closed", "finished"].includes(status)) {
      return NextResponse.json({ ok: false, message: "Status event tidak valid." }, { status: 400 });
    }

    const db = getDb();

    const duplicate = await db.query(
      `SELECT id FROM events WHERE slug = $1 AND id <> $2 LIMIT 1`,
      [slug, eventId]
    );

    if (duplicate.rowCount) {
      return NextResponse.json({ ok: false, message: "Slug sudah digunakan event lain." }, { status: 409 });
    }

    const result = await db.query(
      `
      UPDATE events
      SET
        title = $1,
        slug = $2,
        description = $3,
        event_type = $4,
        location = $5,
        start_date = $6::timestamp,
        end_date = $7::timestamp,
        distance_km = $8,
        ticket_price = $9,
        max_participants = $10,
        doorprize_count = $11,
        status = $12,
        cover_image = $13,
        gpx_filename = $14,
        gpx_content = $15,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $16
      RETURNING id, title, slug, status, updated_at
      `,
      [
        title,
        slug,
        description,
        eventType,
        location,
        startDate,
        endDate,
        distanceKm,
        ticketPrice,
        maxParticipants,
        doorprizeCount,
        status,
        coverImage || null,
        gpxFilename || null,
        gpxContent || null,
        eventId,
      ]
    );

    if (!result.rowCount) return NextResponse.json({ ok: false, message: "Event tidak ditemukan." }, { status: 404 });

    return NextResponse.json({
      ok: true,
      message: "Event berhasil diperbarui.",
      event: {
        id: Number(result.rows[0].id),
        title: result.rows[0].title,
        slug: result.rows[0].slug,
        status: result.rows[0].status,
        updatedAt: result.rows[0].updated_at,
      },
    });
  } catch (error) {
    console.error("ADMIN_EVENT_DETAIL_PATCH_ERROR", error);
    return NextResponse.json({ ok: false, message: error instanceof Error ? error.message : "Gagal memperbarui event." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) return NextResponse.json({ ok: false, message: "Belum login." }, { status: 401 });
    if (!isAdmin(currentUser)) return NextResponse.json({ ok: false, message: "Akses ditolak." }, { status: 403 });

    const eventId = Number(context.params.id);
    if (!Number.isFinite(eventId)) return NextResponse.json({ ok: false, message: "ID event tidak valid." }, { status: 400 });

    const db = getDb();
    const participants = await db.query(`SELECT COUNT(*)::int AS total FROM event_registrations WHERE event_id = $1`, [eventId]);

    if (Number(participants.rows[0]?.total || 0) > 0) {
      return NextResponse.json({ ok: false, message: "Event tidak bisa dihapus karena sudah memiliki peserta. Ubah status menjadi Closed/Finished." }, { status: 409 });
    }

    const result = await db.query(`DELETE FROM events WHERE id = $1 RETURNING id`, [eventId]);
    if (!result.rowCount) return NextResponse.json({ ok: false, message: "Event tidak ditemukan." }, { status: 404 });

    return NextResponse.json({ ok: true, message: "Event berhasil dihapus." });
  } catch (error) {
    console.error("ADMIN_EVENT_DETAIL_DELETE_ERROR", error);
    return NextResponse.json({ ok: false, message: error instanceof Error ? error.message : "Gagal menghapus event." }, { status: 500 });
  }
}

function mapEvent(event: any) {
  return {
    id: Number(event.id),
    title: event.title,
    slug: event.slug,
    description: event.description,
    eventType: event.event_type,
    location: event.location,
    startDate: event.start_date,
    endDate: event.end_date,
    distanceKm: event.distance_km,
    ticketPrice: event.ticket_price,
    maxParticipants: event.max_participants,
    doorprizeCount: event.doorprize_count,
    status: event.status,
    coverImage: event.cover_image,
    gpxFilename: event.gpx_filename,
    gpxContent: event.gpx_content,
    createdBy: event.created_by,
    createdAt: event.created_at,
    updatedAt: event.updated_at,
    participantCount: event.participant_count,
  };
}

function safeNumber(value: unknown) {
  const numberValue = Number(value || 0);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

function createSlug(value: string) {
  return value.toLowerCase().trim().replace(/['"]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
