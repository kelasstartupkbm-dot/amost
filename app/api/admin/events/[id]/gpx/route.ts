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
      SELECT slug, gpx_filename, gpx_content
      FROM events
      WHERE id = $1
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

    if (!event.gpx_content) {
      return NextResponse.json(
        { ok: false, message: "GPX belum tersedia." },
        { status: 404 }
      );
    }

    const filename = sanitizeFilename(event.gpx_filename || `${event.slug || "route"}.gpx`);

    return new NextResponse(event.gpx_content, {
      status: 200,
      headers: {
        "Content-Type": "application/gpx+xml; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("ADMIN_EVENT_GPX_DOWNLOAD_ERROR", error);

    const message = error instanceof Error ? error.message : "Gagal download GPX.";

    return NextResponse.json(
      { ok: false, message },
      { status: 500 }
    );
  }
}

function sanitizeFilename(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]/g, "-");
}
