import Link from "next/link";
import {
  Activity,
  Bell,
  CalendarDays,
  ChevronRight,
  LogOut,
  MapPin,
  Medal,
  Settings,
  Ticket,
  User,
} from "lucide-react";

export default function AccountPage() {
  const stats = [
    {
      label: "Event Diikuti",
      value: "3",
      icon: CalendarDays,
    },
    {
      label: "Total Aktivitas",
      value: "12",
      icon: Activity,
    },
    {
      label: "Tiket Aktif",
      value: "2",
      icon: Ticket,
    },
    {
      label: "Achievement",
      value: "5",
      icon: Medal,
    },
  ];

  const activities = [
    {
      title: "Gowes Pagi Purwokerto",
      type: "Sepeda",
      distance: "28.62 km",
      date: "22 Juni 2026",
      status: "Selesai",
    },
    {
      title: "Jalan Sehat AMOST",
      type: "Jalan Sehat",
      distance: "5.10 km",
      date: "18 Juni 2026",
      status: "Selesai",
    },
    {
      title: "Latihan Lari Sore",
      type: "Lari",
      distance: "7.45 km",
      date: "15 Juni 2026",
      status: "Selesai",
    },
  ];

  const tickets = [
    {
      event: "Gowes Banyumas Challenge",
      number: "A-1024",
      status: "Aktif",
    },
    {
      event: "Sehat Bersama AMOST",
      number: "B-0788",
      status: "Aktif",
    },
  ];

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-[1280px] items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="logo-symbol responsive-logo">A</div>
            <div>
              <div className="text-[26px] font-black leading-none tracking-wide text-purple-700">
                AMOST
              </div>
              <div className="mt-1 text-[8px] font-black uppercase leading-[1.05] tracking-wide text-purple-700">
                User Account
              </div>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <button className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-700">
              <Bell size={19} />
            </button>

            <Link
              href="/"
              className="hidden items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 sm:flex"
            >
              <LogOut size={17} />
              Keluar
            </Link>
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-[1280px] grid-cols-1 gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[280px_1fr] lg:px-8">
        <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-purple-100 text-purple-700">
              <User size={30} />
            </div>

            <div>
              <h2 className="text-lg font-black text-slate-950">
                Pengguna AMOST
              </h2>
              <p className="text-sm font-semibold text-purple-700">Umum</p>
            </div>
          </div>

          <div className="mt-6 rounded-xl bg-purple-50 p-4">
            <p className="text-xs font-black uppercase tracking-wide text-purple-700">
              Nomor Peserta Aktif
            </p>
            <p className="mt-2 text-2xl font-black text-slate-950">A-1024</p>
            <p className="mt-1 text-sm text-slate-600">
              Gowes Banyumas Challenge
            </p>
          </div>

          <nav className="mt-6 space-y-2">
            <AccountMenu active icon={User} label="Dashboard" />
            <AccountMenu icon={CalendarDays} label="Event Saya" />
            <AccountMenu icon={Ticket} label="Tiket / Pendaftaran" />
            <AccountMenu icon={Activity} label="Aktivitas Tracking" />
            <AccountMenu icon={Medal} label="Achievement" />
            <AccountMenu icon={Settings} label="Pengaturan Akun" />
          </nav>
        </aside>

        <div className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-black uppercase tracking-wide text-purple-700">
                  Dashboard Account
                </p>
                <h1 className="mt-2 text-3xl font-black text-slate-950">
                  Halo, selamat datang di AMOST
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                  Pantau event, nomor peserta, aktivitas tracking, tiket, dan
                  pencapaian olahraga outdoor kamu.
                </p>
              </div>

              <Link
                href="/events"
                className="flex h-11 items-center justify-center rounded-lg bg-purple-700 px-5 text-sm font-black text-white hover:bg-purple-800"
              >
                Jelajahi Event
              </Link>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
                  <item.icon size={22} />
                </div>

                <p className="mt-5 text-3xl font-black text-slate-950">
                  {item.value}
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-500">
                  {item.label}
                </p>
              </div>
            ))}
          </section>

          <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_360px]">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-xl font-black text-slate-950">
                  Aktivitas Terbaru
                </h2>
                <Link
                  href="#"
                  className="text-sm font-bold text-purple-700 hover:text-purple-900"
                >
                  Lihat Semua
                </Link>
              </div>

              <div className="space-y-3">
                {activities.map((activity) => (
                  <div
                    key={activity.title}
                    className="flex flex-col gap-3 rounded-xl border border-slate-100 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <h3 className="font-black text-slate-950">
                        {activity.title}
                      </h3>
                      <p className="mt-1 flex items-center gap-2 text-sm text-slate-500">
                        <MapPin size={14} className="text-purple-700" />
                        {activity.type} • {activity.date}
                      </p>
                    </div>

                    <div className="text-left sm:text-right">
                      <p className="font-black text-slate-950">
                        {activity.distance}
                      </p>
                      <p className="mt-1 text-xs font-bold text-green-600">
                        {activity.status}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-black text-slate-950">
                Tiket Aktif
              </h2>

              <div className="mt-5 space-y-3">
                {tickets.map((ticket) => (
                  <div
                    key={ticket.number}
                    className="rounded-xl border border-purple-100 bg-purple-50 p-4"
                  >
                    <p className="text-sm font-bold text-slate-600">
                      {ticket.event}
                    </p>
                    <p className="mt-2 text-2xl font-black text-purple-700">
                      {ticket.number}
                    </p>
                    <p className="mt-1 text-xs font-bold text-green-600">
                      {ticket.status}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-5 rounded-xl border border-slate-200 p-4">
                <p className="text-sm font-black text-slate-950">
                  Doorprize Event
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Nomor peserta aktif kamu akan digunakan untuk undian doorprize
                  pada event yang menyediakan hadiah.
                </p>
              </div>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}

function AccountMenu({
  icon: Icon,
  label,
  active,
}: {
  icon: any;
  label: string;
  active?: boolean;
}) {
  return (
    <button
      className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-sm font-bold transition ${
        active
          ? "bg-purple-700 text-white"
          : "text-slate-700 hover:bg-slate-100"
      }`}
    >
      <span className="flex items-center gap-3">
        <Icon size={18} />
        {label}
      </span>
      <ChevronRight size={16} />
    </button>
  );
}
