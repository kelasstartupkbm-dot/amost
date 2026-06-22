import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  Gift,
  MapPin,
  MoreHorizontal,
  Plus,
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
    participants: 1245,
    tickets: 980,
    status: "Aktif",
    doorprize: 12,
  },
  {
    id: "purwokerto-run",
    title: "Purwokerto Run 2026",
    type: "Lari",
    date: "26 Mei 2026",
    location: "Purwokerto, Jawa Tengah",
    participants: 2034,
    tickets: 1750,
    status: "Aktif",
    doorprize: 8,
  },
  {
    id: "baturraden-trail",
    title: "Baturraden Trail Run",
    type: "Trail Run",
    date: "02 Juni 2026",
    location: "Baturraden, Jawa Tengah",
    participants: 876,
    tickets: 740,
    status: "Draft",
    doorprize: 5,
  },
];

export default function AdminEventsPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-[1440px] items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/admin" className="flex items-center gap-3">
            <div className="logo-symbol responsive-logo">A</div>
            <div>
              <div className="text-[26px] font-black leading-none tracking-wide text-purple-700">
                AMOST
              </div>
              <div className="mt-1 text-[8px] font-black uppercase leading-[1.05] tracking-wide text-purple-700">
                Event Management
              </div>
            </div>
          </Link>

          <Link
            href="/admin"
            className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
          >
            <ArrowLeft size={17} />
            Dashboard
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-wide text-purple-700">
                Admin Event
              </p>
              <h1 className="mt-2 text-3xl font-black text-slate-950">
                Event Management
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                Kelola event AMOST, peserta, tiket, route, tracking, dan undian
                nomor peserta untuk doorprize.
              </p>
            </div>

            <button className="flex h-11 items-center justify-center gap-2 rounded-lg bg-purple-700 px-5 text-sm font-black text-white hover:bg-purple-800">
              <Plus size={18} />
              Buat Event
            </button>
          </div>

          <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-4">
            <SummaryCard icon={CalendarDays} label="Total Event" value="3" />
            <SummaryCard icon={Users} label="Total Peserta" value="4.155" />
            <SummaryCard icon={Ticket} label="Tiket Terjual" value="3.470" />
            <SummaryCard icon={Gift} label="Doorprize" value="25" />
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <h2 className="text-xl font-black text-slate-950">Daftar Event</h2>

            <div className="flex h-11 w-full items-center gap-3 rounded-xl border border-slate-200 px-4 md:w-[360px]">
              <Search size={18} className="text-slate-400" />
              <input
                type="text"
                placeholder="Cari event..."
                className="w-full border-0 bg-transparent text-sm font-medium outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
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
                  <h3 className="text-lg font-black text-slate-950">
                    {event.title}
                  </h3>

                  <p className="mt-2 flex items-center gap-2 text-sm text-slate-500">
                    <MapPin size={15} className="text-purple-700" />
                    {event.location}
                  </p>

                  <p className="mt-3 text-sm font-bold text-slate-900">
                    {event.date}
                  </p>

                  <div className="mt-5 grid grid-cols-3 gap-3">
                    <SmallMetric label="Peserta" value={event.participants} />
                    <SmallMetric label="Tiket" value={event.tickets} />
                    <SmallMetric label="Hadiah" value={event.doorprize} />
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <Link
                      href={`/admin/events/${event.id}`}
                      className="flex h-10 items-center justify-center rounded-lg bg-purple-700 text-sm font-black text-white hover:bg-purple-800"
                    >
                      Detail
                    </Link>

                    <Link
                      href={`/admin/events/${event.id}/doorprize`}
                      className="flex h-10 items-center justify-center gap-2 rounded-lg border border-purple-200 text-sm font-black text-purple-700 hover:bg-purple-50"
                    >
                      <Gift size={16} />
                      Doorprize
                    </Link>
                  </div>

                  <button className="mt-3 flex h-9 w-full items-center justify-center gap-2 rounded-lg text-sm font-bold text-slate-500 hover:bg-slate-50">
                    <MoreHorizontal size={18} />
                    Menu Lainnya
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
        <Icon size={22} />
      </div>
      <p className="mt-4 text-3xl font-black text-slate-950">{value}</p>
      <p className="mt-1 text-sm font-semibold text-slate-500">{label}</p>
    </div>
  );
}

function SmallMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3 text-center">
      <p className="text-lg font-black text-slate-950">{value}</p>
      <p className="text-xs font-semibold text-slate-500">{label}</p>
    </div>
  );
}
