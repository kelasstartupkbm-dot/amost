"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  Bell,
  CalendarDays,
  Download,
  LogOut,
  MapPin,
  Medal,
  Ticket,
  User,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type CurrentUser = {
  id: number;
  fullName: string;
  email: string;
  phone?: string | null;
  status: string;
  role: string;
};

type AccountTab = "biodata" | "history" | "results";

type ActivityItem = {
  title: string;
  type: string;
  distance: string;
  date: string;
  status: string;
};

type TicketItem = {
  event: string;
  number: string;
  status: string;
};

export default function AccountPage() {
  const router = useRouter();

  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<AccountTab>("biodata");

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

  const stats = useMemo(
    () => [
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
    ],
    []
  );

  const activities: ActivityItem[] = [
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

  const tickets: TicketItem[] = [
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

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-950">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-purple-100 text-purple-700">
            <User size={28} />
          </div>
          <p className="text-lg font-black text-slate-950">
            Memuat akun AMOST...
          </p>
          <p className="mt-2 text-sm text-slate-500">Mohon tunggu sebentar.</p>
        </div>
      </main>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <AccountHeader
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        logoutLoading={logoutLoading}
        onLogout={handleLogout}
      />

      <section className="mx-auto grid max-w-[1280px] grid-cols-1 gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[290px_1fr] lg:px-8">
        <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-purple-100 text-purple-700">
              <User size={30} />
            </div>

            <div className="min-w-0">
              <h2 className="truncate text-lg font-black text-slate-950">
                {user.fullName}
              </h2>
              <p className="truncate text-sm text-slate-500">{user.email}</p>
              <p className="mt-1 text-sm font-semibold text-purple-700">
                {formatRole(user.role)}
              </p>
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

          <div className="mt-5 grid grid-cols-3 gap-2 lg:hidden">
            <MobileTabButton
              active={activeTab === "biodata"}
              label="Biodata"
              onClick={() => setActiveTab("biodata")}
            />
            <MobileTabButton
              active={activeTab === "history"}
              label="History"
              onClick={() => setActiveTab("history")}
            />
            <MobileTabButton
              active={activeTab === "results"}
              label="Results"
              onClick={() => setActiveTab("results")}
            />
          </div>

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
                  {activeTab === "biodata" && "Biodata Account"}
                  {activeTab === "history" && "History Aktivitas"}
                  {activeTab === "results" && "Results & Tiket"}
                </p>
                <h1 className="mt-2 text-3xl font-black text-slate-950">
                  Halo, {user.fullName}
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                  Pantau biodata, riwayat aktivitas, hasil tracking, tiket event,
                  dan pencapaian olahraga outdoor kamu.
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
              <StatCard
                key={item.label}
                icon={item.icon}
                label={item.label}
                value={item.value}
              />
            ))}
          </section>

          {activeTab === "biodata" && (
            <BiodataContent user={user} tickets={tickets} />
          )}

          {activeTab === "history" && (
            <HistoryContent activities={activities} />
          )}

          {activeTab === "results" && (
            <ResultsContent tickets={tickets} activities={activities} />
          )}
        </div>
      </section>
    </main>
  );
}

function AccountHeader({
  activeTab,
  setActiveTab,
  logoutLoading,
  onLogout,
}: {
  activeTab: AccountTab;
  setActiveTab: (tab: AccountTab) => void;
  logoutLoading: boolean;
  onLogout: () => void;
}) {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-[1280px] items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/account" className="flex items-center">
          <img
            src="/amost_logo_wide_.png"
            alt="AMOST"
            className="h-[46px] w-auto object-contain sm:h-[54px]"
          />
        </Link>

        <nav className="hidden items-center gap-2 rounded-full bg-slate-100 p-1 lg:flex">
          <HeaderTabButton
            active={activeTab === "biodata"}
            label="Biodata"
            onClick={() => setActiveTab("biodata")}
          />
          <HeaderTabButton
            active={activeTab === "history"}
            label="History"
            onClick={() => setActiveTab("history")}
          />
          <HeaderTabButton
            active={activeTab === "results"}
            label="Results"
            onClick={() => setActiveTab("results")}
          />
        </nav>

        <div className="flex items-center gap-3">
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200"
            aria-label="Notifikasi"
          >
            <Bell size={19} />
          </button>

          <button
            type="button"
            onClick={onLogout}
            disabled={logoutLoading}
            className="hidden items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 sm:flex"
          >
            <LogOut size={17} />
            {logoutLoading ? "Keluar..." : "Keluar"}
          </button>
        </div>
      </div>
    </header>
  );
}

function HeaderTabButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-5 py-2 text-sm font-black transition ${
        active
          ? "bg-purple-700 text-white shadow-sm"
          : "text-slate-700 hover:bg-white hover:text-purple-700"
      }`}
    >
      {label}
    </button>
  );
}

function MobileTabButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg px-3 py-2 text-xs font-black transition ${
        active ? "bg-purple-700 text-white" : "bg-white text-slate-700"
      }`}
    >
      {label}
    </button>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
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

function BiodataContent({
  user,
  tickets,
}: {
  user: CurrentUser;
  tickets: TicketItem[];
}) {
  return (
    <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_360px]">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-black text-slate-950">Biodata Member</h2>

        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
          <InfoItem label="Nama Lengkap" value={user.fullName} />
          <InfoItem label="Email" value={user.email} />
          <InfoItem label="Nomor HP" value={user.phone || "Belum diisi"} />
          <InfoItem label="Status Akun" value={formatStatus(user.status)} />
          <InfoItem label="Role" value={formatRole(user.role)} />
          <InfoItem label="ID Member" value={`AMOST-${user.id}`} />
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-black text-slate-950">Tiket Aktif</h2>

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
      </div>
    </section>
  );
}

function HistoryContent({ activities }: { activities: ActivityItem[] }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-xl font-black text-slate-950">History Aktivitas</h2>
        <Link
          href="/events"
          className="text-sm font-bold text-purple-700 hover:text-purple-900"
        >
          Cari Event
        </Link>
      </div>

      <div className="space-y-3">
        {activities.map((activity) => (
          <div
            key={activity.title}
            className="flex flex-col gap-3 rounded-xl border border-slate-100 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <h3 className="font-black text-slate-950">{activity.title}</h3>
              <p className="mt-1 flex items-center gap-2 text-sm text-slate-500">
                <MapPin size={14} className="text-purple-700" />
                {activity.type} • {activity.date}
              </p>
            </div>

            <div className="text-left sm:text-right">
              <p className="font-black text-slate-950">{activity.distance}</p>
              <p className="mt-1 text-xs font-bold text-green-600">
                {activity.status}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function ResultsContent({
  tickets,
  activities,
}: {
  tickets: TicketItem[];
  activities: ActivityItem[];
}) {
  return (
    <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_360px]">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-black text-slate-950">Results Tracking</h2>

        <div className="mt-5 overflow-hidden rounded-xl border border-slate-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Aktivitas</th>
                <th className="px-4 py-3">Jarak</th>
                <th className="px-4 py-3">Tanggal</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {activities.map((activity) => (
                <tr key={activity.title} className="bg-white">
                  <td className="px-4 py-3 font-bold text-slate-900">
                    {activity.title}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {activity.distance}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {activity.date}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-black text-green-700">
                      {activity.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-black text-slate-950">Kartu Peserta</h2>

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
              <div className="mt-3 flex items-center justify-between">
                <p className="text-xs font-bold text-green-600">
                  {ticket.status}
                </p>
                <button
                  type="button"
                  className="inline-flex items-center gap-1 text-xs font-black text-purple-700"
                >
                  <Download size={14} />
                  Unduh
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 rounded-xl border border-slate-200 p-4">
          <p className="text-sm font-black text-slate-950">Doorprize Event</p>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Nomor peserta aktif kamu akan digunakan untuk undian doorprize pada
            event yang menyediakan hadiah.
          </p>
        </div>
      </div>
    </section>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
      <p className="text-xs font-black uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-2 break-words text-sm font-bold text-slate-950">
        {value}
      </p>
    </div>
  );
}

function formatRole(role: string) {
  const normalizedRole = String(role || "").toLowerCase();

  if (normalizedRole === "super_admin") return "Super Admin";
  if (normalizedRole === "staff_amost") return "Staff AMOST";
  if (normalizedRole === "official") return "Official";
  if (normalizedRole === "athlete") return "Athlete";
  if (normalizedRole === "parent") return "Orang Tua";

  return "Umum";
}

function formatStatus(status: string) {
  const normalizedStatus = String(status || "").toLowerCase();

  if (normalizedStatus === "active") return "Aktif";
  if (normalizedStatus === "inactive") return "Tidak Aktif";
  if (normalizedStatus === "pending") return "Menunggu Verifikasi";

  return status || "Aktif";
}
