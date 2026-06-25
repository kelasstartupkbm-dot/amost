"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Bell,
  Bike,
  CalendarDays,
  Camera,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  ClipboardList,
  Download,
  FileText,
  Flag,
  Gauge,
  Gift,
  Home,
  Layers,
  LineChart,
  Map,
  MapPin,
  MessageCircle,
  Minus,
  Navigation,
  Pause,
  Plus,
  Search,
  Settings,
  Share2,
  ShieldCheck,
  Square,
  Ticket,
  Trophy,
  UserRound,
  UsersRound,
  Wifi,
} from "lucide-react";

type CurrentUser = {
  id?: number | string;
  fullName?: string | null;
  name?: string | null;
  username?: string | null;
  email?: string | null;
  role?: string | null;
  role_label?: string | null;
};

type EventItem = {
  id: number | string;
  title?: string | null;
  event_title?: string | null;
  name?: string | null;
  event_date?: string | null;
  location?: string | null;
  participant_count?: number | string | null;
  quota?: number | string | null;
  doorprize_count?: number | string | null;
  status?: string | null;
};

const TRACKING_REQUEST_TIMEOUT_MS = 4500;

async function fetchTrackingJson(
  url: string,
  init: RequestInit = {},
  timeoutMs = TRACKING_REQUEST_TIMEOUT_MS,
) {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...init,
      cache: "no-store",
      credentials: "include",
      signal: controller.signal,
    });

    const data = await response.json().catch(() => null);

    return { response, data };
  } finally {
    window.clearTimeout(timer);
  }
}

const MOCK_PARTICIPANTS = [
  {
    name: "Budi Santoso",
    label: "You",
    speed: "25.3 km/h",
    distance: "12.45 km",
    extra: "",
    active: true,
  },
  {
    name: "Rian Maulana",
    label: "",
    speed: "24.8 km/h",
    distance: "12.30 km",
    extra: "+150 m",
    active: false,
  },
  {
    name: "Dedi Kurniawan",
    label: "",
    speed: "23.7 km/h",
    distance: "12.10 km",
    extra: "+280 m",
    active: false,
  },
  {
    name: "Fajar Ramadhan",
    label: "",
    speed: "22.1 km/h",
    distance: "11.80 km",
    extra: "+560 m",
    active: false,
  },
  {
    name: "Agung Setiawan",
    label: "",
    speed: "21.0 km/h",
    distance: "11.20 km",
    extra: "+850 m",
    active: false,
  },
];

function getDisplayName(user: CurrentUser | null) {
  const value = String(
    user?.fullName ||
      user?.name ||
      user?.username ||
      user?.email?.split("@")[0] ||
      "Pengguna",
  ).trim();

  return value || "Pengguna";
}

function getInitials(name: string) {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) return "A";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();

  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function getEventTitle(event: EventItem | null | undefined) {
  return (
    String(event?.title || event?.event_title || event?.name || "").trim() ||
    "Gowes Banyumas Challenge"
  );
}

function formatDate(value: string | null | undefined) {
  if (!value) return "18 Mei 2024";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function isActiveEvent(event: EventItem) {
  const status = String(event.status || "").toLowerCase();

  return (
    status === "active" ||
    status === "published" ||
    status === "live" ||
    status === "upcoming" ||
    status === "aktif" ||
    !status
  );
}

export default function AccountTrackingMockupPage() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(false);

  async function loadData() {
    try {
      const [userResult, eventsResult] = await Promise.all([
        fetchTrackingJson("/api/auth/me", { method: "GET" }, 4000).catch(() => null),
        fetchTrackingJson("/api/events", { method: "GET" }, 4500).catch(() => null),
      ]);

      if (userResult?.response.ok && userResult.data?.user) {
        setUser(userResult.data.user);
      }

      if (eventsResult?.response.ok && eventsResult.data?.ok !== false) {
        const rows = Array.isArray(eventsResult.data?.events)
          ? eventsResult.data.events
          : Array.isArray(eventsResult.data?.data)
            ? eventsResult.data.data
            : Array.isArray(eventsResult.data?.items)
              ? eventsResult.data.items
              : [];

        setEvents(rows);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const activeEvent = useMemo(() => {
    return events.find(isActiveEvent) || events[0] || null;
  }, [events]);

  const displayName = getDisplayName(user);
  const initials = getInitials(displayName);
  const eventTitle = getEventTitle(activeEvent);
  const participantCount = Number(activeEvent?.participant_count || 5);
  const quota = Number(activeEvent?.quota || 20);
  const eventId = activeEvent?.id || 3;

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-md rounded-[2rem] border border-slate-200 bg-white p-8 text-center shadow-sm">
          <img
            src="/amost_logo_wide_.png"
            alt="AMOST"
            className="mx-auto h-20 w-auto object-contain"
          />
          <p className="mt-6 text-xl font-black text-slate-950">
            Memuat Tracking Live...
          </p>
          <p className="mt-2 text-sm font-semibold text-slate-500">
            Menyiapkan layout tracking AMOST.
          </p>
          <div className="mx-auto mt-6 h-3 w-full max-w-xs overflow-hidden rounded-full bg-slate-100">
            <div className="h-full w-2/3 animate-pulse rounded-full bg-gradient-to-r from-purple-500 via-purple-700 to-fuchsia-500" />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f7f8fb] text-slate-950">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[260px] border-r border-slate-200 bg-white/95 shadow-[0_0_40px_rgba(15,23,42,0.04)] backdrop-blur-xl lg:block">
        <div className="flex h-[92px] items-center px-8">
          <Link href="/home" className="inline-flex items-center">
            <img
              src="/amost_logo_wide_.png"
              alt="AMOST"
              className="h-[66px] w-auto object-contain"
            />
          </Link>
        </div>

        <nav className="space-y-1 px-5 py-5">
          <SidebarLink href="/home" icon={Home} label="Dashboard" />
          <SidebarLink href="/account/tracking" icon={Navigation} label="Tracking" active />
          <SidebarLink href="/account/activities" icon={Activity} label="My Activities" />
          <SidebarLink href="/account/events" icon={CalendarDays} label="My Events" />
          <SidebarLink href="/account/tickets" icon={Ticket} label="My Tickets" />
          <SidebarLink href="/account/achievement" icon={Trophy} label="Achievement" />
          <SidebarLink href="/account/statistics" icon={LineChart} label="Statistics" />
          <SidebarLink href="/account/notification" icon={Bell} label="Notification" badge="3" />
          <SidebarLink href="/account" icon={UserRound} label="Profile" />
          <SidebarLink href="/account/settings" icon={Settings} label="Settings" />
        </nav>

        <div className="absolute bottom-5 left-5 right-5">
          <div className="overflow-hidden rounded-[1.25rem] border border-purple-100 bg-gradient-to-br from-white to-purple-50 p-4 shadow-sm">
            <p className="text-base font-black text-purple-700">
              Tracking lebih seru
            </p>
            <p className="mt-2 text-xs font-semibold leading-5 text-slate-600">
              di aplikasi AMOST
            </p>

            <ul className="mt-4 space-y-2 text-xs font-semibold text-slate-600">
              <li className="flex items-center gap-2">
                <Check size={14} className="text-green-600" /> Live Tracking Real-time
              </li>
              <li className="flex items-center gap-2">
                <Check size={14} className="text-green-600" /> Lebih Akurat
              </li>
              <li className="flex items-center gap-2">
                <Check size={14} className="text-green-600" /> Hemat Baterai
              </li>
              <li className="flex items-center gap-2">
                <Check size={14} className="text-green-600" /> Fitur Lengkap
              </li>
            </ul>

            <Link
              href="/download"
              className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-xl bg-purple-700 text-sm font-black text-white hover:bg-purple-800"
            >
              Download App
            </Link>
          </div>

          <div className="mt-4 border-t border-slate-200 pt-4">
            <p className="mb-3 text-sm font-black text-slate-950">Need Help?</p>
            <Link
              href="/contact"
              className="flex items-center gap-3 text-sm font-semibold text-slate-600 hover:text-purple-700"
            >
              <CircleHelp size={18} />
              Pusat Bantuan
            </Link>
          </div>
        </div>
      </aside>

      <section className="min-h-screen lg:ml-[260px]">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/92 backdrop-blur-xl">
          <div className="flex min-h-[92px] min-w-0 items-center justify-between gap-4 px-5 lg:px-8">
            <div className="flex items-center gap-4">
              <Link
                href="/home"
                className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-slate-100"
                aria-label="Kembali"
              >
                <ChevronLeft size={24} />
              </Link>
              <div>
                <h1 className="text-2xl font-black tracking-tight text-slate-950">
                  Tracking Live
                </h1>
              </div>
            </div>

            <div className="hidden items-stretch divide-x divide-slate-200 rounded-none md:flex">
              <TopMetric icon={Wifi} title="GPS Signal" value="Akurat (± 3 m)" dot />
              <TopMetric icon={CloudIcon} title="26°C" value="Cerah" />
            </div>

            <div className="flex items-center gap-3">
              <button className="hidden h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 md:flex">
                <Search size={22} />
              </button>

              <button className="relative h-12 w-12 rounded-2xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50">
                <Bell className="mx-auto" size={21} />
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-purple-700 px-1 text-[11px] font-black text-white">
                  3
                </span>
              </button>

              <div className="hidden items-center gap-3 md:flex">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-200 text-sm font-black text-slate-500">
                  {initials}
                </div>
                <div className="min-w-[130px]">
                  <p className="text-sm font-black leading-tight text-slate-950">
                    Halo, {displayName}
                  </p>
                  <div className="mt-1 flex items-center gap-1 text-xs font-semibold text-slate-500">
                    Pengguna <ChevronDown size={14} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        <section className="relative h-[calc(100vh-92px)] min-h-[640px] overflow-hidden overscroll-contain">
          <div className="absolute inset-0 bg-[#eef2f0]">
            <div className="absolute inset-0 opacity-[0.72] [background-image:radial-gradient(circle_at_20%_20%,rgba(148,163,184,0.28)_0,transparent_30%),radial-gradient(circle_at_70%_10%,rgba(34,197,94,0.18)_0,transparent_28%),linear-gradient(to_right,rgba(15,23,42,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.05)_1px,transparent_1px)] [background-size:100%_100%,100%_100%,56px_56px,56px_56px]" />
            <div className="absolute inset-0 opacity-25 [background-image:repeating-radial-gradient(ellipse_at_center,rgba(15,23,42,0.18)_0_1px,transparent_1px_18px)]" />
          </div>

          <div className="absolute left-5 top-5 z-10 w-[300px] rounded-[1rem] border border-slate-200 bg-white/95 p-5 shadow-lg backdrop-blur">
            <p className="text-xs font-black uppercase tracking-wide text-slate-400">
              Event Aktif
            </p>
            <div className="mt-4 flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-50 text-purple-700">
                <Bike size={26} />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-950">
                  {eventTitle}
                </h2>
                <p className="mt-2 text-sm font-semibold text-slate-500">
                  {formatDate(activeEvent?.event_date)} • {activeEvent?.location || "Banyumas, Jateng"}
                </p>
              </div>
            </div>

            <Link
              href={`/events/${eventId}`}
              className="mt-4 inline-flex items-center gap-2 text-sm font-black text-purple-700 hover:text-purple-900"
            >
              Lihat Detail Event <ChevronRight size={17} />
            </Link>
          </div>

          <div className="absolute left-5 top-[210px] z-10 flex flex-col gap-3">
            <MapControl icon={Plus} />
            <MapControl icon={Minus} />
          </div>

          <div className="absolute left-5 top-[328px] z-10 flex flex-col gap-3">
            <MapControl icon={MapPin} />
            <MapControl icon={Layers} />
          </div>

          <div className="absolute right-[390px] top-5 z-10 hidden lg:block">
            <button className="inline-flex h-14 items-center gap-3 rounded-xl border border-slate-200 bg-white/95 px-5 text-sm font-black text-slate-950 shadow-sm backdrop-blur hover:bg-white">
              <Map size={22} />
              Satelit
            </button>
          </div>

          <svg
            className="absolute inset-0 h-full w-full"
            viewBox="0 0 1200 780"
            preserveAspectRatio="none"
          >
            <path
              d="M280 590 C350 560 420 590 470 515 C520 438 562 500 620 418 C670 345 710 390 755 300 C790 230 835 250 815 165 C800 112 845 104 872 60"
              fill="none"
              stroke="rgba(126,34,206,0.25)"
              strokeWidth="18"
              strokeLinecap="round"
            />
            <path
              d="M280 590 C350 560 420 590 470 515 C520 438 562 500 620 418 C670 345 710 390 755 300 C790 230 835 250 815 165 C800 112 845 104 872 60"
              fill="none"
              stroke="rgba(126,34,206,0.95)"
              strokeWidth="8"
              strokeLinecap="round"
            />
          </svg>

          <Checkpoint label="1" left="42%" top="51%" />
          <Checkpoint label="2" left="48%" top="46%" />
          <Checkpoint label="3" left="56%" top="34%" />
          <Checkpoint label="4" left="53%" top="18%" />

          <div className="absolute left-[55.8%] top-[3.5%] z-10">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border-4 border-purple-700 bg-white text-purple-700 shadow-lg">
              <Flag size={24} />
            </div>
            <span className="absolute left-1/2 top-full h-8 w-1 -translate-x-1/2 bg-purple-700" />
          </div>

          <div className="absolute left-[37.8%] top-[59%] z-10">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border-4 border-green-500 bg-white text-green-600 shadow-lg">
              <Navigation size={22} />
            </div>
          </div>

          <div className="absolute left-[54%] top-[34%] z-20">
            <div className="relative">
              <div className="absolute -inset-8 rounded-full bg-blue-500/20" />
              <div className="relative flex h-18 w-18 items-center justify-center rounded-full bg-blue-600 p-5 text-white shadow-xl">
                <Navigation size={34} />
              </div>
            </div>
          </div>

          <div className="absolute bottom-6 left-5 z-10 w-[270px] overflow-hidden rounded-[1rem] border border-slate-200 bg-white/95 shadow-lg backdrop-blur">
            <div className="border-b border-slate-100 px-5 py-4">
              <h3 className="text-sm font-black text-slate-950">
                Peserta di Sekitarmu (5)
              </h3>
            </div>
            <div className="divide-y divide-slate-100">
              {MOCK_PARTICIPANTS.map((participant) => (
                <div
                  key={participant.name}
                  className={`flex items-start gap-3 px-5 py-3 ${
                    participant.active ? "bg-purple-50" : "bg-white"
                  }`}
                >
                  <Bike
                    size={18}
                    className={participant.active ? "text-purple-700" : "text-slate-600"}
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-black text-slate-950">
                      {participant.name}{" "}
                      {participant.label ? (
                        <span className="text-purple-700">({participant.label})</span>
                      ) : null}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">
                      {participant.speed} • {participant.distance} {participant.extra}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <Link
              href={`/account/events/${eventId}/view`}
              className="flex items-center gap-2 px-5 py-4 text-sm font-black text-purple-700 hover:bg-purple-50"
            >
              Lihat Semua Peserta <ChevronRight size={17} />
            </Link>
          </div>

          <div className="absolute bottom-6 left-1/2 z-30 w-[490px] max-w-[calc(100vw-2rem)] -translate-x-1/2 rounded-[1rem] border border-slate-200 bg-white/95 p-4 shadow-xl backdrop-blur">
            <div className="grid grid-cols-[76px_1fr_76px] items-center gap-3">
              <TrackingButton icon={Pause} label="Pause" />
              <div className="text-center">
                <p className="text-xs font-black text-slate-600">
                  Tracking Berlangsung
                </p>
                <p className="mt-1 text-2xl font-black tabular-nums text-slate-950">
                  01:25:36
                </p>
                <button className="mt-2 inline-flex h-8 items-center justify-center gap-2 rounded-full bg-purple-50 px-5 text-[11px] font-semibold text-slate-600">
                  Geser ke kanan untuk selesai <ChevronRight size={15} className="text-purple-700" />
                </button>
              </div>
              <TrackingButton icon={Flag} label="Finish" />
            </div>
          </div>

          <section className="absolute bottom-0 right-0 top-0 z-10 hidden w-[360px] max-w-[360px] overflow-y-auto border-l border-slate-200 bg-white/80 p-5 backdrop-blur-xl xl:block">
            <StatsCard />
            <ProgressCard participantCount={participantCount} quota={quota} />
            <ElevationCard />
            <TrackActions />
          </section>
        </section>
      </section>
    </main>
  );
}

function SidebarLink({
  href,
  icon: Icon,
  label,
  active,
  badge,
}: {
  href: string;
  icon: any;
  label: string;
  active?: boolean;
  badge?: string;
}) {
  return (
    <Link
      href={href}
      className={`flex h-12 items-center justify-between rounded-2xl px-4 text-sm font-semibold transition ${
        active
          ? "bg-purple-50 text-purple-700"
          : "text-slate-700 hover:bg-slate-50 hover:text-slate-950"
      }`}
    >
      <span className="flex items-center gap-4">
        <Icon size={20} />
        {label}
      </span>
      {badge ? (
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-purple-700 px-1 text-[11px] font-black text-white">
          {badge}
        </span>
      ) : null}
    </Link>
  );
}

function TopMetric({
  icon: Icon,
  title,
  value,
  dot,
}: {
  icon: any;
  title: string;
  value: string;
  dot?: boolean;
}) {
  return (
    <div className="flex h-14 min-w-[170px] items-center gap-3 px-6">
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-xl ${
          dot ? "bg-green-50 text-green-600" : "bg-slate-50 text-slate-600"
        }`}
      >
        {dot ? <span className="h-3 w-3 rounded-full bg-green-500" /> : <Icon size={21} />}
      </div>
      <div>
        <p className="text-sm font-black leading-tight text-slate-950">{title}</p>
        <p className="mt-1 text-xs font-semibold text-slate-500">{value}</p>
      </div>
    </div>
  );
}

function CloudIcon({ size = 20 }: { size?: number }) {
  return <span style={{ fontSize: size }}>☼</span>;
}

function MapControl({ icon: Icon }: { icon: any }) {
  return (
    <button className="flex h-12 w-12 items-center justify-center rounded-lg border border-slate-200 bg-white/95 text-slate-950 shadow-sm backdrop-blur hover:bg-white">
      <Icon size={20} />
    </button>
  );
}

function Checkpoint({
  label,
  left,
  top,
}: {
  label: string;
  left: string;
  top: string;
}) {
  return (
    <div
      className="absolute z-10 flex h-11 w-11 items-center justify-center rounded-full border-2 border-purple-700 bg-white text-lg font-black text-purple-700 shadow"
      style={{ left, top }}
    >
      {label}
    </div>
  );
}

function TrackingButton({
  icon: Icon,
  label,
}: {
  icon: any;
  label: string;
}) {
  return (
    <button className="flex flex-col items-center justify-center gap-2">
      <span className="flex h-14 w-14 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-950 shadow-sm">
        <Icon size={24} />
      </span>
      <span className="text-xs font-semibold text-slate-600">{label}</span>
    </button>
  );
}

function StatsCard() {
  return (
    <div className="rounded-[1rem] border border-slate-200 bg-white/95 p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-black text-slate-950">Statistik Real-time</h3>
        <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-black text-green-700">
          ● Live
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 overflow-hidden rounded-xl border border-slate-200">
        <StatItem label="Jarak" value="12.45" unit="km" />
        <StatItem label="Durasi" value="01:25:36" unit="jam" />
        <StatItem label="Kecepatan" value="25.3" unit="km/h" />
        <StatItem label="Pace" value="02:22" unit="min/km" />
        <StatItem label="Elevasi" value="245" unit="m" />
        <StatItem label="Kalori" value="652" unit="kcal" />
      </div>
    </div>
  );
}

function StatItem({
  label,
  value,
  unit,
}: {
  label: string;
  value: string;
  unit: string;
}) {
  return (
    <div className="border-b border-r border-slate-100 p-5">
      <p className="text-xs font-semibold text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-black text-slate-950">{value}</p>
      <p className="mt-1 text-xs font-semibold text-slate-500">{unit}</p>
    </div>
  );
}

function ProgressCard({
  participantCount,
  quota,
}: {
  participantCount: number;
  quota: number;
}) {
  return (
    <div className="mt-4 rounded-[1rem] border border-slate-200 bg-white/95 p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-black text-slate-950">Progress Rute</h3>
        <p className="text-sm font-semibold text-slate-500">
          12.45 km / 42.00 km
        </p>
      </div>
      <div className="mt-4 flex items-center gap-4">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200">
          <div className="h-full w-[29%] rounded-full bg-purple-700" />
        </div>
        <span className="text-sm font-black text-slate-950">29%</span>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <h4 className="text-sm font-black text-slate-950">Check Point</h4>
        <p className="text-sm font-semibold text-slate-500">2 / 6</p>
      </div>

      <div className="mt-4 flex items-center justify-between">
        {[1, 2, 3, 4, 5, 6].map((point) => (
          <div key={point} className="flex items-center">
            <span
              className={`flex h-8 w-8 items-center justify-center rounded-full border text-xs font-black ${
                point <= 2
                  ? "border-purple-700 bg-purple-700 text-white"
                  : "border-slate-300 bg-white text-slate-500"
              }`}
            >
              {point}
            </span>
            {point < 6 ? <span className="h-px w-7 bg-slate-300" /> : null}
          </div>
        ))}
      </div>

      <div className="mt-5 rounded-xl bg-slate-50 p-3 text-xs font-semibold text-slate-500">
        Peserta: {participantCount}/{quota}
      </div>
    </div>
  );
}

function ElevationCard() {
  return (
    <div className="mt-4 rounded-[1rem] border border-slate-200 bg-white/95 p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-black text-slate-950">Grafik Elevasi</h3>
        <p className="text-sm font-black text-purple-700">245 m</p>
      </div>

      <div className="relative mt-4 h-150 rounded-xl bg-white">
        <svg viewBox="0 0 320 150" className="h-[150px] w-full">
          <defs>
            <linearGradient id="elevationFill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="rgba(126,34,206,0.28)" />
              <stop offset="100%" stopColor="rgba(126,34,206,0.04)" />
            </linearGradient>
          </defs>
          <path
            d="M0 115 L18 86 L32 58 L50 70 L68 105 L86 112 L104 110 L122 98 L140 104 L158 80 L176 84 L194 65 L212 72 L230 56 L248 52 L266 38 L284 66 L302 86 L320 118 L320 150 L0 150 Z"
            fill="url(#elevationFill)"
          />
          <path
            d="M0 115 L18 86 L32 58 L50 70 L68 105 L86 112 L104 110 L122 98 L140 104 L158 80 L176 84 L194 65 L212 72 L230 56 L248 52 L266 38 L284 66 L302 86 L320 118"
            fill="none"
            stroke="#7e22ce"
            strokeWidth="3"
          />
          <circle cx="104" cy="110" r="6" fill="white" stroke="#7e22ce" strokeWidth="3" />
          <text x="0" y="145" fontSize="11" fill="#475569">0 km</text>
          <text x="138" y="145" fontSize="11" fill="#475569">20 km</text>
          <text x="285" y="145" fontSize="11" fill="#475569">42 km</text>
        </svg>
      </div>
    </div>
  );
}

function TrackActions() {
  return (
    <div className="mt-4 rounded-[1rem] border border-slate-200 bg-white/95 p-4 shadow-sm">
      <h3 className="text-sm font-black text-slate-950">Pintasan</h3>
      <div className="mt-4 grid grid-cols-3 gap-3">
        <ActionButton icon={Camera} label="Foto" />
        <ActionButton icon={ClipboardList} label="Catatan" />
        <ActionButton icon={Share2} label="Bagikan Lokasi" />
      </div>
    </div>
  );
}

function ActionButton({
  icon: Icon,
  label,
}: {
  icon: any;
  label: string;
}) {
  return (
    <button className="flex h-14 flex-col items-center justify-center gap-1 rounded-xl border border-slate-200 bg-white text-xs font-black text-slate-700 hover:bg-purple-50 hover:text-purple-700">
      <Icon size={18} />
      {label}
    </button>
  );
}
