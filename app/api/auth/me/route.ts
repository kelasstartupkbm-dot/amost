import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getDb } from "@/lib/db";
import { hashSessionToken } from "@/lib/auth";

export async function GET() {
  try {
    const db = getDb();
    const token = cookies().get("amost_session")?.value;

    if (!token) {
      return NextResponse.json(
        { ok: false, user: null, message: "Belum login." },
        { status: 401 }
      );
    }

    const tokenHash = hashSessionToken(token);

    const result = await db.query(
      `
      SELECT
        users.id,
        users.full_name,
        users.email,
        users.phone,
        users.status,
        roles.name AS role,
        sessions.expires_at
      FROM sessions
      JOIN users ON users.id = sessions.user_id
      JOIN roles ON roles.id = users.role_id
      WHERE sessions.token_hash = $1
        AND sessions.expires_at > NOW()
      LIMIT 1
      `,
      [tokenHash]
    );

    if (!result.rowCount) {
      return NextResponse.json(
        { ok: false, user: null, message: "Session tidak valid." },
        { status: 401 }
      );
    }

    const user = result.rows[0];

    return NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        phone: user.phone,
        status: user.status,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("ME_ERROR", error);

    return NextResponse.json(
      { ok: false, message: "Terjadi kesalahan saat membaca session." },
      { status: 500 }
    );
  }
}
