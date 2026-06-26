"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type ElementType } from "react";
import {
  Activity,
  ArrowLeft,
  Bell,
  CalendarDays,
  CheckCircle2,
  Clock3,
  CloudSun,
  Download,
  Eye,
  Gauge,
  HelpCircle,
  History,
  Home,
  Loader2,
  LogOut,
  Map,
  Medal,
  Navigation,
  RefreshCw,
  Search,
  Settings,
  ShieldCheck,
  Signal,
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
  role_id?: number | string | null;
  roleId?: number | string | null;
};

type PublicEvent = {
  id: number | string;
  title?: string | null;
  event_title?: string | null;
  name?: string | null;
  event_date?: string | null;
  location?: string | null;
  status?: string | null;
  participant_count?: number | string | null;
  quota?: number | string | null;
  distance_km?: number | string | null;
  gpx_filename?: string | null;
  gpx_content?: string | null;
};

type EventResult = {
  result_id?: number | string;
  id?: number | string;
  event_id?: number | string;
  user_id?: number | string;
  rank?: number | string | null;
  ranking?: number | string | null;
  full_name?: string | null;
  name?: string | null;
  username?: string | null;
  email?: string | null;
  participant_number?: string | null;
  bib_number?: string | null;
  distance?: number | string | null;
  distance_km?: number | string | null;
  duration?: number | string | null;
  duration_seconds?: number | string | null;
  moving_time_seconds?: number | string | null;
  avg_speed?: number | string | null;
  avg_speed_kmh?: number | string | null;
  result_status?: string | null;
  status?: string | null;
  submitted_at?: string | null;
  finished_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
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

function normalizeRole(value: unknown) {
  return String(value || "umum").trim().toLowerCase().replace(/[\s-]+/g, "_");
}

function formatRole(role: string | null | undefined) {
  const clean = normalizeRole(role);

  if (clean === "super_admin") return "Super Admin";
  if (clean === "staff_amost") return "Staff AMOST";
  if (clean === "umum") return "Umum";

  return clean
    .split("_")
    .filter(Boolean)
    .map((word) => word[0]?.toUpperCase() + word.slice(1))
    .join(" ");
}

function getDisplayName(user: CurrentUser | null) {
  const clean = String(user?.fullName || user?.name || user?.username || "").trim();

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

function getEventTitle(event: PublicEvent | null, eventId: string) {
  return String(event?.title || event?.event_title || event?.name || "").trim() || `Event #${eventId}`;
}

function normalizeStatus(value?: string | null) {
  return String(value || "").trim().toUpperCase();
}

function getResultStatus(item: EventResult) {
  return normalizeStatus(item.result_status || item.status || "REVIEW") || "REVIEW";
}

function statusLabel(value?: string | null) {
  const clean = normalizeStatus(value);

  if (clean === "FINISH" || clean === "FINISHED" || clean === "SELESAI") return "Finish";
  if (clean === "DNF") return "DNF";
  if (clean === "DNS") return "DNS";
  if (clean === "OFF_ROUTE") return "Off Route";
  if (clean === "REVIEW") return "Review";

  return clean || "Review";
}

function statusBadgeClass(value?: string | null) {
  const clean = normalizeStatus(value);

  if (clean === "FINISH" || clean === "FINISHED" || clean === "SELESAI") return "bg-green-50 text-green-700";
  if (clean === "DNF") return "bg-orange-50 text-orange-700";
  if (clean === "DNS") return "bg-slate-100 text-slate-700";
  if (clean === "OFF_ROUTE") return "bg-red-50 text-red-700";
  if (clean === "REVIEW") return "bg-yellow-50 text-yellow-700";

  return "bg-purple-50 text-purple-700";
}

function getResultDistance(item: EventResult) {
  const value = Number(item.distance_km ?? item.distance ?? 0);
  return Number.isFinite(value) ? value : 0;
}

function getResultDuration(item: EventResult) {
  const value = Number(item.moving_time_seconds ?? item.duration_seconds ?? item.duration ?? 0);
  return Number.isFinite(value) ? value : 0;
}

function getResultSpeed(item: EventResult) {
  const value = Number(item.avg_speed_kmh ?? item.avg_speed ?? 0);
  return Number.isFinite(value) ? value : 0;
}

function getResultDate(item: EventResult) {
  return item.finished_at || item.submitted_at || item.updated_at || item.created_at || null;
}

function formatKm(value?: number | string | null) {
  const numberValue = Number(value || 0);

  if (!Number.isFinite(numberValue) || numberValue <= 0) return "-";

  return `${numberValue.toFixed(2)} KM`;
}

function formatSpeed(value?: number | string | null) {
  const numberValue = Number(value || 0);

  if (!Number.isFinite(numberValue) || numberValue <= 0) return "-";

  return `${numberValue.toFixed(1)} km/jam`;
}

function formatDuration(seconds?: number | string | null) {
  const value = Number(seconds || 0);

  if (!Number.isFinite(value) || value <= 0) return "-";

  const total = Math.floor(value);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;

  if (h > 0) return `${h}j ${m}m ${s}d`;
  if (m > 0) return `${m}m ${s}d`;

  return `${s}d`;
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

function getParticipantNumber(item: EventResult) {
  return String(item.participant_number || item.bib_number || "-").trim() || "-";
}

function getParticipantName(item: EventResult) {
  return String(item.full_name || item.name || item.username || "Tanpa Nama").trim();
}

function rankValue(item: EventResult, fallbackIndex: number) {
  const value = Number(item.rank || item.ranking || 0);

  if (Number.isFinite(value) && value > 0) return value;

  return fallbackIndex + 1;
}

function finishComparable(item: EventResult) {
  const status = getResultStatus(item);
  return status === "FINISH" || status === "FINISHED" || status === "SELESAI";
}

function sortResults(rows: EventResult[]) {
  return [...rows].sort((a, b) => {
    const aFinish = finishComparable(a);
    const bFinish = finishComparable(b);

    if (aFinish !== bFinish) return aFinish ? -1 : 1;

    const aDuration = getResultDuration(a);
    const bDuration = getResultDuration(b);

    if (aFinish && bFinish && aDuration > 0 && bDuration > 0 && aDuration !== bDuration) {
      return aDuration - bDuration;
    }

    const aDistance = getResultDistance(a);
    const bDistance = getResultDistance(b);

    if (aDistance !== bDistance) return bDistance - aDistance;

    const aTime = new Date(getResultDate(a) || "").getTime() || 0;
    const bTime = new Date(getResultDate(b) || "").getTime() || 0;

    return bTime - aTime;
  });
}

export default function AccountEventResultsPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = String(params?.id || "");

  const [user, setUser] = useState<CurrentUser | null>(null);
  const [event, setEvent] = useState<PublicEvent | null>(null);
  const [results, setResults] = useState<EventResult[]>([]);
  const [participantTotal, setParticipantTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function loadData(silent = false) {
    if (silent) setRefreshing(true);
    else setLoading(true);

    setErrorMessage("");

    try {
      const [meResponse, eventResponse, resultsResponse] = await Promise.all([
        fetchJsonWithTimeout("/api/auth/me", { method: "GET" }, 6000).catch(() => null),
        fetchJsonWithTimeout(`/api/events/${eventId}`, { method: "GET" }, 7000),
        fetchJsonWithTimeout(`/api/events/${eventId}/results`, { method: "GET" }, 8000),
      ]);

      if (meResponse?.response.status === 401 || resultsResponse.response.status === 401) {
        router.replace(`/login?next=/account/events/${eventId}/results`);
        return;
      }

      if (meResponse?.response.ok && meResponse.data?.user) {
        setUser(meResponse.data.user);
      }

      if (eventResponse.response.ok && eventResponse.data?.ok !== false) {
        const nextEvent = eventResponse.data?.event || eventResponse.data?.data || null;
        setEvent(nextEvent);
        setParticipantTotal(Number(nextEvent?.participant_count || eventResponse.data?.participant_total || 0));
      }

      if (!resultsResponse.response.ok || resultsResponse.data?.ok === false) {
        setResults([]);
        setErrorMessage(resultsResponse.data?.message || resultsResponse.data?.error || "Results belum bisa dimuat.");
        return;
      }

      const rows = Array.isArray(resultsResponse.data?.data)
        ? resultsResponse.data.data
        : Array.isArray(resultsResponse.data?.results)
          ? resultsResponse.data.results
          : Array.isArray(resultsResponse.data?.items)
            ? resultsResponse.data.items
            : [];

      setResults(rows);
      setParticipantTotal((prev) => Number(resultsResponse.data?.participant_total || prev || rows.length || 0));
    } catch (error) {
      console.error(error);
      setResults([]);
      setErrorMessage("Koneksi ke server bermasalah.");
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
    if (eventId) {
      loadData();
    }
  }, [eventId]);

  const title = getEventTitle(event, eventId);
  const displayName = getDisplayName(user);
  const initials = getInitials(displayName);
  const roleLabel = formatRole(user?.role);
  const rankedResults = useMemo(() => sortResults(results), [results]);

  const stats = useMemo(() => {
    const finishCount = results.filter((item) => finishComparable(item)).length;
    const dnfCount = results.filter((item) => getResultStatus(item) === "DNF").length;
    const dnsCount = results.filter((item) => getResultStatus(item) === "DNS").length;
    const reviewCount = results.filter((item) => ["REVIEW", ""].includes(getResultStatus(item))).length;

    const totalDistance = results.reduce((sum, item) => sum + getResultDistance(item), 0);

    const speedRows = results
      .map((item) => getResultSpeed(item))
      .filter((value) => Number.isFinite(value) && value > 0);

    const avgSpeed = speedRows.length > 0
      ? speedRows.reduce((sum, value) => sum + value, 0) / speedRows.length
      : 0;

    const totalParticipants = Number(participantTotal || event?.participant_count || results.length || 0);
    const progress = totalParticipants > 0
      ? Math.min(100, Math.round((finishCount / totalParticipants) * 100))
      : 0;

    return {
      total: results.length,
      participantTotal: totalParticipants,
      finishCount,
      dnfCount,
      dnsCount,
      reviewCount,
      totalDistance,
      avgSpeed,
      progress,
    };
  }, [event, participantTotal, results]);

  return (
    <main className="min-h-screen bg-[#f7f8fb] text-slate-950">
      <ResultsSidebar />

      <section className="min-h-screen lg:pl-[260px]">
        <ResultsTopbar
          title="Results Event"
          subtitle={`Hasil peserta event ${title}.`}
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
              <p className="mt-4 text-xl font-black text-slate-950">Memuat results...</p>
              <p className="mt-2 text-sm text-slate-500">Mengambil data peserta, result, ranking, dan statistik event.</p>
            </section>
          ) : errorMessage ? (
            <section className="xl:col-span-2 rounded-[2rem] border border-red-200 bg-red-50 p-6 text-red-800 shadow-sm">
              <h2 className="text-lg font-black">Results belum bisa dimuat</h2>
              <p className="mt-2 text-sm font-semibold">{errorMessage}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  onClick={() => loadData()}
                  className="rounded-xl bg-red-700 px-4 py-2 text-sm font-black text-white hover:bg-red-800"
                >
                  Muat ulang
                </button>
                <Link
                  href={`/account/events/${eventId}/view`}
                  className="rounded-xl border border-red-300 px-4 py-2 text-sm font-black text-red-800 hover:bg-red-100"
                >
                  Kembali ke Live View
                </Link>
              </div>
            </section>
          ) : (
            <>
              <section className="space-y-5">
                <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.22em] text-purple-700">AMOST Results</p>
                      <h1 className="mt-2 text-3xl font-black text-slate-950">{title}</h1>
                      <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
                        Ranking dan hasil peserta yang sudah dikirim dari tracking event.
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/account/events/${eventId}/view`}
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-purple-700 px-4 text-sm font-black text-white hover:bg-purple-800"
                      >
                        <Map size={17} />
                        Live View
                      </Link>
                      <Link
                        href={`/events/${eventId}`}
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 hover:bg-slate-50"
                      >
                        <Eye size={17} />
                        Detail Event
                      </Link>
                      <Link
                        href={`/api/gpx-download?id=${encodeURIComponent(eventId)}`}
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 hover:bg-slate-50"
                      >
                        <Download size={17} />
                        GPX
                      </Link>
                    </div>
                  </div>
                </section>

                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <SummaryCard icon={UsersRound} title="Total Peserta" value={String(stats.participantTotal)} note="Peserta event" />
                  <SummaryCard icon={Trophy} title="Total Finish" value={String(stats.finishCount)} note={`${stats.progress}% progress`} />
                  <SummaryCard icon={Activity} title="Total Jarak" value={formatKm(stats.totalDistance)} note="Akumulasi result" />
                  <SummaryCard icon={Gauge} title="Avg Speed" value={formatSpeed(stats.avgSpeed)} note="Rata-rata peserta" />
                </section>

                <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-50 text-purple-700">
                        <Trophy size={23} />
                      </div>
                      <div>
                        <h2 className="text-xl font-black text-slate-950">Ranking Results</h2>
                        <p className="text-sm font-semibold text-slate-500">Data berasal dari hasil tracking peserta.</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => loadData(true)}
                      disabled={refreshing}
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 hover:bg-slate-50 disabled:opacity-70"
                    >
                      <RefreshCw size={17} className={refreshing ? "animate-spin" : ""} />
                      Refresh
                    </button>
                  </div>

                  <div className="mt-5 overflow-x-auto rounded-2xl border border-slate-200">
                    <table className="w-full min-w-[980px] text-left text-sm">
                      <thead className="bg-white">
                        <tr className="border-b border-slate-200 text-xs font-black uppercase tracking-wide text-slate-500">
                          <th className="px-4 py-4">Rank</th>
                          <th className="px-4 py-4">Nomor</th>
                          <th className="px-4 py-4">Peserta</th>
                          <th className="px-4 py-4">Status</th>
                          <th className="px-4 py-4">Jarak</th>
                          <th className="px-4 py-4">Durasi</th>
                          <th className="px-4 py-4">Avg Speed</th>
                          <th className="px-4 py-4">Tanggal Finish</th>
                        </tr>
                      </thead>

                      <tbody>
                        {rankedResults.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="px-4 py-16">
                              <div className="flex flex-col items-center justify-center text-center">
                                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-300">
                                  <Trophy size={30} />
                                </div>
                                <h2 className="mt-4 text-2xl font-black text-slate-950">Belum ada results.</h2>
                                <p className="mt-2 max-w-[420px] text-sm font-semibold leading-6 text-slate-500">
                                  Results akan muncul setelah peserta menyelesaikan tracking dan data berhasil dikirim ke server.
                                </p>
                                <Link
                                  href={`/account/events/${eventId}/view`}
                                  className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-purple-700 px-5 text-sm font-black text-white hover:bg-purple-800"
                                >
                                  <Map size={17} />
                                  Buka Live View
                                </Link>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          rankedResults.map((item, index) => (
                            <tr key={String(item.result_id || item.id || `${item.user_id}-${index}`)} className="border-b border-slate-100 last:border-b-0">
                              <td className="px-4 py-4">
                                <div className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-black ${
                                  index === 0 ? "bg-purple-700 text-white" : "bg-slate-100 text-slate-700"
                                }`}>
                                  {rankValue(item, index)}
                                </div>
                              </td>

                              <td className="px-4 py-4 font-black text-purple-700">
                                {getParticipantNumber(item)}
                              </td>

                              <td className="px-4 py-4">
                                <p className="font-black text-slate-950">{getParticipantName(item)}</p>
                                <p className="mt-1 text-xs font-semibold text-slate-500">{item.email || "-"}</p>
                              </td>

                              <td className="px-4 py-4">
                                <span className={`rounded-full px-3 py-1 text-xs font-black uppercase ${statusBadgeClass(getResultStatus(item))}`}>
                                  {statusLabel(getResultStatus(item))}
                                </span>
                              </td>

                              <td className="px-4 py-4 font-black text-slate-950">
                                {formatKm(getResultDistance(item))}
                              </td>

                              <td className="px-4 py-4 font-semibold text-slate-600">
                                <span className="inline-flex items-center gap-2">
                                  <Clock3 size={16} />
                                  {formatDuration(getResultDuration(item))}
                                </span>
                              </td>

                              <td className="px-4 py-4 font-semibold text-slate-600">
                                {formatSpeed(getResultSpeed(item))}
                              </td>

                              <td className="px-4 py-4 font-semibold text-slate-600">
                                {formatDate(getResultDate(item))}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  <p className="mt-4 text-sm font-semibold text-slate-500">
                    Menampilkan {rankedResults.length} result dari {stats.participantTotal || rankedResults.length} peserta.
                  </p>
                </section>
              </section>

              <aside className="space-y-5">
                <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-50 text-purple-700">
                      <Signal size={23} />
                    </div>
                    <h3 className="text-lg font-black text-slate-950">Ringkasan Results</h3>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <RightMetric label="Peserta" value={String(stats.participantTotal)} />
                    <RightMetric label="Finish" value={String(stats.finishCount)} />
                    <RightMetric label="DNF" value={String(stats.dnfCount)} />
                    <RightMetric label="DNS" value={String(stats.dnsCount)} />
                  </div>

                  <div className="mt-5">
                    <div className="flex items-center justify-between text-sm font-black">
                      <span>Progress Finish</span>
                      <span className="text-purple-700">{stats.progress}%</span>
                    </div>
                    <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-purple-700" style={{ width: `${stats.progress}%` }} />
                    </div>
                  </div>
                </section>

                <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
                  <h3 className="text-lg font-black text-slate-950">Event</h3>
                  <h4 className="mt-4 text-xl font-black text-slate-950">{title}</h4>
                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
                    {event?.event_date ? formatDate(event.event_date) : "Tanggal event belum tersedia"}
                    {event?.location ? ` · ${event.location}` : ""}
                  </p>

                  <div className="mt-5 grid grid-cols-1 gap-3">
                    <Link
                      href={`/account/events/${eventId}/view`}
                      className="flex h-11 items-center justify-center gap-2 rounded-xl bg-purple-700 text-sm font-black text-white hover:bg-purple-800"
                    >
                      <Map size={17} />
                      Kembali ke Live View
                    </Link>
                    <Link
                      href={`/events/${eventId}`}
                      className="flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-sm font-black text-slate-700 hover:bg-slate-50"
                    >
                      <Eye size={17} />
                      Detail Event
                    </Link>
                  </div>
                </section>

                <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
                  <h3 className="text-lg font-black text-slate-950">Quick Access</h3>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <QuickAccess href={`/account/events/${eventId}/view`} icon={Map} label="Live View" />
                    <QuickAccess href="/account/events" icon={CalendarDays} label="My Events" />
                    <QuickAccess href="/account/tracking" icon={Navigation} label="Tracking" />
                    <QuickAccess href={`/api/gpx-download?id=${encodeURIComponent(eventId)}`} icon={Download} label="GPX" />
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

function ResultsSidebar() {
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
        <SidebarLink href="/account/tracking" icon={Navigation} label="Tracking" />
        <SidebarLink href="/account/activities" icon={History} label="My Activities" />
        <SidebarLink href="/account/events" icon={CalendarDays} label="My Events" active />
        <SidebarLink href="/account/tickets" icon={Ticket} label="My Tickets" />
        <SidebarLink href="/account/achievement" icon={Medal} label="Achievement" />
        <SidebarLink href="/account/statistics" icon={Activity} label="Statistics" />
        <SidebarLink href="/account/notification" icon={Bell} label="Notification" />
        <SidebarLink href="/account" icon={UserRound} label="Profile" />
        <SidebarLink href="/account/settings" icon={Settings} label="Settings" />
      </nav>

      <div className="m-5 rounded-3xl border border-purple-100 bg-purple-50 p-5">
        <p className="text-sm font-black text-purple-700">Results lebih jelas</p>
        <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
          Pantau ranking, finish, DNF, DNS, dan hasil peserta dari event.
        </p>

        <Link
          href="/account/events"
          className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-purple-700 text-sm font-black text-white"
        >
          My Events
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

function ResultsTopbar({
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

function RightMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="text-xs font-black uppercase text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-black text-slate-950">{value}</p>
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
