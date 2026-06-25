import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * AMOST SAFETY ROUTE
 *
 * File ini ada di lokasi public page, BUKAN lokasi API.
 *
 * Lokasi API join event yang benar:
 * app/api/events/[id]/join/route.ts
 *
 * Jangan import amostDb, amostServerAuth, atau communityFeedAutoPost di file ini.
 * File ini hanya dibuat supaya kalau URL /events/[id]/join terbuka,
 * pengguna diarahkan kembali ke halaman detail event.
 */

async function getEventId(context: any) {
  const params = await Promise.resolve(context?.params);
  return String(params?.id || "").trim();
}

export async function GET(request: NextRequest, context: any) {
  const eventId = await getEventId(context);
  const redirectUrl = new URL(eventId ? `/events/${eventId}` : "/events", request.url);

  return NextResponse.redirect(redirectUrl);
}

export async function POST(request: NextRequest, context: any) {
  const eventId = await getEventId(context);

  return NextResponse.json(
    {
      ok: false,
      message: "Endpoint ini bukan API join event.",
      correctEndpoint: eventId ? `/api/events/${eventId}/join` : "/api/events/[id]/join",
    },
    { status: 410 },
  );
}
