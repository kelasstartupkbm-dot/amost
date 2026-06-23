import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getCurrentUser, isAdmin } from "@/lib/current-user";

type RouteContext = {
  params: {
    id: string;
  };
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { ok: false, message: "Belum login." },
        { status: 401 }
      );
    }

    if (!isAdmin(currentUser)) {
      return NextResponse.json(
        { ok: false, message: "Akses ditolak." },
        { status: 403 }
      );
    }

    const eventId = Number(context.params.id);

    if (!Number.isFinite(eventId)) {
      return NextResponse.json(
        { ok: false, message: "ID event tidak valid." },
        { status: 400 }
      );
    }

    const db = getDb();

    const result = await db.query(
      `
      SELECT
        e.id,
        e.title,
        e.slug,
        e.description,
        e.event_type,
        e.location,
        e.start_date,
        e.end_date,
        e.distance_km,
        e.ticket_price,
        e.max_participants,
        e.doorprize_count,
        e.status,
        e.cover_image,
        e.created_by,
        e.created_at,
        e.updated_at,
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

    if (!result.rowCount) {
      return NextResponse.json(
        { ok: false, message: "Event tidak ditemukan." },
        { status: 404 }
      );
    }

    const event = result.rows[0];

    return NextResponse.json({
      ok: true,
      event: {
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
        createdBy: event.created_by,
        createdAt: event.created_at,
        updatedAt: event.updated_at,
        participantCount: event.participant_count,
      },
    });
  } catch (error) {
    console.error("ADMIN_EVENT_DETAIL_GET_ERROR", error);

    const message =
      error instanceof Error ? error.message : "Gagal mengambil detail event.";

    return NextResponse.json(
      { ok: false, message: `Gagal mengambil detail event: ${message}` },
      { status: 500 }
    );
  }
}
