import Link from "next/link";
import {
  Activity,
  BarChart3,
  Bell,
  CalendarDays,
  Gift,
  LayoutDashboard,
  LogOut,
  Map,
  Receipt,
  Settings,
  ShieldCheck,
  Ticket,
  Users,
} from "lucide-react";

export default function AdminDashboardPage() {
  const stats = [
    {
      label: "Total User",
      value: "1.248",
      icon: Users,
    },
    {
      label: "Event Aktif",
      value: "12",
      icon: CalendarDays,
    },
    {
      label: "Order Masuk",
      value: "356",
      icon: Receipt,
    },
    {
      label: "Doorprize",
      value: "28",
      icon: Gift,
    },
  ];

  const menus = [
    {
      title: "Manajemen User",
      desc: "Kelola akun, role, dan status pengguna.",
      icon: Users,
      href: "/admin/users",
      role: "Super Admin",
    },
    {
      title: "Event Management",
      desc: "Buat, edit, dan pantau event AMOST.",
      icon: CalendarDays,
      href: "/admin/events",
      role: "Super Admin / Staff",
    },
    {
      title: "Ticketing",
      desc: "Kelola jenis tiket dan pendaftaran.",
      icon: Ticket,
      href: "/admin/tickets",
      role: "Super Admin / Staff",
    },
    {
      title: "Orders & Payments",
      desc: "Pantau order dan pembayaran peserta.",
      icon: Receipt,
      href: "/admin/orders",
      role: "Super Admin / Staff",
    },
    {
      title: "Routes & Checkpoints",
      desc: "Kelola rute, checkpoint, dan mapping event.",
      icon: Map,
      href: "/admin/routes",
      role: "Super Admin / Staff",
    },
    {
      title: "Tracking Results",
      desc: "Pantau hasil tracking aktivitas peserta.",
      icon: Activity,
      href: "/admin/tracking",
      role: "Super Admin / Staff",
    },
    {
      title: "Doorprize",
      desc: "Undian nomor peserta dan daftar pemenang.",
      icon: Gift,
      href: "/admin/doorprize",
      role: "Super Admin / Staff",
    },
    {
      title: "System Settings",
      desc: "Pengaturan sistem dan konfigurasi website.",
      icon: Settings,
      href: "/admin/settings",
      role: "Super Admin",
    },
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
                Admin Panel
              </div>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <div className="hidden rounded-full bg-purple-100 px-4 py-2 text-sm font-black text-purple-700 sm:block">
              Super Admin
            </div>

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

      <section className="mx-auto grid max-w-[1440px] grid-cols-1 gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[280px_1fr] lg:px-8">
        <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="rounded-xl bg-gradient-to-br from-purple-800 to-purple-600 p-5 text-white">
            <ShieldCheck size={34} />
            <h2 className="mt-4 text-xl font-black">AMOST Admin</h2>
            <p className="mt-2 text-sm leading-6 text-purple-100">
              Kelola event, user, ticketing, tracking, dan doorprize AMOST.
            </p>
          </div>

          <nav className="mt-6 space-y-2">
            <AdminMenu active icon={LayoutDashboard} label="Dashboard" />
            <AdminMenu icon={Users} label="Users" />
            <AdminMenu icon={CalendarDays} label="Events" />
            <AdminMenu icon={Ticket} label="Tickets" />
            <AdminMenu icon={Receipt} label="Orders" />
            <AdminMenu icon={Map} label="Routes" />
            <AdminMenu icon={Gift} label="Doorprize" />
            <AdminMenu icon={Settings} label="Settings" />
          </nav>
        </aside>

        <div className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-black uppercase tracking-wide text-purple-700">
                  Admin Dashboard
                </p>
                <h1 className="mt-2 text-3xl font-black text-slate-950">
                  Pusat Kontrol AMOST
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                  Dashboard untuk Super Admin dan Staff AMOST. Hak akses role
                  akan membatasi menu dan tindakan yang bisa dilakukan.
                </p>
              </div>

              <Link
                href="/admin/events"
                className="flex h-11 items-center justify-center rounded-lg bg-purple-700 px-5 text-sm font-black text-white hover:bg-purple-800"
              >
                Buat Event
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

          <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
            {menus.map((menu) => (
              <Link
                key={menu.title}
                href={menu.href}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
                  <menu.icon size={24} />
                </div>

                <h3 className="mt-5 text-lg font-black text-slate-950">
                  {menu.title}
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {menu.desc}
                </p>

                <div className="mt-5 rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">
                  {menu.role}
                </div>
              </Link>
            ))}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-black text-slate-950">
                Ringkasan Aktivitas Admin
              </h2>
              <BarChart3 className="text-purple-700" />
            </div>

            <div className="grid gap-3">
              <ActivityRow
                title="Event Gowes Banyumas Challenge diperbarui"
                desc="Staff AMOST mengubah informasi rute dan checkpoint."
              />
              <ActivityRow
                title="Doorprize Helm Sepeda ditambahkan"
                desc="Super Admin menambahkan hadiah untuk event aktif."
              />
              <ActivityRow
                title="User baru terdaftar"
                desc="Akun baru otomatis masuk sebagai role Umum."
              />
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}

function AdminMenu({
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
      className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-bold transition ${
        active
          ? "bg-purple-700 text-white"
          : "text-slate-700 hover:bg-slate-100"
      }`}
    >
      <Icon size={18} />
      {label}
    </button>
  );
}

function ActivityRow({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
      <p className="font-black text-slate-950">{title}</p>
      <p className="mt-1 text-sm leading-6 text-slate-500">{desc}</p>
    </div>
  );
}
