import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { ROLES, hashPassword } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const db = getDb();
    const body = await request.json();

    const fullName = String(body.fullName || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const phone = String(body.phone || "").trim();
    const password = String(body.password || "");
    const confirmPassword = String(body.confirmPassword || "");

    if (!fullName || !email || !password || !confirmPassword) {
      return NextResponse.json(
        { ok: false, message: "Data wajib belum lengkap." },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { ok: false, message: "Password minimal 8 karakter." },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { ok: false, message: "Konfirmasi password tidak sama." },
        { status: 400 }
      );
    }

    const existingUser = await db.query(
      "SELECT id FROM users WHERE email = $1 LIMIT 1",
      [email]
    );

    if (existingUser.rowCount && existingUser.rowCount > 0) {
      return NextResponse.json(
        { ok: false, message: "Email sudah terdaftar." },
        { status: 409 }
      );
    }

    const umumRole = await db.query(
      "SELECT id FROM roles WHERE name = $1 LIMIT 1",
      [ROLES.UMUM]
    );

    if (!umumRole.rowCount) {
      return NextResponse.json(
        { ok: false, message: "Role Umum belum tersedia di database." },
        { status: 500 }
      );
    }

    const roleId = umumRole.rows[0].id;
    const passwordHash = await hashPassword(password);

    const userResult = await db.query(
      `
      INSERT INTO users (role_id, full_name, email, password_hash, phone)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, full_name, email, phone, status, created_at
      `,
      [roleId, fullName, email, passwordHash, phone || null]
    );

    const user = userResult.rows[0];

    await db.query(
      `
      INSERT INTO user_profiles (user_id)
      VALUES ($1)
      ON CONFLICT (user_id) DO NOTHING
      `,
      [user.id]
    );

    return NextResponse.json({
      ok: true,
      message: "Register berhasil. Akun otomatis terdaftar sebagai Umum.",
      user,
      role: ROLES.UMUM,
    });
  } catch (error) {
    console.error("REGISTER_ERROR", error);

    return NextResponse.json(
      { ok: false, message: "Terjadi kesalahan saat register." },
      { status: 500 }
    );
  }
}
