import { NextRequest, NextResponse } from "next/server";
import { dbQuery } from "../../../lib/amostDb";
import { getCurrentAmostUser } from "../../../lib/amostServerAuth";

export const dynamic = "force-dynamic";

type DbRow = Record<string, any>;

function getRows(result: any): DbRow[] {
  if (Array.isArray(result)) return result as DbRow[];
  if (Array.isArray(result?.rows)) return result.rows as DbRow[];
  return [];
}

function getUserId(user: any): number | null {
  const raw = user?.id ?? user?.user_id ?? user?.userId;
  const id = Number(raw);
  return Number.isFinite(id) && id > 0 ? id : null;
}

async function ensureRegistrationTable() {
  await dbQuery(`
    CREATE TABLE IF NOT EXISTS public.event_registrations (
      id BIGSERIAL PRIMARY KEY,
      event_id BIGINT NOT NULL,
      user_id BIGINT NOT NULL,
      participant_number VARCHAR(50),
      status VARCHAR(30) NOT NULL DEFAULT 'registered',
      created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
      CONSTRAINT event_registrations_unique_event_user UNIQUE (event_id, user_id)
    )
  `);

  await dbQuery(`
    ALTER TABLE public.event_registrations
    ADD COLUMN IF NOT EXISTS participant_number VARCHAR(50)
  `);

  await dbQuery(`
    ALTER TABLE public.event_registrations
    ADD COLUMN IF NOT EXISTS status VARCHAR(30) DEFAULT 'registered'
  `);

  await dbQuery(`
    ALTER TABLE public.event_registrations
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
  `);

  await dbQuery(`
    ALTER TABLE public.event_registrations
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
  `);

  await dbQuery(`
    UPDATE public.event_registrations
    SET status = 'registered'
    WHERE status IS NULL
  `);

  await dbQuery(`
    CREATE INDEX IF NOT EXISTS event_registrations_event_id_idx
    ON public.event_registrations(event_id)
  `);

  await dbQuery(`
    CREATE INDEX IF NOT EXISTS event_registrations_user_id_idx
    ON public.event_registrations(user_id)
  `);
}

function normalizeEvent(row: DbRow) {
  const title =
    row.title ||
    row.name ||
    row.event_name ||
    row.event_title ||
    `Event #${row.id}`;

  const slug =
    row.slug ||
    row.event_slug ||
    row.code ||
    row.event_code ||
    row.short_slug ||
    row.id;

  return {
    ...row,
    id: row.id,
    slug,
    title,
    name: row.name || title,
    event_title: row.event_title || title,
    description: row.description || row.event_description || "",
    event_date:
      row.event_date ||
      row.start_date ||
      row.start_at ||
      row.date ||
      null,
    location: row.location || row.city || "",
    category:
      row.category ||
      row.sport_type ||
      row.type ||
      row.event_type ||
      "Event",
    status: row.status || row.event_status || "published",
    quota:
      row.quota ??
      row.total_quota ??
      row.max_participants ??
      0,
    participant_count:
      row.participant_count ??
      row.total_participants ??
      row.registered_count ??
      0,
    doorprize_count:
      row.doorprize_count ??
      row.doorprize_total ??
      row.doorprize ??
      0,
    participant_number:
      row.participant_number ||
      row.participant_no ||
      row.registration_number ||
      null,
    registration_status: row.registration_status || "registered",
    registered_at: row.registered_at || null,
  };
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentAmostUser(request);
    const userId = getUserId(user);

    if (!userId) {
      return NextResponse.json(
        {
          ok: false,
          code: "LOGIN_REQUIRED",
          message: "Silakan login terlebih dahulu untuk membuka My Events.",
          events: [],
          data: [],
        },
        { status: 401 }
      );
    }

    await ensureRegistrationTable();

    const result = await dbQuery(
      `
        SELECT
          e.*,
          er.participant_number,
          er.status AS registration_status,
          er.created_at AS registered_at,
          COALESCE(reg_stats.participant_count, 0)::int AS participant_count
        FROM public.event_registrations er
        INNER JOIN public.events e
          ON e.id = er.event_id
        LEFT JOIN (
          SELECT
            event_id,
            COUNT(*)::int AS participant_count
          FROM public.event_registrations
          WHERE LOWER(COALESCE(status, 'registered')) NOT IN (
            'cancelled',
            'canceled',
            'rejected',
            'deleted'
          )
          GROUP BY event_id
        ) reg_stats
          ON reg_stats.event_id = e.id
        WHERE er.user_id = $1
          AND LOWER(COALESCE(er.status, 'registered')) NOT IN (
            'cancelled',
            'canceled',
            'rejected',
            'deleted'
          )
        ORDER BY
          er.created_at DESC NULLS LAST,
          er.id DESC
      `,
      [userId]
    );

    const events = getRows(result).map(normalizeEvent);

    return NextResponse.json({
      ok: true,
      events,
      data: events,
      total: events.length,
    });
  } catch (error: any) {
    console.error("GET /api/account/events error", error);

    return NextResponse.json(
      {
        ok: false,
        code: "ACCOUNT_EVENTS_FAILED",
        message: error?.message || "Data My Events belum bisa dimuat.",
        events: [],
        data: [],
      },
      { status: 500 }
    );
  }
}
