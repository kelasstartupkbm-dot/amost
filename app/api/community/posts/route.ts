import { NextRequest, NextResponse } from "next/server";
import { dbQuery } from "../../../lib/amostDb";
import { getCurrentAmostUser } from "../../../lib/amostServerAuth";

export const dynamic = "force-dynamic";

type ColumnSet = Set<string>;

function jsonError(message: string, status = 400, extra: Record<string, unknown> = {}) {
  return NextResponse.json(
    {
      ok: false,
      message,
      ...extra,
    },
    { status },
  );
}

function getUserId(user: any) {
  return Number(user?.id || user?.user_id || user?.userId || 0);
}

function normalizePostType(value: unknown) {
  const clean = String(value || "post").trim().toLowerCase();

  const allowed = new Set([
    "post",
    "activity",
    "event",
    "result",
    "doorprize",
    "official",
  ]);

  if (allowed.has(clean)) return clean;

  return "post";
}

function clampLimit(rawValue: string | null) {
  const value = Number(rawValue || 20);

  if (!Number.isFinite(value)) return 20;
  if (value < 1) return 20;
  if (value > 50) return 50;

  return Math.floor(value);
}

async function getTableColumns(tableName: string): Promise<ColumnSet> {
  const result = await dbQuery(
    `
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = $1
    `,
    [tableName],
  );

  return new Set(result.rows.map((row: any) => String(row.column_name)));
}

function quotedColumn(tableAlias: string, columnName: string) {
  return `${tableAlias}."${columnName.replace(/"/g, '""')}"`;
}

function firstExistingExpression(
  columns: ColumnSet,
  tableAlias: string,
  candidateColumns: string[],
  fallbackSql: string,
) {
  const expressions = candidateColumns
    .filter((columnName) => columns.has(columnName))
    .map((columnName) => `NULLIF(${quotedColumn(tableAlias, columnName)}::text, '')`);

  if (expressions.length === 0) {
    return fallbackSql;
  }

  return `COALESCE(${expressions.join(", ")}, ${fallbackSql})`;
}

function optionalSelect(postsColumns: ColumnSet, columnName: string, alias?: string) {
  const outAlias = alias || columnName;

  if (!postsColumns.has(columnName)) {
    return `NULL AS ${outAlias}`;
  }

  return `p.${columnName} AS ${outAlias}`;
}

function cleanText(value: unknown, maxLength: number) {
  const text = String(value || "").trim();

  if (!text) return "";

  return text.slice(0, maxLength);
}

function cleanNumber(value: unknown) {
  if (value === null || value === undefined || value === "") return null;

  const number = Number(value);

  if (!Number.isFinite(number)) return null;

  return number;
}

function cleanImageDataUrl(value: unknown) {
  const text = String(value || "").trim();

  if (!text) return null;

  if (!text.startsWith("data:image/")) {
    return null;
  }

  // Simpan gambar kecil/terkompresi saja agar PostgreSQL tidak berat.
  // 1.8 MB string base64 kira-kira masih aman untuk tahap awal.
  if (text.length > 1_800_000) {
    throw new Error("Ukuran foto terlalu besar. Gunakan foto yang lebih kecil.");
  }

  return text;
}

export async function GET(request: NextRequest) {
  let user: any = null;

  try {
    user = await getCurrentAmostUser(request);
  } catch (error) {
    console.error("community posts auth error", error);
  }

  const viewerId = getUserId(user);

  if (!viewerId) {
    return jsonError("Login diperlukan untuk membuka community feed.", 401);
  }

  const limit = clampLimit(request.nextUrl.searchParams.get("limit"));

  try {
    const [userColumns, roleColumns, postsColumns] = await Promise.all([
      getTableColumns("users"),
      getTableColumns("roles"),
      getTableColumns("community_posts"),
    ]);

    const authorNameSql = firstExistingExpression(
      userColumns,
      "u",
      ["full_name", "fullName", "name", "username", "display_name"],
      "u.email::text",
    );

    const roleLabelSql = firstExistingExpression(
      roleColumns,
      "r",
      ["label", "name", "role_name", "title"],
      "'Umum'",
    );

    const result = await dbQuery(
      `
      SELECT
        p.id,
        p.user_id,
        p.post_type,
        p.content,
        p.event_id,
        p.visibility,
        p.created_at,
        p.updated_at,
        ${optionalSelect(postsColumns, "image_data_url")},
        ${optionalSelect(postsColumns, "image_name")},
        ${optionalSelect(postsColumns, "activity_type")},
        ${optionalSelect(postsColumns, "activity_distance_km")},
        ${optionalSelect(postsColumns, "activity_duration_minutes")},
        ${optionalSelect(postsColumns, "location_text")},
        ${optionalSelect(postsColumns, "location_lat")},
        ${optionalSelect(postsColumns, "location_lng")},
        ${authorNameSql} AS author_name,
        u.email AS author_email,
        ${roleLabelSql} AS role_label,
        COALESCE(l.like_count, 0)::int AS like_count,
        COALESCE(c.comment_count, 0)::int AS comment_count,
        CASE WHEN viewer_like.user_id IS NULL THEN false ELSE true END AS viewer_liked
      FROM community_posts p
      JOIN users u ON u.id = p.user_id
      LEFT JOIN roles r ON r.id = u.role_id
      LEFT JOIN (
        SELECT post_id, COUNT(*) AS like_count
        FROM community_post_likes
        GROUP BY post_id
      ) l ON l.post_id = p.id
      LEFT JOIN (
        SELECT post_id, COUNT(*) AS comment_count
        FROM community_post_comments
        GROUP BY post_id
      ) c ON c.post_id = p.id
      LEFT JOIN community_post_likes viewer_like
        ON viewer_like.post_id = p.id
       AND viewer_like.user_id = $2
      WHERE p.visibility = 'public'
      ORDER BY p.created_at DESC, p.id DESC
      LIMIT $1
      `,
      [limit, viewerId],
    );

    return NextResponse.json({
      ok: true,
      data: result.rows,
      items: result.rows,
      total: result.rows.length,
    });
  } catch (error: any) {
    console.error("community posts GET error", error);

    return jsonError(
      "Community feed belum bisa dimuat.",
      500,
      {
        detail: String(error?.message || error),
      },
    );
  }
}

export async function POST(request: NextRequest) {
  let user: any = null;

  try {
    user = await getCurrentAmostUser(request);
  } catch (error) {
    console.error("community post auth error", error);
  }

  const userId = getUserId(user);

  if (!userId) {
    return jsonError("Login diperlukan untuk membuat postingan.", 401);
  }

  let body: any = null;

  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const content = cleanText(body?.content, 2000);
  const postType = normalizePostType(body?.postType || body?.post_type);
  const eventId = body?.eventId || body?.event_id ? Number(body?.eventId || body?.event_id) : null;

  const imageName = cleanText(body?.imageName || body?.image_name, 255) || null;
  const activityType = cleanText(body?.activityType || body?.activity_type, 50) || null;
  const activityDistanceKm = cleanNumber(body?.activityDistanceKm || body?.activity_distance_km);
  const activityDurationMinutes = cleanNumber(body?.activityDurationMinutes || body?.activity_duration_minutes);
  const locationText = cleanText(body?.locationText || body?.location_text, 255) || null;
  const locationLat = cleanNumber(body?.locationLat || body?.location_lat);
  const locationLng = cleanNumber(body?.locationLng || body?.location_lng);

  let imageDataUrl: string | null = null;

  try {
    imageDataUrl = cleanImageDataUrl(body?.imageDataUrl || body?.image_data_url);
  } catch (error: any) {
    return jsonError(String(error?.message || error), 400);
  }

  if (!content && !imageDataUrl && !activityType && !locationText) {
    return jsonError("Isi postingan tidak boleh kosong.", 400);
  }

  try {
    const result = await dbQuery(
      `
      INSERT INTO community_posts (
        user_id,
        post_type,
        content,
        event_id,
        visibility,
        image_data_url,
        image_name,
        activity_type,
        activity_distance_km,
        activity_duration_minutes,
        location_text,
        location_lat,
        location_lng,
        created_at,
        updated_at
      )
      VALUES (
        $1, $2, $3, $4, 'public',
        $5, $6, $7, $8, $9, $10, $11, $12,
        NOW(), NOW()
      )
      RETURNING
        id,
        user_id,
        post_type,
        content,
        event_id,
        visibility,
        image_data_url,
        image_name,
        activity_type,
        activity_distance_km,
        activity_duration_minutes,
        location_text,
        location_lat,
        location_lng,
        created_at,
        updated_at
      `,
      [
        userId,
        postType,
        content,
        Number.isFinite(eventId) ? eventId : null,
        imageDataUrl,
        imageName,
        activityType,
        activityDistanceKm,
        activityDurationMinutes,
        locationText,
        locationLat,
        locationLng,
      ],
    );

    return NextResponse.json({
      ok: true,
      message: "Postingan berhasil dibuat.",
      data: result.rows[0],
      item: result.rows[0],
    });
  } catch (error: any) {
    console.error("community posts POST error", error);

    return jsonError(
      "Postingan belum bisa disimpan.",
      500,
      {
        detail: String(error?.message || error),
      },
    );
  }
}
