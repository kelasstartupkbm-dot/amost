// PATCH UNTUK: app/api/events/[id]/join/route.ts
// Tujuan: backend menolak join jika event sudah selesai/closed/cancelled.
// Ini penting karena tombol UI saja belum cukup aman.

// Tambahkan import:
import { isEventRegistrationClosed } from "../../../../lib/amostEventStatus";

// Setelah route membaca data event dari database, sebelum INSERT event_registrations:
const registrationClosed = isEventRegistrationClosed({
  status: event.status,
  registrationStatus: event.registration_status ?? event.registrationStatus,
  eventDate: event.event_date ?? event.date,
  startAt: event.start_at ?? event.startAt,
  endAt: event.end_at ?? event.endAt,
});

if (registrationClosed) {
  return NextResponse.json(
    {
      ok: false,
      code: "REGISTRATION_CLOSED",
      message: "Pendaftaran event sudah ditutup atau event sudah selesai.",
    },
    { status: 409 }
  );
}

// Catatan:
// - Nama variabel event sesuaikan dengan kode existing Bapak.
// - Kalau data event ada di eventRows.rows[0], pakai:
//   const event = eventRows.rows[0];
// - Letakkan guard ini sebelum query INSERT ke event_registrations.
