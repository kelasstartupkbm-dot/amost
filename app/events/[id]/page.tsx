// PATCH UNTUK: app/events/[id]/page.tsx
// Tujuan: tombol daftar tidak aktif kalau event status = selesai/closed/cancelled.
// Jangan langsung replace seluruh file kalau halaman detail event Bapak sudah bagus.
// Ambil bagian import, konstanta, dan penggantian tombolnya saja.
"use client";

import { useParams } from "next/navigation";
import {
  getRegistrationClosedLabel,
  isEventRegistrationClosed,
} from "../../lib/amostEventStatus";

// Di dalam component detail event, setelah data event sudah ada:
const registrationClosed = isEventRegistrationClosed({
  status: event?.status,
  registrationStatus: event?.registration_status ?? event?.registrationStatus,
  eventDate: event?.event_date ?? event?.date,
  startAt: event?.start_at ?? event?.startAt,
  endAt: event?.end_at ?? event?.endAt,
});

const registrationClosedLabel = getRegistrationClosedLabel({
  status: event?.status,
  registrationStatus: event?.registration_status ?? event?.registrationStatus,
  eventDate: event?.event_date ?? event?.date,
  startAt: event?.start_at ?? event?.startAt,
  endAt: event?.end_at ?? event?.endAt,
});

// Cari tombol "Daftar Event Sekarang".
// Ganti disabled dan label tombolnya seperti ini:

<button
  type="button"
  onClick={handleJoin}
  disabled={registrationClosed || joining || isRegistered}
  className={
    registrationClosed || joining || isRegistered
      ? "w-full rounded-2xl bg-slate-200 px-5 py-4 font-black text-slate-500 cursor-not-allowed"
      : "w-full rounded-2xl bg-purple-700 px-5 py-4 font-black text-white shadow-lg shadow-purple-200 hover:bg-purple-800"
  }
>
  {registrationClosed
    ? registrationClosedLabel
    : isRegistered
      ? "Sudah Terdaftar"
      : joining
        ? "Memproses..."
        : "Daftar Event Sekarang"}
</button>

// Tambahkan info kecil di bawah tombol:
{registrationClosed ? (
  <p className="mt-3 text-sm font-semibold text-slate-500">
    Pendaftaran tidak tersedia karena event sudah selesai atau ditutup.
  </p>
) : null}
