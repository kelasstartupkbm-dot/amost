import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import {
  createSessionToken,
  getLoginRedirectPath,
  hashSessionToken,
  verifyPassword,
} from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const db = getDb();
    const body = await request.json();

    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");

    if (!email || !password) {
      return NextResponse.json(
        {
          ok: false,
          message: "Email dan password wajib diisi.",
        },
        { status: 400 }
      );
    }

    const userResult = await db.query(
      `
      SELECT 
        users.id,
        users.full_name,
        users.email,
        users.password_hash,
        users.status,
        roles.name AS role
      FROM users
      JOIN roles ON roles.id = users.role_id
      WHERE users.email = $1
      LIMIT 1
      `,
      [email]
    );

    if (!userResult.rowCount) {
      return NextResponse.json(
        {
          ok: false,
          message: "Email tidak ditemukan.",
        },
        { status: 401 }
      );
    }

    const user = userResult.rows[0];

    if (user.status !== "active") {
      return NextResponse.json(
        {
          ok: false,
          message: "Akun tidak aktif.",
        },
        { status: 403 }
      );
    }

    const passwordValid = await verifyPassword(password, user.password_hash);

    if (!passwordValid) {
      return NextResponse.json(
        {
          ok: false,
          message: "Password salah.",
        },
        { status: 401 }
      );
    }

    const token = createSessionToken();
    const tokenHash = hashSessionToken(token);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await db.query(
      `
      INSERT INTO sessions (
        user_id,
        token_hash,
        expires_at
      )
      VALUES ($1, $2, $3)
      `,
      [user.id, tokenHash, expiresAt]
    );

    const redirectTo = getLoginRedirectPath(user.role);

    const response = NextResponse.json({
      ok: true,
      message: "Login berhasil.",
      redirectTo,
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        role: user.role,
      },
    });

    response.cookies.set("amost_session", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      expires: expiresAt,
    });

    return response;
  } catch (error) {
    console.error("LOGIN_ERROR", error);

    const message =
      error instanceof Error
        ? error.message
        : "Terjadi kesalahan saat login.";

    return NextResponse.json(
      {
        ok: false,
        message: `Login gagal: ${message}`,
      },
      { status: 500 }
    );
  }
}
