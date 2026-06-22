import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getCurrentUser, isAdmin } from "@/lib/current-user";

export async function GET() {
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

    const db = getDb();

    const result = await db.query(`
      SELECT
        events.id,
        events.title,
        events.slug,
        events.description,
        events.event_type,
        events.location,
        events.start_date,
        events.end_date,
        events.distance_km,
        events.ticket_price,
        events.max_participants,
        events.doorprize_count,
        events.status,
        events.cover_image,
        events.created_at,
        COALESCE(COUNT(event_registrations.id), 0)::int AS participant_count
      FROM events
      LEFT JOIN event_registrations
        ON event_registrations.event_id = events.id
      GROUP BY events.id
      ORDER BY events.created_at DESC
    `);

    return NextResponse.json({
      ok: true,
      events: result.rows.map((event) => ({
        id: event.id,
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
        createdAt: event.created_at,
        participantCount: event.participant_count,
      })),
    });
  } catch (error) {
    console.error("ADMIN_EVENTS_GET_ERROR", error);

    const message =
      error instanceof Error ? error.message : "Gagal mengambil data event.";

    return NextResponse.json(
      { ok: false, message: `Gagal mengambil event: ${message}` },
      { status: 500 }
    );
  }
}
