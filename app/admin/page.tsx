"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  BarChart3,
  Bell,
  CalendarDays,
  Gift,
  LayoutDashboard,
  Loader2,
  LogOut,
  Map,
  Receipt,
  Settings,
  ShieldCheck,
  Ticket,
  Users,
} from "lucide-react";

type CurrentUser = {
  id: number;
  fullName: string;
  email: string;
  phone?: string | null;
  status: string;
  role: string;
};

export default function AdminDashboardPage() {
  const router = useRouter();

  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [logoutLoading, setLogoutLoading] = useState(false);

  useEffect(() => {
    async function loadUser() {
      try {
        const response = await fetch("/api/auth/me", {
          method: "GET",
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok || !data.ok || !data.user) {
          router.replace("/login");
          return;
        }

        const role = data.user.role;

        if (role !== "super_admin" && role !== "staff_amost") {
          router.replace("/account");
          return;
        }

        setUser(data.user);
      } catch (error) {
        console.error(error);
        router.replace("/login");
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, [router]);

  async function handleLogout() {
    setLogoutLoading(true);

    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      });

      router.replace("/login");
      router.refresh();
    } catch (error) {
      console.error(error);
      alert("Logout gagal. Coba lagi.");
    } finally {
      setLogoutLoading(false);
    }
  }

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
      superAdminOnly: true,
    },
    {
      title: "Event Management",
      desc: "Buat, edit, dan pantau event AMOST.",
      icon: CalendarDays,
      href: "/admin/events",
      role: "Super Admin / Staff",
      superAdminOnly: false,
    },
    {
      title: "Ticketing",
      desc: "Kelola jenis tiket dan pendaftaran.",
      icon: Ticket,
      href: "/admin/tickets",
      role: "Super Admin / Staff",
      superAdminOnly: false,
    },
    {
      title: "Orders & Payments",
      desc: "Pantau order dan pembayaran peserta.",
      icon: Receipt,
      href: "/admin/orders",
      role: "Super Admin / Staff",
      superAdminOnly: false,
    },
    {
      title: "Routes & Checkpoints",
      desc: "Kelola rute, checkpoint, dan mapping event.",
      icon: Map,
      href: "/admin/routes",
      role: "Super Admin / Staff",
      superAdminOnly: false,
    },
    {
      title: "Tracking Results",
      desc: "Pantau hasil tracking aktivitas peserta.",
      icon: Activity,
      href: "/admin/tracking",
      role: "Super Admin / Staff",
      superAdminOnly: false,
    },
    {
      title: "Doorprize",
      desc: "Undian nomor peserta dan daftar pemenang.",
      icon: Gift,
      href: "/admin/doorprize",
      role: "Super Admin / Staff",
      superAdminOnly: false,
    },
    {
      title: "System Settings",
      desc: "Pengaturan sistem dan konfigurasi website.",
      icon: Settings,
      href: "/admin/settings",
      role: "Super Admin",
      superAdminOnly: true,
    },
  ];

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-950">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-purple-100 text-purple-700">
            <Loader2 size={28} className="animate-spin" />
          </div>
          <p className="text-lg font-black text-slate-950">
            Memeriksa akses admin...
          </p>
          <p className="mt-2 text-sm text-slate-500">
            Mohon tunggu sebentar.
          </p>
        </div>
      </main>
    );
  }

  if (!user) {
    return null;
  }

  const isSuperAdmin = user.role === "super_admin";

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
              {formatRole(user.role)}
            </div>

            <button className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-700">
              <Bell size={19} />
            </button>

            <button
              type="button"
              onClick={handleLogout}
              disabled={logoutLoading}
              className="hidden items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 sm:flex"
            >
              <LogOut size={17} />
              {logoutLoading ? "Keluar..." : "Keluar"}
            </button>
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

          <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-black uppercase tracking-wide text-slate-500">
              Login Sebagai
            </p>
            <p className="mt-2 truncate text-base font-black text-slate-950">
              {user.fullName}
            </p>
            <p className="mt-1 truncate text-sm text-slate-500">
              {user.email}
            </p>
            <p className="mt-2 text-sm font-black text-purple-700">
              {formatRole(user.role)}
            </p>
          </div>

          <nav className="mt-6 space-y-2">
            <AdminMenu active icon={LayoutDashboard} label="Dashboard" />
            <AdminMenu icon={Users} label="Users" disabled={!isSuperAdmin} />
            <AdminMenu icon={CalendarDays} label="Events" />
            <AdminMenu icon={Ticket} label="Tickets" />
            <AdminMenu icon={Receipt} label="Orders" />
            <AdminMenu icon={Map} label="Routes" />
            <AdminMenu icon={Gift} label="Doorprize" />
            <AdminMenu icon={Settings} label="Settings" disabled={!isSuperAdmin} />
          </nav>

          <button
            type="button"
            onClick={handleLogout}
            disabled={logoutLoading}
            className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 text-sm font-black text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60 sm:hidden"
          >
            <LogOut size={17} />
            {logoutLoading ? "Keluar..." : "Keluar"}
          </button>
        </aside>

        <div className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-black uppercase tracking-wide text-purple-700">
                  Admin Dashboard
                </p>
                <h1 className="mt-2 text-3xl font-black text-slate-950">
                  Halo, {user.fullName}
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                  Dashboard ini hanya bisa diakses oleh Super Admin dan Staff
                  AMOST. Hak akses role akan membatasi menu dan tindakan yang
                  bisa dilakukan.
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

          {!isSuperAdmin && (
            <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
              <p className="text-sm font-black text-amber-900">
                Mode Staff AMOST
              </p>
              <p className="mt-1 text-sm leading-6 text-amber-800">
                Akun Staff AMOST dapat mengelola event, peserta, ticketing,
                tracking, dan doorprize. Pengaturan role user dan system
                settings hanya untuk Super Admin.
              </p>
            </section>
          )}

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
            {menus.map((menu) => {
              const disabled = menu.superAdminOnly && !isSuperAdmin;

              if (disabled) {
                return (
                  <div
                    key={menu.title}
                    className="rounded-2xl border border-slate-200 bg-slate-100 p-5 opacity-70 shadow-sm"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-200 text-slate-500">
                      <menu.icon size={24} />
                    </div>

                    <h3 className="mt-5 text-lg font-black text-slate-600">
                      {menu.title}
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      {menu.desc}
                    </p>

                    <div className="mt-5 rounded-full bg-slate-200 px-3 py-1 text-xs font-black text-slate-500">
                      Khusus Super Admin
                    </div>
                  </div>
                );
              }

              return (
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
              );
            })}
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
  disabled,
}: {
  icon: any;
  label: string;
  active?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      disabled={disabled}
      className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-bold transition ${
        active
          ? "bg-purple-700 text-white"
          : disabled
            ? "cursor-not-allowed bg-slate-100 text-slate-400"
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

function formatRole(role: string) {
  if (role === "super_admin") return "Super Admin";
  if (role === "staff_amost") return "Staff AMOST";
  return "Umum";
}
