import { NextResponse } from "next/server";
import { dbQuery } from "../../../lib/amostDb";

export const dynamic = "force-dynamic";

function quoteIdentifier(identifier: string) {
  return `"${identifier.replace(/"/g, '""')}"`;
}

function normalizeEvent(row: Record<string, any>) {
  return {
    ...row,
    id: row.id,
    title: row.title || row.name || row.event_name || row.event_title || `Event #${row.id}`,
    name: row.name || row.title || row.event_name || row.event_title || `Event #${row.id}`,
    event_name: row.event_name || row.title || row.name || row.event_title || `Event #${row.id}`,
    category: row.category || row.sport_type || row.type || "Event",
    status: row.status || row.event_status || "Draft",
    quota: row.quota ?? row.total_quota ?? row.max_participants ?? 0,
    total_quota: row.total_quota ?? row.quota ?? row.max_participants ?? 0,
    participant_count:
      row.participant_count ??
      row.total_participants ??
      row.registered_count ??
      row.join_count ??
      0,
    total_participants:
      row.total_participants ??
      row.participant_count ??
      row.registered_count ??
      row.join_count ??
      0,
    doorprize_count: row.doorprize_count ?? row.doorprize_total ?? row.doorprize ?? 0,
    doorprize_total: row.doorprize_total ?? row.doorprize_count ?? row.doorprize ?? 0,
    image_url:
      row.image_url ||
      row.cover_image_url ||
      row.banner_url ||
      row.poster_url ||
      row.image ||
      "",
    cover_image_url:
      row.cover_image_url ||
      row.image_url ||
      row.banner_url ||
      row.poster_url ||
      row.image ||
      "",
  };
}

export async function GET() {
  try {
    const columnsResult = await dbQuery(
      `
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'events'
        ORDER BY ordinal_position
      `
    );

    const columns = columnsResult.rows.map((row: any) => row.column_name);

    if (columns.length === 0) {
      return NextResponse.json({
        ok: true,
        events: [],
        data: [],
        message: "Tabel events belum ditemukan.",
      });
    }

    const orderColumn =
      ["updated_at", "created_at", "start_date", "event_date", "id"].find((column) =>
        columns.includes(column)
      ) || columns[0];

    const result = await dbQuery(
      `
        SELECT *
        FROM events
        ORDER BY ${quoteIdentifier(orderColumn)} DESC
        LIMIT 200
      `
    );

    const events = result.rows.map(normalizeEvent);

    return NextResponse.json({
      ok: true,
      events,
      data: events,
      total: events.length,
    });
  } catch (error: any) {
    console.error("GET /api/admin/events failed:", error);

    return NextResponse.json(
      {
        ok: false,
        message:
          error?.message ||
          "Data event belum bisa dimuat dari database.",
      },
      { status: 500 }
    );
  }
}
