import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getCurrentUser, isSuperAdmin } from "@/lib/current-user";

export async function GET() {
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

    const db = getDb();

    const result = await db.query(
      `
      SELECT
        users.id,
        users.full_name,
        users.email,
        users.phone,
        users.status,
        users.created_at,
        roles.name AS role,
        roles.label AS role_label
      FROM users
      JOIN roles ON roles.id = users.role_id
      ORDER BY users.id DESC
      `
    );

    return NextResponse.json({
      ok: true,
      users: result.rows.map((user) => ({
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        phone: user.phone,
        status: user.status,
        role: user.role,
        roleLabel: user.role_label,
        createdAt: user.created_at,
      })),
    });
  } catch (error) {
    console.error("ADMIN_USERS_GET_ERROR", error);

    const message =
      error instanceof Error ? error.message : "Gagal mengambil daftar user.";

    return NextResponse.json(
      { ok: false, message: `Gagal mengambil user: ${message}` },
      { status: 500 }
    );
  }
}
