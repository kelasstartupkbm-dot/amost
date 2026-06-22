import { NextResponse } from "next/server";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function GET() {
  try {
    const result = await pool.query(`
      SELECT
        id,
        title,
        slug,
        location,
        start_date,
        status,
        event_type,
        doorprize_count
      FROM events
      ORDER BY start_date DESC
    `);

    return NextResponse.json({
      success: true,
      events: result.rows,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message: "Gagal mengambil event",
      },
      { status: 500 }
    );
  }
}
