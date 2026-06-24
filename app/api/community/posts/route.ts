import { NextRequest, NextResponse } from "next/server";
import { dbQuery } from "../../../lib/amostDb";
import { getCurrentAmostUser } from "../../../lib/amostServerAuth";

export const dynamic = "force-dynamic";

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
        COALESCE(NULLIF(u.full_name, ''), NULLIF(u.name, ''), u.email, 'AMOST User') AS author_name,
        u.email AS author_email,
        COALESCE(r.label, r.name, 'Umum') AS role_label,
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
        detail:
          process.env.NODE_ENV === "production"
            ? undefined
            : String(error?.message || error),
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

  const content = String(body?.content || "").trim();
  const postType = normalizePostType(body?.postType || body?.post_type);
  const eventId = body?.eventId || body?.event_id ? Number(body?.eventId || body?.event_id) : null;

  if (!content) {
    return jsonError("Isi postingan tidak boleh kosong.", 400);
  }

  if (content.length > 2000) {
    return jsonError("Isi postingan maksimal 2000 karakter.", 400);
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
        created_at,
        updated_at
      )
      VALUES ($1, $2, $3, $4, 'public', NOW(), NOW())
      RETURNING
        id,
        user_id,
        post_type,
        content,
        event_id,
        visibility,
        created_at,
        updated_at
      `,
      [userId, postType, content, Number.isFinite(eventId) ? eventId : null],
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
        detail:
          process.env.NODE_ENV === "production"
            ? undefined
            : String(error?.message || error),
      },
    );
  }
}
