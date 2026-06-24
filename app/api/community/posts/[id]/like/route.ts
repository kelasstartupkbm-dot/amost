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

export async function POST(request: NextRequest, context: any) {
  let user: any = null;

  try {
    user = await getCurrentAmostUser(request);
  } catch (error) {
    console.error("community like auth error", error);
  }

  const userId = getUserId(user);

  if (!userId) {
    return jsonError("Login diperlukan untuk like postingan.", 401);
  }

  const postId = getPostId(context);

  if (!postId) {
    return jsonError("Post ID tidak valid.", 400);
  }

  try {
    const existing = await dbQuery(
      `
      SELECT id
      FROM community_post_likes
      WHERE post_id = $1
        AND user_id = $2
      LIMIT 1
      `,
      [postId, userId],
    );

    let liked = false;

    if (existing.rows.length > 0) {
      await dbQuery(
        `
        DELETE FROM community_post_likes
        WHERE post_id = $1
          AND user_id = $2
        `,
        [postId, userId],
      );

      liked = false;
    } else {
      await dbQuery(
        `
        INSERT INTO community_post_likes (post_id, user_id, created_at)
        VALUES ($1, $2, NOW())
        ON CONFLICT (post_id, user_id) DO NOTHING
        `,
        [postId, userId],
      );

      liked = true;
    }

    const countResult = await dbQuery(
      `
      SELECT COUNT(*)::int AS like_count
      FROM community_post_likes
      WHERE post_id = $1
      `,
      [postId],
    );

    return NextResponse.json({
      ok: true,
      liked,
      likeCount: Number(countResult.rows[0]?.like_count || 0),
    });
  } catch (error: any) {
    console.error("community like error", error);

    return jsonError(
      "Like belum bisa diproses.",
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
