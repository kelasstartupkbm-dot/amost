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
        e.created_at,
        COALESCE(r.participant_count, 0)::int AS participant_count
      FROM events e
      LEFT JOIN (
        SELECT event_id, COUNT(*)::int AS participant_count
        FROM event_registrations
        GROUP BY event_id
      ) r ON r.event_id = e.id
      ORDER BY e.created_at DESC
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
    const eventType = String(body.eventType || "Event").trim();
    const location = String(body.location || "").trim();
    const startDate = String(body.startDate || "").trim();
    const endDate = String(body.endDate || startDate).trim();
    const distanceKm = safeNumber(body.distanceKm);
    const ticketPrice = safeNumber(body.ticketPrice);
    const maxParticipants = Math.floor(safeNumber(body.maxParticipants));
    const doorprizeCount = Math.floor(safeNumber(body.doorprizeCount));
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
      `SELECT id FROM events WHERE slug = $1 LIMIT 1`,
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
        distanceKm,
        ticketPrice,
        maxParticipants,
        doorprizeCount,
        status,
        coverImage || null,
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

function safeNumber(value: unknown) {
  const numberValue = Number(value || 0);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

function createSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
