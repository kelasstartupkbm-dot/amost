"use client";

import AccountAppShell from "../../components/AccountAppShell";
import Link from "next/link";
import {
  Settings,
  ArrowRight,
  CalendarDays,
  Clock3,
  Info,
  RefreshCw,
} from "lucide-react";

export default function AccountSettingsPage() {
  const rightPanel = (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-black text-slate-950">Quick Info</h3>
        <Info className="text-purple-700" size={22} />
      </div>

      <div className="mt-4 rounded-2xl bg-purple-50 p-4">
        <p className="text-xs font-black uppercase tracking-wide text-purple-700">
          Status
        </p>
        <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
          Halaman ini sudah aktif agar menu sidebar tidak 404. Data real akan
          disambungkan bertahap setelah layout dikunci.
        </p>
      </div>

      <Link
        href="/home"
        className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-purple-700 text-sm font-black text-white hover:bg-purple-800"
      >
        Kembali Home
        <ArrowRight size={17} />
      </Link>
    </section>
  );

  return (
    <AccountAppShell
      active="settings"
      title="Settings"
      eyebrow="Pengaturan"
      description="Pengaturan akun dan preferensi aplikasi."
      icon={Settings}
      rightPanel={rightPanel}
    >
      <section className="space-y-5">
        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 rounded-2xl bg-green-50 px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-green-700">
            Account Menu Active · Settings
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <StatCard label="Status" value="Aktif" />
            <StatCard label="Data" value="Ready" />
            <StatCard label="Mode" value="Account" />
          </div>
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-black text-slate-950">
                Pengaturan Akun
              </h2>
              <p className="mt-2 max-w-3xl text-sm font-semibold leading-7 text-slate-500">
                Nanti halaman ini menampilkan pengaturan profil, preferensi, keamanan akun, dan notifikasi.
              </p>
            </div>

            <button
              type="button"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 hover:bg-slate-50"
            >
              <RefreshCw size={17} />
              Refresh
            </button>
          </div>

          <div className="mt-6 rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-purple-700 shadow-sm">
              <Settings size={32} />
            </div>

            <h3 className="mt-5 text-xl font-black text-slate-950">
              Belum ada data yang perlu ditampilkan.
            </h3>
            <p className="mx-auto mt-2 max-w-xl text-sm font-semibold leading-7 text-slate-500">
              Untuk tahap ini halaman sudah dibuat agar navigasi tidak putus.
              Selanjutnya data bisa diambil dari database sesuai modul.
            </p>

            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link
                href="/events"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-purple-700 px-5 text-sm font-black text-white hover:bg-purple-800"
              >
                <CalendarDays size={17} />
                Jelajahi Event
              </Link>

              <Link
                href="/account/tracking"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-black text-slate-700 hover:bg-slate-50"
              >
                <Clock3 size={17} />
                Tracking
              </Link>
            </div>
          </div>
        </section>
      </section>
    </AccountAppShell>
  );
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <section className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
      <p className="text-xs font-black uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-2xl font-black text-slate-950">{value}</p>
    </section>
  );
}
