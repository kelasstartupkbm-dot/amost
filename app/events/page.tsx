import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Gift,
  MapPin,
  Search,
  Ticket,
  Users,
} from "lucide-react";

const events = [
  {
    id: "demo-event",
    title: "Gowes Banyumas Challenge",
    type: "Sepeda",
    date: "18 Mei 2026",
    location: "Banyumas, Jawa Tengah",
    participants: "1.245",
    ticket: "Tersedia",
    doorprize: "12 Hadiah",
    status: "Aktif",
  },
  {
    id: "purwokerto-run",
    title: "Purwokerto Run 2026",
    type: "Lari",
    date: "26 Mei 2026",
    location: "Purwokerto, Jawa Tengah",
    participants: "2.034",
    ticket: "Tersedia",
    doorprize: "8 Hadiah",
    status: "Aktif",
  },
  {
    id: "baturraden-trail",
    title: "Baturraden Trail Run",
    type: "Trail Run",
    date: "02 Juni 2026",
    location: "Baturraden, Jawa Tengah",
    participants: "876",
    ticket: "Segera",
    doorprize: "5 Hadiah",
    status: "Draft",
  },
  {
    id: "sehat-bersama-amost",
    title: "Sehat Bersama AMOST",
    type: "Jalan Sehat",
    date: "09 Juni 2026",
    location: "Purwokerto, Jawa Tengah",
    participants: "1.102",
    ticket: "Tersedia",
    doorprize: "10 Hadiah",
    status: "Aktif",
  },
];

export default function PublicEventsPage() {
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
                Public Events
              </div>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="hidden items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 sm:flex"
            >
              <ArrowLeft size={17} />
              Beranda
            </Link>

            <Link
              href="/login"
              className="rounded-lg border border-purple-700 px-4 py-2 text-sm font-bold text-purple-700 hover:bg-purple-50"
            >
              Login
            </Link>

            <Link
              href="/register"
              className="rounded-lg bg-purple-700 px-4 py-2 text-sm font-bold text-white hover:bg-purple-800"
            >
              Daftar
            </Link>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden border-b border-slate-200 bg-white">
        <div className="absolute inset-0 hero-bg opacity-40" />

        <div className="relative mx-auto max-w-[1440px] px-4 py-16 sm:px-6 lg:px-8">
          <p className="text-sm font-black uppercase tracking-wide text-purple-700">
            AMOST Events
          </p>

          <h1 className="mt-3 max-w-3xl text-4xl font-black leading-tight tracking-tight text-slate-950 md:text-6xl">
            Temukan Event Olahraga Outdoor
          </h1>

          <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600 md:text-lg">
            Ikuti event sepeda, lari, trail run, jalan sehat, dan aktivitas
            outdoor lainnya. Daftar event, dapatkan nomor peserta, dan ikuti
            kesempatan doorprize.
          </p>

          <div className="mt-8 grid max-w-4xl grid-cols-1 gap-4 sm:grid-cols-3">
            <HeroMetric icon={CalendarDays} label="Event Aktif" value="3" />
            <HeroMetric icon={Users} label="Total Peserta" value="5.257+" />
            <HeroMetric icon={Gift} label="Doorprize" value="35+" />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-black text-slate-950">
              Daftar Event
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              Pilih event, daftar, dan dapatkan nomor peserta.
            </p>
          </div>

          <div className="flex h-11 w-full items-center gap-3 rounded-xl border border-slate-200 px-4 md:w-[380px]">
            <Search size={18} className="text-slate-400" />
            <input
              type="text"
              placeholder="Cari event..."
              className="w-full border-0 bg-transparent text-sm font-medium outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
          {events.map((event) => (
            <article
              key={event.id}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="relative h-36 bg-gradient-to-br from-purple-100 via-slate-100 to-slate-200">
                <div className="absolute left-4 top-4 rounded-full bg-white px-3 py-1 text-xs font-black text-purple-700 shadow-sm">
                  {event.type}
                </div>

                <div
                  className={`absolute right-4 top-4 rounded-full px-3 py-1 text-xs font-black ${
                    event.status === "Aktif"
                      ? "bg-green-100 text-green-700"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {event.status}
                </div>

                <div className="absolute bottom-0 left-0 right-0 h-24 opacity-70">
                  <svg viewBox="0 0 300 120" className="h-full w-full">
                    <path
                      d="M0 95 L75 28 L135 95 L190 50 L255 95 L300 66 L300 120 L0 120 Z"
                      fill="#cbd5e1"
                    />
                    <circle cx="240" cy="28" r="15" fill="#cbd5e1" />
                  </svg>
                </div>
              </div>

              <div className="p-5">
                <h3 className="text-lg font-black leading-tight text-slate-950">
                  {event.title}
                </h3>

                <p className="mt-2 flex items-center gap-2 text-sm text-slate-500">
                  <MapPin size={15} className="text-purple-700" />
                  {event.location}
                </p>

                <p className="mt-3 flex items-center gap-2 text-sm font-bold text-slate-900">
                  <CalendarDays size={15} className="text-purple-700" />
                  {event.date}
                </p>

                <div className="mt-5 grid grid-cols-3 gap-3">
                  <SmallMetric label="Peserta" value={event.participants} />
                  <SmallMetric label="Tiket" value={event.ticket} />
                  <SmallMetric label="Hadiah" value={event.doorprize} />
                </div>

                <Link
                  href={`/events/${event.id}`}
                  className="mt-5 flex h-11 items-center justify-center gap-2 rounded-lg bg-purple-700 text-sm font-black text-white hover:bg-purple-800"
                >
                  Lihat Detail
                  <ArrowRight size={17} />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

function HeroMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-purple-100 bg-white/85 p-5 shadow-sm backdrop-blur">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
        <Icon size={22} />
      </div>
      <p className="mt-4 text-3xl font-black text-slate-950">{value}</p>
      <p className="mt-1 text-sm font-semibold text-slate-500">{label}</p>
    </div>
  );
}

function SmallMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3 text-center">
      <p className="text-sm font-black text-slate-950">{value}</p>
      <p className="mt-1 text-xs font-semibold text-slate-500">{label}</p>
    </div>
  );
}
