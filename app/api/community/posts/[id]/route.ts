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

async function resolvePostId(context: any) {
  const params = await Promise.resolve(context?.params);
  const id = Number(params?.id);

  if (!Number.isFinite(id) || id <= 0) return null;

  return id;
}


function cleanText(value: unknown, maxLength: number) {
  const text = String(value || "").trim();

  if (!text) return "";

  return text.slice(0, maxLength);
}

export async function PATCH(request: NextRequest, context: any) {
  let user: any = null;

  try {
    user = await getCurrentAmostUser(request);
  } catch (error) {
    console.error("community post patch auth error", error);
  }

  const userId = getUserId(user);

  if (!userId) {
    return jsonError("Login diperlukan untuk mengedit postingan.", 401);
  }

  const postId = await resolvePostId(context);

  if (!postId) {
    return jsonError("Post ID tidak valid.", 400);
  }

  let body: any = null;

  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const content = cleanText(body?.content, 2000);

  if (!content) {
    return jsonError("Isi postingan tidak boleh kosong.", 400);
  }

  try {
    const postResult = await dbQuery(
      `
      SELECT id, user_id
      FROM community_posts
      WHERE id = $1
      LIMIT 1
      `,
      [postId],
    );

    if (postResult.rows.length === 0) {
      return jsonError("Postingan tidak ditemukan.", 404);
    }

    const post = postResult.rows[0];
    const ownerId = Number(post.user_id || 0);
    const allowed = ownerId === userId || isGlobalAdmin(user);

    if (!allowed) {
      return jsonError("Anda tidak punya akses untuk mengedit postingan ini.", 403);
    }

    const updateResult = await dbQuery(
      `
      UPDATE community_posts
      SET
        content = $2,
        updated_at = NOW()
      WHERE id = $1
      RETURNING id, user_id, content, updated_at
      `,
      [postId, content],
    );

    return NextResponse.json({
      ok: true,
      message: "Postingan berhasil diperbarui.",
      data: updateResult.rows[0],
      item: updateResult.rows[0],
    });
  } catch (error: any) {
    console.error("community post PATCH error", error);

    return jsonError(
      "Postingan belum bisa diedit.",
      500,
      {
        detail: String(error?.message || error),
      },
    );
  }
}


export async function DELETE(request: NextRequest, context: any) {
  let user: any = null;

  try {
    user = await getCurrentAmostUser(request);
  } catch (error) {
    console.error("community post delete auth error", error);
  }

  const userId = getUserId(user);

  if (!userId) {
    return jsonError("Login diperlukan untuk menghapus postingan.", 401);
  }

  const postId = await resolvePostId(context);

  if (!postId) {
    return jsonError("Post ID tidak valid.", 400);
  }

  try {
    const postResult = await dbQuery(
      `
      SELECT id, user_id
      FROM community_posts
      WHERE id = $1
      LIMIT 1
      `,
      [postId],
    );

    if (postResult.rows.length === 0) {
      return jsonError("Postingan tidak ditemukan.", 404);
    }

    const post = postResult.rows[0];
    const ownerId = Number(post.user_id || 0);
    const allowed = ownerId === userId || isGlobalAdmin(user);

    if (!allowed) {
      return jsonError("Anda tidak punya akses untuk menghapus postingan ini.", 403);
    }

    await dbQuery(
      `
      DELETE FROM community_post_comments
      WHERE post_id = $1
      `,
      [postId],
    );

    await dbQuery(
      `
      DELETE FROM community_post_likes
      WHERE post_id = $1
      `,
      [postId],
    );

    await dbQuery(
      `
      DELETE FROM community_posts
      WHERE id = $1
      `,
      [postId],
    );

    return NextResponse.json({
      ok: true,
      message: "Postingan berhasil dihapus.",
      deletedId: postId,
    });
  } catch (error: any) {
    console.error("community post DELETE error", error);

    return jsonError(
      "Postingan belum bisa dihapus.",
      500,
      {
        detail: String(error?.message || error),
      },
    );
  }
}
