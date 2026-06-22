import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { hashSessionToken } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const db = getDb();
    const token = request.headers
      .get("cookie")
      ?.split(";")
      .map((item) => item.trim())
      .find((item) => item.startsWith("amost_session="))
      ?.split("=")[1];

    if (token) {
      const tokenHash = hashSessionToken(token);

      await db.query("DELETE FROM sessions WHERE token_hash = $1", [tokenHash]);
    }

    const response = NextResponse.json({
      ok: true,
      message: "Logout berhasil.",
    });

    response.cookies.set("amost_session", "", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0,
    });

    return response;
  } catch (error) {
    console.error("LOGOUT_ERROR", error);

    return NextResponse.json(
      { ok: false, message: "Terjadi kesalahan saat logout." },
      { status: 500 }
    );
  }
}
