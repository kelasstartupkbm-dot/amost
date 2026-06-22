import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Gift,
  Map,
  MapPin,
  Route,
  Ticket,
  Users,
} from "lucide-react";

export default function AdminEventDetailPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-[1440px] items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/admin/events" className="flex items-center gap-3">
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
            href="/admin/events"
            className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
          >
            <ArrowLeft size={17} />
            Events
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="relative h-56 bg-gradient-to-br from-purple-100 via-slate-100 to-slate-200">
            <div className="absolute left-6 top-6 rounded-full bg-green-100 px-4 py-2 text-sm font-black text-green-700">
              Aktif
            </div>

            <div className="absolute bottom-0 left-0 right-0 h-36 opacity-80">
              <svg viewBox="0 0 900 220" className="h-full w-full">
                <path
                  d="M0 180 L120 55 L240 180 L350 80 L460 180 L600 60 L720 180 L900 90 L900 220 L0 220 Z"
                  fill="#cbd5e1"
                />
                <circle cx="720" cy="48" r="25" fill="#cbd5e1" />
              </svg>
            </div>
          </div>

          <div className="p-6">
            <p className="text-sm font-black uppercase tracking-wide text-purple-700">
              Sepeda
            </p>
            <h1 className="mt-2 text-3xl font-black text-slate-950">
              Gowes Banyumas Challenge
            </h1>

            <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-600">
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

            <p className="mt-5 max-w-3xl text-sm leading-7 text-slate-600">
              Event sepeda outdoor AMOST dengan tracking realtime, nomor
              peserta, tiket online, route map, checkpoint, leaderboard, dan
              undian nomor peserta untuk doorprize.
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard icon={Users} label="Peserta" value="1.245" />
          <MetricCard icon={Ticket} label="Tiket Aktif" value="980" />
          <MetricCard icon={Map} label="Checkpoint" value="8" />
          <MetricCard icon={Gift} label="Hadiah Doorprize" value="12" />
        </div>

        <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-4">
          <ActionCard
            icon={Users}
            title="Peserta Event"
            desc="Lihat daftar peserta dan nomor peserta."
            href="/admin/events/demo-event/participants"
          />
          <ActionCard
            icon={Ticket}
            title="Ticketing"
            desc="Kelola tiket dan pendaftaran event."
            href="#"
          />
          <ActionCard
            icon={Map}
            title="Route & Checkpoint"
            desc="Kelola rute dan checkpoint event."
            href="#"
          />
          <ActionCard
            icon={Gift}
            title="Doorprize"
            desc="Undian nomor peserta dan pemenang."
            href="/admin/events/demo-event/doorprize"
          />
        </div>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black text-slate-950">
            Status Persiapan Event
          </h2>

          <div className="mt-5 grid gap-3">
            <StatusRow text="Event sudah aktif dan tampil di halaman publik." />
            <StatusRow text="Nomor peserta otomatis dibuat saat user valid terdaftar." />
            <StatusRow text="Doorprize dapat diundi berdasarkan nomor peserta valid." />
            <StatusRow text="Pemenang doorprize akan tersimpan di riwayat undian." />
          </div>
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
      <p className="mt-5 text-3xl font-black text-slate-950">{value}</p>
      <p className="mt-1 text-sm font-semibold text-slate-500">{label}</p>
    </div>
  );
}

function ActionCard({
  icon: Icon,
  title,
  desc,
  href,
}: {
  icon: any;
  title: string;
  desc: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
        <Icon size={24} />
      </div>
      <h3 className="mt-5 text-lg font-black text-slate-950">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-500">{desc}</p>
    </Link>
  );
}

function StatusRow({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-4">
      <CheckCircle2 size={20} className="text-green-600" />
      <p className="text-sm font-semibold text-slate-700">{text}</p>
    </div>
  );
}
