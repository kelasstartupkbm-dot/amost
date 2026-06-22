import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getCurrentUser, isSuperAdmin } from "@/lib/current-user";

type Params = {
  params: {
    id: string;
  };
};

export async function PATCH(request: Request, { params }: Params) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { ok: false, message: "Belum login." },
        { status: 401 }
      );
    }

    if (!isSuperAdmin(currentUser)) {
      return NextResponse.json(
        { ok: false, message: "Akses ditolak. Hanya Super Admin." },
        { status: 403 }
      );
    }

    const userId = Number(params.id);

    if (!Number.isFinite(userId) || userId <= 0) {
      return NextResponse.json(
        { ok: false, message: "ID user tidak valid." },
        { status: 400 }
      );
    }

    if (userId === currentUser.id) {
      return NextResponse.json(
        { ok: false, message: "Role akun sendiri tidak boleh diubah." },
        { status: 400 }
      );
    }

    const body = await request.json();
    const newRole = String(body.role || "").trim();

    if (newRole !== "staff_amost" && newRole !== "umum") {
      return NextResponse.json(
        {
          ok: false,
          message: "Role hanya boleh diubah menjadi Staff AMOST atau Umum.",
        },
        { status: 400 }
      );
    }

    const db = getDb();

    const targetUser = await db.query(
      `
      SELECT
        users.id,
        roles.name AS current_role
      FROM users
      JOIN roles ON roles.id = users.role_id
      WHERE users.id = $1
      LIMIT 1
      `,
      [userId]
    );

    if (!targetUser.rowCount) {
      return NextResponse.json(
        { ok: false, message: "User tidak ditemukan." },
        { status: 404 }
      );
    }

    if (targetUser.rows[0].current_role === "super_admin") {
      return NextResponse.json(
        { ok: false, message: "Role Super Admin tidak boleh diubah." },
        { status: 400 }
      );
    }

    const roleResult = await db.query(
      `
      SELECT id
      FROM roles
      WHERE name = $1
      LIMIT 1
      `,
      [newRole]
    );

    if (!roleResult.rowCount) {
      return NextResponse.json(
        { ok: false, message: "Role tujuan tidak ditemukan." },
        { status: 500 }
      );
    }

    const roleId = roleResult.rows[0].id;

    const updated = await db.query(
      `
      UPDATE users
      SET role_id = $1,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING id, full_name, email, status, updated_at
      `,
      [roleId, userId]
    );

    return NextResponse.json({
      ok: true,
      message:
        newRole === "staff_amost"
          ? "User berhasil dijadikan Staff AMOST."
          : "User berhasil dijadikan Umum.",
      user: {
        id: updated.rows[0].id,
        fullName: updated.rows[0].full_name,
        email: updated.rows[0].email,
        status: updated.rows[0].status,
        role: newRole,
        updatedAt: updated.rows[0].updated_at,
      },
    });
  } catch (error) {
    console.error("ADMIN_USER_ROLE_PATCH_ERROR", error);

    const message =
      error instanceof Error ? error.message : "Gagal mengubah role user.";

    return NextResponse.json(
      { ok: false, message: `Gagal mengubah role: ${message}` },
      { status: 500 }
    );
  }
}
