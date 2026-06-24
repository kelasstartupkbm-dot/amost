import { NextRequest, NextResponse } from "next/server";
import { dbQuery } from "../../../../../lib/amostDb";
import { getCurrentAmostUser } from "../../../../../lib/amostServerAuth";

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

function getPostId(context: any) {
  const raw = context?.params?.id;
  const id = Number(raw);

  if (!Number.isFinite(id) || id <= 0) return null;

  return id;
}

export async function GET(request: NextRequest, context: any) {
  let user: any = null;

  try {
    user = await getCurrentAmostUser(request);
  } catch (error) {
    console.error("community comments auth error", error);
  }

  const userId = getUserId(user);

  if (!userId) {
    return jsonError("Login diperlukan untuk membuka komentar.", 401);
  }

  const postId = getPostId(context);

  if (!postId) {
    return jsonError("Post ID tidak valid.", 400);
  }

  try {
    const result = await dbQuery(
      `
      SELECT
        c.id,
        c.post_id,
        c.user_id,
        c.comment_text,
        c.created_at,
        COALESCE(NULLIF(u.full_name, ''), NULLIF(u.name, ''), u.email, 'AMOST User') AS author_name,
        u.email AS author_email
      FROM community_post_comments c
      JOIN users u ON u.id = c.user_id
      WHERE c.post_id = $1
      ORDER BY c.created_at ASC, c.id ASC
      LIMIT 100
      `,
      [postId],
    );

    return NextResponse.json({
      ok: true,
      data: result.rows,
      items: result.rows,
      total: result.rows.length,
    });
  } catch (error: any) {
    console.error("community comments GET error", error);

    return jsonError(
      "Komentar belum bisa dimuat.",
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

export async function POST(request: NextRequest, context: any) {
  let user: any = null;

  try {
    user = await getCurrentAmostUser(request);
  } catch (error) {
    console.error("community comment auth error", error);
  }

  const userId = getUserId(user);

  if (!userId) {
    return jsonError("Login diperlukan untuk komentar.", 401);
  }

  const postId = getPostId(context);

  if (!postId) {
    return jsonError("Post ID tidak valid.", 400);
  }

  let body: any = null;

  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const commentText = String(body?.commentText || body?.comment_text || "").trim();

  if (!commentText) {
    return jsonError("Komentar tidak boleh kosong.", 400);
  }

  if (commentText.length > 800) {
    return jsonError("Komentar maksimal 800 karakter.", 400);
  }

  try {
    const result = await dbQuery(
      `
      INSERT INTO community_post_comments (
        post_id,
        user_id,
        comment_text,
        created_at
      )
      VALUES ($1, $2, $3, NOW())
      RETURNING
        id,
        post_id,
        user_id,
        comment_text,
        created_at
      `,
      [postId, userId, commentText],
    );

    return NextResponse.json({
      ok: true,
      message: "Komentar berhasil dikirim.",
      data: result.rows[0],
      item: result.rows[0],
    });
  } catch (error: any) {
    console.error("community comments POST error", error);

    return jsonError(
      "Komentar belum bisa disimpan.",
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
