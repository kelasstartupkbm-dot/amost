import { NextRequest, NextResponse } from "next/server";
import { dbQuery } from "../../../../lib/amostDb";
import { getCurrentAmostUser } from "../../../../lib/amostServerAuth";

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

function normalizeRole(value: unknown) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

function getUserId(user: any) {
  return Number(user?.id || user?.user_id || user?.userId || 0);
}

function isGlobalAdmin(user: any) {
  const role = normalizeRole(
    user?.role ||
      user?.role_name ||
      user?.roleKey ||
      user?.role_key ||
      user?.roleLabel ||
      user?.role_label,
  );

  const roleId = Number(user?.role_id || user?.roleId || 0);

  return (
    role === "super_admin" ||
    role === "staff_amost" ||
    roleId === 1 ||
    roleId === 2
  );
}

async function resolveCommentId(context: any) {
  const params = await Promise.resolve(context?.params);
  const id = Number(params?.id);

  if (!Number.isFinite(id) || id <= 0) return null;

  return id;
}

export async function DELETE(request: NextRequest, context: any) {
  let user: any = null;

  try {
    user = await getCurrentAmostUser(request);
  } catch (error) {
    console.error("community comment delete auth error", error);
  }

  const userId = getUserId(user);

  if (!userId) {
    return jsonError("Login diperlukan untuk menghapus komentar.", 401);
  }

  const commentId = await resolveCommentId(context);

  if (!commentId) {
    return jsonError("Comment ID tidak valid.", 400);
  }

  try {
    const commentResult = await dbQuery(
      `
      SELECT id, post_id, user_id
      FROM community_post_comments
      WHERE id = $1
      LIMIT 1
      `,
      [commentId],
    );

    if (commentResult.rows.length === 0) {
      return jsonError("Komentar tidak ditemukan.", 404);
    }

    const comment = commentResult.rows[0];
    const ownerId = Number(comment.user_id || 0);
    const allowed = ownerId === userId || isGlobalAdmin(user);

    if (!allowed) {
      return jsonError("Anda tidak punya akses untuk menghapus komentar ini.", 403);
    }

    await dbQuery(
      `
      DELETE FROM community_post_comments
      WHERE id = $1
      `,
      [commentId],
    );

    return NextResponse.json({
      ok: true,
      message: "Komentar berhasil dihapus.",
      deletedId: commentId,
      postId: comment.post_id,
    });
  } catch (error: any) {
    console.error("community comment DELETE error", error);

    return jsonError(
      "Komentar belum bisa dihapus.",
      500,
      {
        detail: String(error?.message || error),
      },
    );
  }
}
