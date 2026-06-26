"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type ElementType, type ReactNode } from "react";
import {
  Activity,
  Bell,
  CalendarDays,
  CheckCircle2,
  Clock3,
  CloudSun,
  Database,
  Download,
  Eye,
  Gauge,
  HelpCircle,
  History,
  Home,
  Loader2,
  LogOut,
  Map,
  MapPin,
  Medal,
  Navigation,
  RefreshCw,
  Search,
  Settings,
  ShieldCheck,
  Ticket,
  Trophy,
  UserRound,
  Wifi,
  Zap,
} from "lucide-react";

type TrackingSummary = {
  joined_events: number;
  completed_events: number;
  personal_trainings: number;
  live_sessions: number;
  total_distance_km: number;
  total_moving_time_seconds: number;
  last_activity_at: string | null;
};

type EventTracking = {
  event_id: string;
  event_name: string;
  event_status: string;
  event_date: string | null;
  bib_number: string | null;
  join_status: string;
  joined_at: string | null;
  distance_km: number | null;
  moving_time_seconds: number | null;
  avg_speed_kmh: number | null;
  result_status: string | null;
  result_at: string | null;
  can_download_gpx?: boolean;
  detail_url?: string;
  live_url?: string;
  result_url?: string;
  gpx_url?: string;
  source?: string;
};

type PersonalTracking = {
  id: string;
  title: string;
  distance_km: number | null;
  moving_time_seconds: number | null;
  avg_speed_kmh: number | null;
  elevation_gain_m: number | null;
  started_at: string | null;
  finished_at: string | null;
  status: string;
};

type LiveTracking = {
  event_id: string | null;
  lat: number;
  lng: number;
  speed_kmh: number | null;
  distance_km: number | null;
  updated_at: string | null;
  status: string;
};

type TrackingResponse = {
  ok: boolean;
  message?: string;
  user?: {
    id: string;
    email: string;
    username?: string;
    name: string;
    role: string;
    athlete_type?: string | null;
    photo_url?: string | null;
  };
  summary?: TrackingSummary;
  live_tracking?: LiveTracking[];
  event_tracking?: EventTracking[];
  personal_tracking?: PersonalTracking[];
};

type CurrentUser = {
  id?: number | string;
  fullName?: string | null;
  name?: string | null;
  username?: string | null;
  email?: string | null;
  role?: string | null;
};

const REQUEST_TIMEOUT_MS = 8000;

async function fetchJsonWithTimeout(
  url: string,
  init: RequestInit = {},
  timeoutMs = REQUEST_TIMEOUT_MS,
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

function getDisplayName(user?: TrackingResponse["user"] | CurrentUser | null) {
  const clean = String(
    (user as CurrentUser | null)?.fullName ||
      (user as TrackingResponse["user"] | null)?.name ||
      (user as CurrentUser | null)?.username ||
      "",
  ).trim();

  if (clean) return clean;

  const emailName = user?.email?.split("@")[0]?.trim();

  if (emailName) return emailName;

  return "AMOST User";
}

function getInitials(name: string) {
  const words = name
    .split(" ")
    .map((item) => item.trim())
    .filter(Boolean);

  if (words.length === 0) return "A";

  return words
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("");
}

function formatRole(role: string | null | undefined) {
  const clean = String(role || "umum").toLowerCase().replace(/[\s-]+/g, "_");

  if (clean === "super_admin") return "Super Admin";
  if (clean === "staff_amost") return "Staff AMOST";
  if (clean === "umum") return "Umum";

  return clean
    .split("_")
    .filter(Boolean)
    .map((word) => word[0]?.toUpperCase() + word.slice(1))
    .join(" ");
}

function formatKm(value?: number | null) {
  const numberValue = Number(value || 0);

  if (!Number.isFinite(numberValue)) return "0.00 km";

  return `${numberValue.toFixed(2)} km`;
}

function formatSpeed(value?: number | null) {
  const numberValue = Number(value || 0);

  if (!Number.isFinite(numberValue) || numberValue <= 0) return "-";

  return `${numberValue.toFixed(1)} km/jam`;
}

function formatDuration(seconds?: number | null) {
  const value = Number(seconds || 0);

  if (!Number.isFinite(value) || value <= 0) return "00:00:00";

  const total = Math.floor(value);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;

  return [h, m, s]
    .map((item) => String(item).padStart(2, "0"))
    .join(":");
}

function formatShortDuration(seconds?: number | null) {
  const value = Number(seconds || 0);

  if (!Number.isFinite(value) || value <= 0) return "-";

  const total = Math.floor(value);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);

  if (h > 0) return `${h}j ${m}m`;
  if (m > 0) return `${m} menit`;

  return `${total} detik`;
}

function formatDate(value?: string | null) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatEventDate(value?: string | null) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return (
    <>
      <span>{new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric" }).format(date)}</span>
      <span className="block text-xs font-semibold text-slate-500">
        {new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit" }).format(date)} WIB
      </span>
    </>
  );
}

function cleanStatus(value?: string | null) {
  return String(value || "").trim().toLowerCase();
}

function joinStatusLabel(value?: string | null) {
  const status = cleanStatus(value);

  if (["registered", "join", "joined", "active", "approved"].includes(status)) return "Terdaftar";
  if (["pending", "menunggu"].includes(status)) return "Menunggu";
  if (["cancelled", "canceled", "batal"].includes(status)) return "Batal";

  return status ? status.replace(/_/g, " ").toUpperCase() : "Terdaftar";
}

function resultStatusLabel(value?: string | null) {
  const status = cleanStatus(value);

  if (!status) return "Belum Tersedia";
  if (["finish", "finished", "finisher", "selesai"].includes(status)) return "Finish";
  if (status === "dnf") return "DNF";
  if (status === "dns") return "DNS";
  if (status === "off_route") return "Off Route";
  if (status === "review") return "Review";

  return status.replace(/_/g, " ").toUpperCase();
}

function badgeClass(kind: "join" | "result" | "live", value?: string | null) {
  const status = cleanStatus(value);

  if (kind === "result" && !status) return "bg-blue-50 text-blue-700";
  if (["finish", "finished", "finisher", "selesai", "registered", "joined", "active", "approved", "live"].includes(status)) {
    return "bg-green-50 text-green-700";
  }
  if (["dnf", "dns", "off_route", "offline", "cancelled", "canceled", "batal"].includes(status)) {
    return "bg-red-50 text-red-700";
  }
  if (["pending", "review", "menunggu"].includes(status)) {
    return "bg-yellow-50 text-yellow-700";
  }

  return "bg-slate-100 text-slate-700";
}

function actionUrl(item: EventTracking, key: "detail" | "live" | "result" | "gpx") {
  if (key === "detail") return item.detail_url || `/events/${item.event_id}`;
  if (key === "live") return `/account/events/${item.event_id}/view`;
  if (key === "result") return `/account/events/${item.event_id}/results`;
  return item.gpx_url || `/api/gpx-download?id=${encodeURIComponent(item.event_id)}`;
}

function getEventInitials(name: string) {
  const words = name.split(/\s+/).filter(Boolean);

  if (words.length >= 2) return `${words[0][0]}${words[1][0]}`.toUpperCase();

  return name.slice(0, 2).toUpperCase();
}

export default function AccountTrackingPage() {
  const router = useRouter();

  const [data, setData] = useState<TrackingResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [error, setError] = useState("");

  async function loadData(silent = false) {
    if (silent) setRefreshing(true);
    else setLoading(true);

    setError("");

    try {
      const { response, data: json } = await fetchJsonWithTimeout(
        "/api/account/tracking",
        { method: "GET" },
        8000,
      );

      if (response.status === 401) {
        router.replace("/login?next=/account/tracking");
        return;
      }

      if (!response.ok || !json?.ok) {
        throw new Error(json?.message || "Gagal mengambil data tracking.");
      }

      setData(json as TrackingResponse);
    } catch (err: any) {
      setError(err?.message || "Gagal mengambil data tracking.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function handleLogout() {
    setLogoutLoading(true);

    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
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

  useEffect(() => {
    loadData();
  }, []);

  const user = data?.user || null;
  const displayName = getDisplayName(user);
  const initials = getInitials(displayName);
  const roleLabel = formatRole(user?.role);

  const summary = data?.summary;
  const eventTracking = useMemo(() => data?.event_tracking || [], [data]);
  const personalTracking = useMemo(() => data?.personal_tracking || [], [data]);
  const liveTracking = useMemo(() => data?.live_tracking || [], [data]);
  const latestLive = liveTracking[0] || null;

  const activeEvent = eventTracking[0] || null;

  return (
    <main className="min-h-screen bg-[#f7f8fb] text-slate-950">
      <TrackingSidebar />

      <section className="min-h-screen lg:pl-[260px]">
        <TrackingTopbar
          title="Tracking Saya"
          subtitle="Pantau ringkasan aktivitas, event yang diikuti, live tracking, dan latihan mandiri."
          initials={initials}
          displayName={displayName}
          roleLabel={roleLabel}
          refreshing={refreshing}
          logoutLoading={logoutLoading}
          onRefresh={() => loadData(true)}
          onLogout={handleLogout}
        />

        <section className="grid min-h-[calc(100vh-88px)] grid-cols-1 gap-5 p-4 xl:grid-cols-[minmax(0,1fr)_340px]">
          {loading ? (
            <section className="xl:col-span-2 flex min-h-[420px] flex-col items-center justify-center rounded-[2rem] border border-slate-200 bg-white text-center shadow-sm">
              <Loader2 className="h-12 w-12 animate-spin text-purple-700" />
              <p className="mt-4 text-xl font-black text-slate-950">Memuat tracking...</p>
              <p className="mt-2 text-sm text-slate-500">Mengambil data event, live tracking, result, dan latihan mandiri.</p>
            </section>
          ) : error ? (
            <section className="xl:col-span-2 rounded-[2rem] border border-red-200 bg-red-50 p-6 text-red-800 shadow-sm">
              <h2 className="text-lg font-black">Tracking belum bisa dimuat</h2>
              <p className="mt-2 text-sm font-semibold">{error}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  onClick={() => loadData()}
                  className="rounded-xl bg-red-700 px-4 py-2 text-sm font-black text-white hover:bg-red-800"
                >
                  Muat ulang
                </button>
                <Link
                  href="/login"
                  className="rounded-xl border border-red-300 px-4 py-2 text-sm font-black text-red-800 hover:bg-red-100"
                >
                  Login ulang
                </Link>
              </div>
            </section>
          ) : (
            <>
              <section className="space-y-5">
                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <SummaryCard
                    icon={MapPin}
                    title="Total Jarak"
                    value={formatKm(summary?.total_distance_km)}
                    note="Total akumulasi"
                  />
                  <SummaryCard
                    icon={Clock3}
                    title="Total Durasi"
                    value={formatDuration(summary?.total_moving_time_seconds)}
                    note="Total akumulasi"
                  />
                  <SummaryCard
                    icon={Navigation}
                    title="Event Diikuti"
                    value={String(summary?.joined_events || eventTracking.length || 0)}
                    note="Total event"
                  />
                  <SummaryCard
                    icon={Activity}
                    title="Latihan Mandiri"
                    value={String(summary?.personal_trainings || personalTracking.length || 0)}
                    note="Total aktivitas"
                  />
                </section>

                <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-50 text-purple-700">
                        <CalendarDays size={23} />
                      </div>
                      <div>
                        <h2 className="text-xl font-black text-slate-950">Tracking Event</h2>
                        <p className="text-sm font-semibold text-slate-500">Daftar event yang kamu ikuti.</p>
                      </div>
                    </div>

                    <Link
                      href="/account/events"
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 hover:bg-slate-50"
                    >
                      Lihat Semua Event
                      <Navigation size={17} />
                    </Link>
                  </div>

                  <div className="mt-5 overflow-x-auto rounded-2xl border border-slate-200">
                    <table className="w-full min-w-[920px] text-left text-sm">
                      <thead className="bg-white">
                        <tr className="border-b border-slate-200 text-xs font-black uppercase tracking-wide text-slate-500">
                          <th className="px-4 py-4">Nama Event</th>
                          <th className="px-4 py-4">Nomor Peserta</th>
                          <th className="px-4 py-4">Status Join</th>
                          <th className="px-4 py-4">Status Result</th>
                          <th className="px-4 py-4">Tanggal Event</th>
                          <th className="px-4 py-4 text-center">Aksi</th>
                        </tr>
                      </thead>

                      <tbody>
                        {eventTracking.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="px-4 py-12 text-center text-sm font-bold text-slate-500">
                              Belum ada event yang diikuti.
                            </td>
                          </tr>
                        ) : (
                          eventTracking.map((item) => (
                            <tr key={item.event_id} className="border-b border-slate-100 last:border-b-0">
                              <td className="px-4 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-purple-700 text-[10px] font-black leading-tight text-white">
                                    {getEventInitials(item.event_name)}
                                  </div>
                                  <div>
                                    <p className="font-black text-slate-950">{item.event_name}</p>
                                    <p className="text-xs font-semibold text-slate-500">
                                      Source: {String(item.source || "registration").toUpperCase()}
                                    </p>
                                  </div>
                                </div>
                              </td>

                              <td className="px-4 py-4 font-black text-slate-700">
                                {item.bib_number || "-"}
                              </td>

                              <td className="px-4 py-4">
                                <span className={`rounded-full px-3 py-1 text-xs font-black ${badgeClass("join", item.join_status)}`}>
                                  {joinStatusLabel(item.join_status)}
                                </span>
                              </td>

                              <td className="px-4 py-4">
                                <span className={`rounded-full px-3 py-1 text-xs font-black ${badgeClass("result", item.result_status)}`}>
                                  {resultStatusLabel(item.result_status)}
                                </span>
                              </td>

                              <td className="px-4 py-4 font-semibold text-slate-600">
                                {formatEventDate(item.event_date)}
                              </td>

                              <td className="px-4 py-4">
                                <div className="flex justify-center gap-2">
                                  <ActionButton href={actionUrl(item, "detail")} icon={Eye} label="Detail" />
                                  <ActionButton href={actionUrl(item, "live")} icon={Zap} label="Live" primary />
                                  <ActionButton href={actionUrl(item, "result")} icon={Gauge} label="Result" />
                                  <ActionButton
                                    href={actionUrl(item, "gpx")}
                                    icon={Download}
                                    label="GPX"
                                    disabled={!item.can_download_gpx}
                                  />
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  <p className="mt-4 text-sm font-semibold text-slate-500">
                    Menampilkan {eventTracking.length} dari {eventTracking.length} event
                  </p>
                </section>

                <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-50 text-purple-700">
                        <Activity size={23} />
                      </div>
                      <div>
                        <h2 className="text-xl font-black text-slate-950">Latihan Mandiri</h2>
                        <p className="text-sm font-semibold text-slate-500">Riwayat latihan mandiri yang kamu lakukan.</p>
                      </div>
                    </div>

                    <Link
                      href="/account/activities"
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 hover:bg-slate-50"
                    >
                      Lihat Semua Aktivitas
                      <Navigation size={17} />
                    </Link>
                  </div>

                  <div className="mt-5 overflow-x-auto rounded-2xl border border-slate-200">
                    <table className="w-full min-w-[760px] text-left text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 text-xs font-black uppercase tracking-wide text-slate-500">
                          <th className="px-4 py-4">Aktivitas</th>
                          <th className="px-4 py-4">Jarak</th>
                          <th className="px-4 py-4">Durasi</th>
                          <th className="px-4 py-4">Avg Speed</th>
                          <th className="px-4 py-4">Tanggal</th>
                        </tr>
                      </thead>

                      <tbody>
                        {personalTracking.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="px-4 py-14">
                              <div className="flex flex-col items-center justify-center text-center">
                                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-300">
                                  <CalendarDays size={28} />
                                </div>
                                <p className="mt-4 text-lg font-black text-slate-950">Belum ada data latihan mandiri.</p>
                                <p className="mt-2 text-sm font-semibold text-slate-500">
                                  Mulai latihan pertamamu dan riwayat akan muncul di sini.
                                </p>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          personalTracking.map((item) => (
                            <tr key={item.id} className="border-b border-slate-100 last:border-b-0">
                              <td className="px-4 py-4 font-black text-slate-950">{item.title || "Latihan Mandiri"}</td>
                              <td className="px-4 py-4 font-bold text-slate-700">{formatKm(item.distance_km)}</td>
                              <td className="px-4 py-4 font-bold text-slate-700">{formatShortDuration(item.moving_time_seconds)}</td>
                              <td className="px-4 py-4 font-bold text-slate-700">{formatSpeed(item.avg_speed_kmh)}</td>
                              <td className="px-4 py-4 font-semibold text-slate-600">{formatDate(item.started_at || item.finished_at)}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>
              </section>

              <aside className="space-y-5">
                <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-50 text-purple-700">
                      <Database size={23} />
                    </div>
                    <h3 className="text-lg font-black text-slate-950">Ringkasan Tracking</h3>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <RightMetric icon={Database} label="Database" value="Real" />
                    <RightMetric icon={Navigation} label="Event" value={eventTracking.length > 0 ? "Aktif" : "Standby"} />
                    <RightMetric icon={Wifi} label="Live" value="Ready" />
                    <RightMetric icon={Gauge} label="Result" value="Ready" />
                  </div>
                </section>

                <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-50 text-purple-700">
                      <Wifi size={23} />
                    </div>
                    <h3 className="text-lg font-black text-slate-950">Status Live Terakhir</h3>
                  </div>

                  <div className="mt-5 overflow-hidden rounded-2xl bg-slate-50">
                    <div className="relative flex h-[210px] flex-col items-center justify-center text-center">
                      <div className="absolute inset-0 opacity-80">
                        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.05)_1px,transparent_1px)] bg-[size:36px_36px]" />
                        <div className="absolute inset-x-0 top-20 h-10 rotate-[-8deg] bg-white/55" />
                        <div className="absolute inset-x-[-20%] bottom-12 h-8 rotate-[10deg] bg-white/60" />
                      </div>

                      <div className="relative z-10 flex h-14 w-14 items-center justify-center rounded-full bg-white text-purple-700 shadow-sm">
                        <MapPin size={30} />
                      </div>

                      {latestLive ? (
                        <div className="relative z-10 mt-4">
                          <p className="font-black text-slate-950">{latestLive.status || "Live"}</p>
                          <p className="mt-2 text-xs font-semibold text-slate-500">
                            {Number(latestLive.lat).toFixed(5)}, {Number(latestLive.lng).toFixed(5)}
                          </p>
                          <p className="mt-1 text-xs font-semibold text-slate-500">{formatDate(latestLive.updated_at)}</p>
                        </div>
                      ) : (
                        <div className="relative z-10 mt-4">
                          <p className="font-black text-slate-950">Belum ada data live tracking.</p>
                          <p className="mx-auto mt-2 max-w-[230px] text-sm font-semibold leading-6 text-slate-500">
                            Data posisi live terakhir akan muncul di sini saat kamu atau peserta lain aktif.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </section>

                <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-50 text-purple-700">
                      <CheckCircle2 size={23} />
                    </div>
                    <h3 className="text-lg font-black text-slate-950">Quick Access</h3>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <QuickAccess href="/account/events" icon={CalendarDays} label="My Events" />
                    <QuickAccess
                      href={activeEvent ? `/account/events/${activeEvent.event_id}/view` : "/account/live-view"}
                      icon={Wifi}
                      label="Live Tracking"
                    />
                    <QuickAccess
                      href={activeEvent ? `/account/events/${activeEvent.event_id}/results` : "/account/events"}
                      icon={Gauge}
                      label="Results"
                    />
                    <QuickAccess href="/account" icon={UserRound} label="Profile" />
                  </div>
                </section>
              </aside>
            </>
          )}
        </section>
      </section>
    </main>
  );
}

function TrackingSidebar() {
  return (
    <aside className="hidden fixed inset-y-0 left-0 z-[60] w-[260px] border-r border-slate-200 bg-white lg:flex lg:flex-col">
      <div className="flex h-[88px] items-center px-8">
        <Link href="/">
          <img
            src="/amost_logo_wide_.png"
            alt="AMOST"
            className="h-[62px] w-auto object-contain"
          />
        </Link>
      </div>

      <nav className="flex-1 space-y-2 px-5 py-5">
        <SidebarLink href="/home" icon={Home} label="Dashboard" />
        <SidebarLink href="/account/live-view" icon={Map} label="Live View" />
        <SidebarLink href="/account/tracking" icon={Navigation} label="Tracking" active />
        <SidebarLink href="/account/activities" icon={History} label="My Activities" />
        <SidebarLink href="/account/events" icon={CalendarDays} label="My Events" />
        <SidebarLink href="/account/tickets" icon={Ticket} label="My Tickets" />
        <SidebarLink href="/account/achievement" icon={Medal} label="Achievement" />
        <SidebarLink href="/account/statistics" icon={Activity} label="Statistics" />
        <SidebarLink href="/account/notification" icon={Bell} label="Notification" />
        <SidebarLink href="/account" icon={UserRound} label="Profile" />
        <SidebarLink href="/account/settings" icon={Settings} label="Settings" />
      </nav>

      <div className="m-5 rounded-3xl border border-purple-100 bg-purple-50 p-5">
        <p className="text-sm font-black text-purple-700">Tracking lebih seru</p>

        <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
          Ikuti event, pantau performamu, dan capai target lebih jauh!
        </p>

        <Link
          href="/events"
          className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-purple-700 text-sm font-black text-white"
        >
          Telusuri Event
        </Link>
      </div>

      <div className="border-t border-slate-200 p-5">
        <Link
          href="/events"
          prefetch={false}
          className="flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50"
        >
          <HelpCircle size={19} />
          Event Publik
        </Link>
      </div>
    </aside>
  );
}

function SidebarLink({
  href,
  icon: Icon,
  label,
  active = false,
}: {
  href: string;
  icon: ElementType;
  label: string;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      prefetch={false}
      className={`flex h-12 items-center gap-3 rounded-2xl px-4 text-sm font-black transition ${
        active
          ? "bg-purple-50 text-purple-700"
          : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
      }`}
    >
      <Icon size={20} />
      {label}
    </Link>
  );
}

function TrackingTopbar({
  title,
  subtitle,
  initials,
  displayName,
  roleLabel,
  refreshing,
  logoutLoading,
  onRefresh,
  onLogout,
}: {
  title: string;
  subtitle: string;
  initials: string;
  displayName: string;
  roleLabel: string;
  refreshing: boolean;
  logoutLoading: boolean;
  onRefresh: () => void;
  onLogout: () => void;
}) {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-xl">
      <div className="flex min-h-[88px] flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:justify-between md:px-6">
        <div>
          <h1 className="text-2xl font-black text-slate-950">{title}</h1>
          <p className="mt-1 text-sm font-semibold text-slate-500">{subtitle}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <TopStatusCard icon={Wifi} title="GPS Signal" value="Standby" accent="green" />
          <TopStatusCard icon={CloudSun} title="26°C" value="Cerah" accent="slate" />

          <button
            type="button"
            className="hidden h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 md:flex"
            title="Cari"
          >
            <Search size={20} />
          </button>

          <button
            type="button"
            className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700"
            title="Notifikasi"
          >
            <Bell size={20} />
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-purple-700 text-[10px] font-black text-white">
              3
            </span>
          </button>

          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshing}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 hover:bg-slate-50 disabled:opacity-70"
          >
            <RefreshCw size={17} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>

          <div className="hidden items-center gap-3 rounded-2xl border border-purple-100 bg-purple-50 px-4 py-2 md:flex">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-700 text-xs font-black text-white">
              {initials}
            </div>
            <div>
              <p className="text-sm font-black leading-none text-slate-950">{displayName}</p>
              <p className="mt-1 text-xs font-bold leading-none text-purple-700">{roleLabel}</p>
            </div>
          </div>

          <button
            type="button"
            disabled={logoutLoading}
            onClick={onLogout}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 text-sm font-black text-white hover:bg-slate-800 disabled:opacity-70"
          >
            <LogOut size={17} />
            {logoutLoading ? "Keluar..." : "Keluar"}
          </button>
        </div>
      </div>
    </header>
  );
}

function TopStatusCard({
  icon: Icon,
  title,
  value,
  accent,
}: {
  icon: ElementType;
  title: string;
  value: string;
  accent: "green" | "slate";
}) {
  const color =
    accent === "green"
      ? "bg-green-50 text-green-700"
      : "bg-slate-50 text-slate-700";

  return (
    <div className="hidden h-11 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 md:flex">
      <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${color}`}>
        <Icon size={17} />
      </div>

      <div>
        <p className="text-xs font-black leading-none text-slate-950">{title}</p>
        <p className="mt-1 text-xs font-bold leading-none text-slate-500">{value}</p>
      </div>
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  title,
  value,
  note,
}: {
  icon: ElementType;
  title: string;
  value: string;
  note: string;
}) {
  return (
    <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-50 text-purple-700">
          <Icon size={23} />
        </div>

        <div>
          <p className="text-sm font-semibold text-slate-500">{title}</p>
          <p className="mt-2 text-2xl font-black text-slate-950">{value}</p>
        </div>
      </div>

      <div className="mt-5 flex items-end justify-between">
        <p className="text-sm font-semibold text-slate-500">{note}</p>
        <SparkLine />
      </div>
    </section>
  );
}

function SparkLine() {
  return (
    <svg width="66" height="24" viewBox="0 0 66 24" fill="none" className="text-purple-700">
      <path
        d="M2 18 L8 18 L13 12 L18 16 L23 9 L28 17 L34 11 L39 15 L45 7 L51 13 L57 4 L64 19"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ActionButton({
  href,
  icon: Icon,
  label,
  primary = false,
  disabled = false,
}: {
  href: string;
  icon: ElementType;
  label: string;
  primary?: boolean;
  disabled?: boolean;
}) {
  if (disabled) {
    return (
      <span className="inline-flex h-10 min-w-[58px] items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-black text-slate-400">
        <Icon size={15} />
        {label}
      </span>
    );
  }

  return (
    <Link
      href={href}
      className={`inline-flex h-10 min-w-[58px] items-center justify-center gap-1.5 rounded-xl px-3 text-xs font-black ${
        primary
          ? "bg-purple-50 text-purple-700 hover:bg-purple-700 hover:text-white"
          : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
      }`}
    >
      <Icon size={15} />
      {label}
    </Link>
  );
}

function RightMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-700">
          <Icon size={19} />
        </div>
        <div>
          <p className="text-xs font-black uppercase text-slate-400">{label}</p>
          <p className="mt-1 text-xl font-black text-slate-950">{value}</p>
        </div>
      </div>
    </div>
  );
}

function QuickAccess({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: ElementType;
  label: string;
}) {
  return (
    <Link
      href={href}
      prefetch={false}
      className="flex min-h-[82px] flex-col items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 px-3 py-4 text-center text-xs font-black text-slate-950 hover:bg-purple-700 hover:text-white"
    >
      <Icon size={23} />
      <span className="mt-2">{label}</span>
    </Link>
  );
}
