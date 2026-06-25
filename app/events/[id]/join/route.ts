import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * SAFETY ROUTE
 *
 * File ini sengaja dibuat ringan karena folder ini BUKAN lokasi API join event.
 * Lokasi API join event yang benar:
 * app/api/events/[id]/join/route.ts
 *
 * Kalau file ini masih tersisa di repository, jangan pakai import lib apa pun.
 * Tujuannya hanya supaya build tidak gagal dan akses /events/[id]/join diarahkan
 * kembali ke detail event.
 */
async function resolveEventId(context: any) {
  const params = await Promise.resolve(context?.params);
  return String(params?.id || "").trim();
}

export async function GET(request: NextRequest, context: any) {
  const eventId = await resolveEventId(context);
  const url = new URL(eventId ? `/events/${eventId}` : "/events", request.url);

  return NextResponse.redirect(url);
}

export async function POST(request: NextRequest, context: any) {
  const eventId = await resolveEventId(context);

  return NextResponse.json(
    {
      ok: false,
      message: "Endpoint ini bukan API join event. Gunakan /api/events/[id]/join.",
      correctEndpoint: eventId ? `/api/events/${eventId}/join` : "/api/events/[id]/join",
    },
    { status: 410 },
  );
}
