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

export async function POST(request: Request) {
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

    const body = await request.json();

    const title = String(body.title || "").trim();
    const slug = createSlug(String(body.slug || title));
    const description = String(body.description || "").trim();
    const eventType = String(body.eventType || "").trim() || "Event";
    const location = String(body.location || "").trim();
    const startDate = String(body.startDate || "").trim();
    const endDate = String(body.endDate || startDate).trim();
    const distanceKm = Number(body.distanceKm || 0);
    const ticketPrice = Number(body.ticketPrice || 0);
    const maxParticipants = Number(body.maxParticipants || 0);
    const doorprizeCount = Number(body.doorprizeCount || 0);
    const coverImage = String(body.coverImage || "").trim();
    const status = String(body.status || "draft").trim();

    if (!title) {
      return NextResponse.json(
        { ok: false, message: "Nama event wajib diisi." },
        { status: 400 }
      );
    }

    if (!slug) {
      return NextResponse.json(
        { ok: false, message: "Slug event wajib diisi." },
        { status: 400 }
      );
    }

    if (!location) {
      return NextResponse.json(
        { ok: false, message: "Lokasi event wajib diisi." },
        { status: 400 }
      );
    }

    if (!startDate) {
      return NextResponse.json(
        { ok: false, message: "Tanggal mulai wajib diisi." },
        { status: 400 }
      );
    }

    if (!["draft", "published", "closed", "finished"].includes(status)) {
      return NextResponse.json(
        { ok: false, message: "Status event tidak valid." },
        { status: 400 }
      );
    }

    const db = getDb();

    const duplicate = await db.query(
      `
      SELECT id
      FROM events
      WHERE slug = $1
      LIMIT 1
      `,
      [slug]
    );

    if (duplicate.rowCount) {
      return NextResponse.json(
        { ok: false, message: "Slug sudah digunakan event lain." },
        { status: 409 }
      );
    }

    const result = await db.query(
      `
      INSERT INTO events (
        title,
        slug,
        description,
        event_type,
        location,
        start_date,
        end_date,
        distance_km,
        ticket_price,
        max_participants,
        doorprize_count,
        status,
        cover_image,
        created_by,
        created_at,
        updated_at
      )
      VALUES (
        $1, $2, $3, $4, $5,
        $6::timestamp, $7::timestamp,
        $8, $9, $10, $11, $12, $13, $14,
        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      )
      RETURNING
        id,
        title,
        slug,
        status,
        created_at
      `,
      [
        title,
        slug,
        description,
        eventType,
        location,
        startDate,
        endDate,
        Number.isFinite(distanceKm) ? distanceKm : 0,
        Number.isFinite(ticketPrice) ? ticketPrice : 0,
        Number.isFinite(maxParticipants) ? maxParticipants : 0,
        Number.isFinite(doorprizeCount) ? doorprizeCount : 0,
        status,
        coverImage,
        currentUser.id,
      ]
    );

    return NextResponse.json(
      {
        ok: true,
        message: "Event berhasil dibuat.",
        event: {
          id: Number(result.rows[0].id),
          title: result.rows[0].title,
          slug: result.rows[0].slug,
          status: result.rows[0].status,
          createdAt: result.rows[0].created_at,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("ADMIN_EVENTS_POST_ERROR", error);

    const message =
      error instanceof Error ? error.message : "Gagal menyimpan event.";

    return NextResponse.json(
      { ok: false, message: `Gagal menyimpan event: ${message}` },
      { status: 500 }
    );
  }
}

function createSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
