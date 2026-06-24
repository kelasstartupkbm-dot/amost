"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  Bell,
  CalendarDays,
  ChevronRight,
  History,
  LogOut,
  MapPin,
  Medal,
  Settings,
  ShieldCheck,
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

type OfficialAccess = {
  id: number;
  event_id: number | string;
  user_id: number | string;
  permission_level: string;
  status: string;
  notes?: string | null;
  event_title?: string | null;
  event_name?: string | null;
};

type AccountTab = "biodata" | "history" | "results";

export default function AccountPage() {
  const router = useRouter();

  const [user, setUser] = useState<CurrentUser | null>(null);
  const [officialAccess, setOfficialAccess] = useState<OfficialAccess[]>([]);
  const [loading, setLoading] = useState(true);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<AccountTab>("biodata");

  const hasOfficialAccess = officialAccess.length > 0;

  useEffect(() => {
    let cancelled = false;

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

        if (!cancelled) {
          setUser(data.user);
        }

        try {
          const officialResponse = await fetch("/api/account/event-officials", {
            method: "GET",
            cache: "no-store",
          });

          const officialData = await officialResponse.json().catch(() => null);

          if (!cancelled && officialResponse.ok && officialData?.ok) {
            const rows = Array.isArray(officialData.data)
              ? officialData.data
              : Array.isArray(officialData.items)
              ? officialData.items
              : [];

            setOfficialAccess(rows);
          }
        } catch (officialError) {
          console.error(officialError);
          if (!cancelled) {
            setOfficialAccess([]);
          }
        }
      } catch (error) {
        console.error(error);
        router.replace("/login");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadUser();

    return () => {
      cancelled = true;
    };
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
    [],
  );

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

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <AccountTopHeader
        activeTab={activeTab}
        logoutLoading={logoutLoading}
        onChangeTab={setActiveTab}
        onLogout={handleLogout}
      />

      <section className="mx-auto grid max-w-[1280px] grid-cols-1 gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[280px_1fr] lg:px-8">
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
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-black text-purple-700">
                  {formatRole(user.role)}
                </span>

                {hasOfficialAccess && (
                  <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-black text-green-700">
                    Official Event
                  </span>
                )}
              </div>
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

          {hasOfficialAccess && (
            <div className="mt-4 rounded-xl border border-green-200 bg-green-50 p-4">
              <p className="text-xs font-black uppercase tracking-wide text-green-700">
                Akses Official Event
              </p>
              <p className="mt-2 text-2xl font-black text-slate-950">
                {officialAccess.length}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                Event ditugaskan sebagai official.
              </p>

              <Link
                href="/official"
                className="mt-4 flex h-10 items-center justify-center rounded-xl bg-green-700 text-sm font-black text-white hover:bg-green-800"
              >
                Buka Panel Official
              </Link>
            </div>
          )}

          <nav className="mt-6 space-y-2">
            <AccountMenu
              href="/account/tracking"
              highlight
              icon={Activity}
              label="Tracking Dashboard"
            />
            <AccountMenu
              active={activeTab === "biodata"}
              icon={User}
              label="Biodata"
              onClick={() => setActiveTab("biodata")}
            />
            <AccountMenu
              active={activeTab === "history"}
              icon={History}
              label="History"
              onClick={() => setActiveTab("history")}
            />
            <AccountMenu
              active={activeTab === "results"}
              icon={Activity}
              label="Results"
              onClick={() => setActiveTab("results")}
            />
            {hasOfficialAccess && (
              <AccountMenu
                href="/official"
                highlight
                icon={ShieldCheck}
                label="Panel Official Event"
              />
            )}
            <AccountMenu icon={CalendarDays} label="Event Saya" />
            <AccountMenu icon={Ticket} label="Tiket / Pendaftaran" />
            <AccountMenu icon={Medal} label="Achievement" />
            <AccountMenu icon={Settings} label="Pengaturan Akun" />
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
                  {activeTab === "biodata" && "Biodata Account"}
                  {activeTab === "history" && "History Account"}
                  {activeTab === "results" && "Results Account"}
                </p>
                <h1 className="mt-2 text-3xl font-black text-slate-950">
                  Halo, {user.fullName}
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                  Pantau biodata, riwayat aktivitas, hasil tracking, tiket event,
                  dan pencapaian olahraga outdoor kamu.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/account/tracking"
                  className="flex h-11 items-center justify-center rounded-lg bg-purple-700 px-5 text-sm font-black text-white hover:bg-purple-800"
                >
                  Tracking Dashboard
                </Link>

                {hasOfficialAccess && (
                  <Link
                    href="/official"
                    className="flex h-11 items-center justify-center rounded-lg bg-green-700 px-5 text-sm font-black text-white hover:bg-green-800"
                  >
                    Panel Official
                  </Link>
                )}

                <Link
                  href="/events"
                  className="flex h-11 items-center justify-center rounded-lg border border-slate-200 bg-white px-5 text-sm font-black text-slate-700 hover:bg-slate-50"
                >
                  Jelajahi Event
                </Link>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <AccountQuickLink
              href="/account/tracking"
              icon={Activity}
              title="Tracking Dashboard"
              description="Buka dashboard tracking akun seperti mockup lama."
              tone="purple"
            />
            <AccountQuickLink
              href="/events"
              icon={CalendarDays}
              title="Event Saya"
              description="Lihat dan pilih event yang ingin diikuti."
              tone="slate"
            />
            <AccountQuickLink
              href="/official"
              icon={ShieldCheck}
              title="Panel Official"
              description={
                hasOfficialAccess
                  ? "Kelola event yang ditugaskan sebagai official."
                  : "Muncul aktif jika akun diberi akses official event."
              }
              tone={hasOfficialAccess ? "green" : "slate"}
            />
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

          {activeTab === "biodata" && (
            <BiodataContent
              user={user}
              tickets={tickets}
              hasOfficialAccess={hasOfficialAccess}
              officialAccess={officialAccess}
            />
          )}
          {activeTab === "history" && <HistoryContent activities={activities} />}
          {activeTab === "results" && <ResultsContent activities={activities} />}
        </div>
      </section>
    </main>
  );
}

function AccountTopHeader({
  activeTab,
  logoutLoading,
  onChangeTab,
  onLogout,
}: {
  activeTab: AccountTab;
  logoutLoading: boolean;
  onChangeTab: (tab: AccountTab) => void;
  onLogout: () => void;
}) {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-xl">
      <div className="mx-auto flex min-h-20 max-w-[1280px] flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div className="flex items-center justify-between gap-4">
          <Link
            href="/"
            aria-label="Kembali ke beranda AMOST"
            className="inline-flex items-center"
          >
            <img
              src="/amost_logo_wide_.png"
              alt="AMOST"
              className="h-[48px] w-auto object-contain sm:h-[58px]"
            />
          </Link>

          <button
            type="button"
            onClick={onLogout}
            disabled={logoutLoading}
            className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 px-4 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 lg:hidden"
          >
            <LogOut size={17} />
            {logoutLoading ? "Keluar..." : "Keluar"}
          </button>
        </div>

        <nav className="flex w-full items-center justify-center lg:w-auto">
          <div className="grid w-full grid-cols-3 rounded-full bg-slate-100 p-1 text-sm font-black text-slate-700 sm:w-auto">
            <AccountTabButton
              active={activeTab === "biodata"}
              label="Biodata"
              onClick={() => onChangeTab("biodata")}
            />
            <AccountTabButton
              active={activeTab === "history"}
              label="History"
              onClick={() => onChangeTab("history")}
            />
            <AccountTabButton
              active={activeTab === "results"}
              label="Results"
              onClick={() => onChangeTab("results")}
            />
          </div>
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <button className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-700">
            <Bell size={19} />
          </button>

          <button
            type="button"
            onClick={onLogout}
            disabled={logoutLoading}
            className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 px-4 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <LogOut size={17} />
            {logoutLoading ? "Keluar..." : "Keluar"}
          </button>
        </div>
      </div>
    </header>
  );
}

function AccountQuickLink({
  href,
  icon: Icon,
  title,
  description,
  tone,
}: {
  href: string;
  icon: LucideIcon;
  title: string;
  description: string;
  tone: "purple" | "green" | "slate";
}) {
  const toneClass =
    tone === "green"
      ? "border-green-200 bg-green-50 text-green-700 hover:bg-green-100"
      : tone === "purple"
        ? "border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100"
        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50";

  return (
    <Link
      href={href}
      className={`group rounded-2xl border p-5 shadow-sm transition ${toneClass}`}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/80">
        <Icon size={23} />
      </div>

      <h3 className="mt-5 text-lg font-black text-slate-950">{title}</h3>
      <p className="mt-2 text-sm font-medium leading-6 text-slate-600">
        {description}
      </p>

      <p className="mt-4 inline-flex items-center gap-2 text-sm font-black">
        Buka
        <ChevronRight size={16} />
      </p>
    </Link>
  );
}

function AccountTabButton({
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
      className={`rounded-full px-6 py-2.5 transition ${
        active
          ? "bg-purple-700 text-white shadow-sm"
          : "text-slate-700 hover:bg-white hover:text-purple-700"
      }`}
    >
      {label}
    </button>
  );
}

function AccountMenu({
  icon: Icon,
  label,
  active,
  onClick,
  href,
  highlight,
}: {
  icon: LucideIcon;
  label: string;
  active?: boolean;
  onClick?: () => void;
  href?: string;
  highlight?: boolean;
}) {
  const className = `flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-sm font-bold transition ${
    active
      ? "bg-purple-700 text-white"
      : highlight
      ? "bg-green-50 text-green-700 hover:bg-green-100"
      : "text-slate-700 hover:bg-slate-100"
  }`;

  const content = (
    <>
      <span className="flex items-center gap-3">
        <Icon size={18} />
        {label}
      </span>
      <ChevronRight size={16} />
    </>
  );

  if (href) {
    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={className}>
      {content}
    </button>
  );
}

function BiodataContent({
  user,
  tickets,
  hasOfficialAccess,
  officialAccess,
}: {
  user: CurrentUser;
  tickets: Array<{ event: string; number: string; status: string }>;
  hasOfficialAccess: boolean;
  officialAccess: OfficialAccess[];
}) {
  return (
    <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_360px]">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-black text-slate-950">Biodata Member</h2>

        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
          <InfoBox label="Nama Lengkap" value={user.fullName} />
          <InfoBox label="Email" value={user.email} />
          <InfoBox label="Nomor HP" value={user.phone || "Belum diisi"} />
          <InfoBox label="Status Akun" value={formatStatus(user.status)} />
          <InfoBox label="Role Utama" value={formatRole(user.role)} />
          <InfoBox
            label="Akses Tambahan"
            value={hasOfficialAccess ? "Official Event" : "-"}
          />
          <InfoBox
            label="Jumlah Event Official"
            value={hasOfficialAccess ? String(officialAccess.length) : "0"}
          />
          <InfoBox label="ID Member" value={String(user.id)} />
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

function HistoryContent({
  activities,
}: {
  activities: Array<{
    title: string;
    type: string;
    distance: string;
    date: string;
    status: string;
  }>;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-xl font-black text-slate-950">History Aktivitas</h2>
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
  activities,
}: {
  activities: Array<{
    title: string;
    type: string;
    distance: string;
    date: string;
    status: string;
  }>;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-black text-slate-950">Results Tracking</h2>
      <p className="mt-2 text-sm leading-6 text-slate-500">
        Ringkasan hasil tracking dan pencapaian dari aktivitas yang sudah
        selesai.
      </p>

      <div className="mt-5 overflow-hidden rounded-xl border border-slate-200">
        <div className="grid grid-cols-[1fr_120px_120px] bg-slate-50 px-4 py-3 text-xs font-black uppercase tracking-wide text-slate-500">
          <p>Aktivitas</p>
          <p>Jarak</p>
          <p>Status</p>
        </div>

        {activities.map((activity) => (
          <div
            key={activity.title}
            className="grid grid-cols-[1fr_120px_120px] border-t border-slate-100 px-4 py-4 text-sm"
          >
            <div>
              <p className="font-black text-slate-950">{activity.title}</p>
              <p className="mt-1 text-slate-500">
                {activity.type} • {activity.date}
              </p>
            </div>
            <p className="font-black text-slate-950">{activity.distance}</p>
            <p className="font-bold text-green-600">{activity.status}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
      <p className="text-xs font-black uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-2 break-words font-black text-slate-950">{value}</p>
    </div>
  );
}

function formatRole(role: string) {
  if (role === "super_admin") return "Super Admin";
  if (role === "staff_amost") return "Staff AMOST";
  return "Umum";
}

function formatStatus(status: string) {
  if (!status) return "Aktif";
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
}
