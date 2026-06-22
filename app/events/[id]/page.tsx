import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Gift,
  Map,
  MapPin,
  Route,
  ShieldCheck,
  Ticket,
  Trophy,
  Users,
} from "lucide-react";

export default function PublicEventDetailPage() {
  const benefits = [
    "Nomor peserta dibuat setelah pendaftaran valid.",
    "Peserta valid dapat mengikuti undian doorprize.",
    "Tracking aktivitas dapat dipantau melalui aplikasi AMOST.",
    "Hasil event dan aktivitas tersimpan di akun pengguna.",
  ];

  const prizes = [
    "Sepeda Gunung",
    "Helm Sepeda",
    "Jersey AMOST",
    "Botol Minum",
  ];

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-[1440px] items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="logo-symbol responsive-logo">A</div>

            <div>
              <div className="text-[26px] font-black leading-none tracking-wide text-purple-700">
                AMOST
              </div>
              <div className="mt-1 text-[8px] font-black uppercase leading-[1.05] tracking-wide text-purple-700">
                Event Detail
              </div>
            </div>
          </Link>

          <Link
            href="/events"
            className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
          >
            <ArrowLeft size={17} />
            Events
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="relative h-64 bg-gradient-to-br from-purple-100 via-slate-100 to-slate-200 md:h-80">
            <div className="absolute left-6 top-6 rounded-full bg-green-100 px-4 py-2 text-sm font-black text-green-700">
              Aktif
            </div>

            <div className="absolute bottom-0 left-0 right-0 h-44 opacity-80">
              <svg viewBox="0 0 900 220" className="h-full w-full">
                <path
                  d="M0 180 L120 55 L240 180 L350 80 L460 180 L600 60 L720 180 L900 90 L900 220 L0 220 Z"
                  fill="#cbd5e1"
                />
                <circle cx="720" cy="48" r="25" fill="#cbd5e1" />
              </svg>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-8 p-6 lg:grid-cols-[1fr_380px] lg:p-8">
            <div>
              <p className="text-sm font-black uppercase tracking-wide text-purple-700">
                Sepeda
              </p>

              <h1 className="mt-2 text-3xl font-black leading-tight text-slate-950 md:text-5xl">
                Gowes Banyumas Challenge
              </h1>

              <div className="mt-5 flex flex-wrap gap-4 text-sm text-slate-600">
                <span className="flex items-center gap-2">
                  <CalendarDays size={17} className="text-purple-700" />
                  18 Mei 2026
                </span>
                <span className="flex items-center gap-2">
                  <MapPin size={17} className="text-purple-700" />
                  Banyumas, Jawa Tengah
                </span>
                <span className="flex items-center gap-2">
                  <Route size={17} className="text-purple-700" />
                  45 KM
                </span>
              </div>

              <p className="mt-6 max-w-3xl text-base leading-8 text-slate-600">
                Event sepeda outdoor AMOST dengan tracking realtime, nomor
                peserta, tiket online, route map, checkpoint, leaderboard, dan
                undian nomor peserta untuk doorprize.
              </p>

              <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <MetricCard icon={Users} label="Peserta" value="1.245" />
                <MetricCard icon={Ticket} label="Tiket Aktif" value="980" />
                <MetricCard icon={Map} label="Checkpoint" value="8" />
                <MetricCard icon={Gift} label="Doorprize" value="12" />
              </div>
            </div>

            <aside className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm font-black uppercase tracking-wide text-purple-700">
                Pendaftaran Event
              </p>

              <h2 className="mt-2 text-2xl font-black text-slate-950">
                Daftar & Dapatkan Nomor Peserta
              </h2>

              <p className="mt-3 text-sm leading-6 text-slate-600">
                Setelah pendaftaran valid, kamu akan mendapatkan nomor peserta
                yang dapat digunakan untuk doorprize.
              </p>

              <div className="mt-5 rounded-xl border border-purple-100 bg-white p-4">
                <p className="text-sm font-bold text-slate-500">
                  Estimasi tiket
                </p>
                <p className="mt-1 text-3xl font-black text-purple-700">
                  Rp 75.000
                </p>
                <p className="mt-1 text-xs font-semibold text-slate-500">
                  Harga dapat berubah sesuai tipe tiket.
                </p>
              </div>

              <Link
                href="/login"
                className="mt-5 flex h-12 items-center justify-center rounded-xl bg-purple-700 text-sm font-black text-white shadow-lg shadow-purple-200 hover:bg-purple-800"
              >
                Login untuk Daftar Event
              </Link>

              <Link
                href="/register"
                className="mt-3 flex h-12 items-center justify-center rounded-xl border border-purple-700 text-sm font-black text-purple-700 hover:bg-purple-50"
              >
                Belum punya akun? Register
              </Link>
            </aside>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_420px]">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-black text-slate-950">
              Ketentuan Event
            </h2>

            <div className="mt-5 grid gap-3">
              {benefits.map((item) => (
                <div
                  key={item}
                  className="flex items-start gap-3 rounded-xl bg-slate-50 p-4"
                >
                  <CheckCircle2
                    size={20}
                    className="mt-0.5 shrink-0 text-green-600"
                  />
                  <p className="text-sm font-semibold leading-6 text-slate-700">
                    {item}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
                <Trophy size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-950">
                  Doorprize
                </h2>
                <p className="text-sm text-slate-500">
                  Undian berdasarkan nomor peserta.
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {prizes.map((prize) => (
                <div
                  key={prize}
                  className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-4"
                >
                  <p className="font-black text-slate-950">{prize}</p>
                  <Gift size={18} className="text-purple-700" />
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <div className="flex gap-3">
                <ShieldCheck className="mt-0.5 text-amber-700" size={20} />
                <p className="text-sm leading-6 text-amber-800">
                  Hanya peserta dengan status pendaftaran valid yang dapat masuk
                  ke undian doorprize.
                </p>
              </div>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
        <Icon size={22} />
      </div>
      <p className="mt-4 text-2xl font-black text-slate-950">{value}</p>
      <p className="mt-1 text-sm font-semibold text-slate-500">{label}</p>
    </div>
  );
}
