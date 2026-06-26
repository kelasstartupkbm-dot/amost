"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type ElementType } from "react";
import {
  Activity,
  Bell,
  CalendarDays,
  CheckCircle2,
  Clock3,
  CloudSun,
  Download,
  Eye,
  FileText,
  Gauge,
  Gift,
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
  Route,
  Search,
  Settings,
  ShieldCheck,
  Signal,
  Ticket,
  Trophy,
  UserRound,
  UsersRound,
  Wifi,
  XCircle,
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
  id?: number | string;
  title?: string | null;
  event_title?: string | null;
  name?: string | null;
  slug?: string | null;
  category?: string | null;
  event_date?: string | null;
  location?: string | null;
  status?: string | null;
  participant_count?: number | string | null;
  quota?: number | string | null;
  doorprize_count?: number | string | null;
  description?: string | null;
  distance_km?: number | string | null;
  registration_fee?: number | string | null;
  image_url?: string | null;
  route_file?: string | null;
  gpx_filename?: string | null;
};

type Registration = {
  id?: number | string;
  participant_number?: string | null;
  bib_number?: string | null;
  status?: string | null;
  registration_status?: string | null;
  joined_at?: string | null;
  created_at?: string | null;
};

type ResultSummary = {
  total?: number;
  finish?: number;
  participant_total?: number;
  total_distance_km?: number;
  avg_speed_kmh?: number;
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

function formatDate(value?: string | null) {
  if (!value) return "Tanggal menyusul";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return String(value);

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatEventDate(value?: string | null) {
  if (!value) return "Tanggal menyusul";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return String(value);

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatCurrency(value?: number | string | null) {
  const amount = Number(value || 0);

  if (!Number.isFinite(amount) || amount <= 0) return "FREE";

  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatKm(value?: number | string | null) {
  const numberValue = Number(value || 0);

  if (!Number.isFinite(numberValue) || numberValue <= 0) return "-";

  return `${numberValue.toFixed(2)} KM`;
}

function normalizeEventStatus(status?: string | null) {
  const raw = String(status || "published").toLowerCase();

  if (["published", "open", "active", "buka", "live"].includes(raw)) return "Aktif";
  if (["upcoming", "draft", "soon", "segera"].includes(raw)) return "Segera";
  if (["closed", "selesai", "finish", "finished"].includes(raw)) return "Selesai";

  return status || "Aktif";
}

function eventStatusBadge(status?: string | null) {
  const normalized = normalizeEventStatus(status).toLowerCase();

  if (normalized === "aktif" || normalized === "live") return "bg-green-50 text-green-700";
  if (normalized === "segera") return "bg-blue-50 text-blue-700";
  if (normalized === "selesai") return "bg-slate-100 text-slate-700";

  return "bg-purple-50 text-purple-700";
}

function getRegistrationStatus(registration: Registration | null) {
  return String(
    registration?.registration_status ||
      registration?.status ||
      "registered",
  )
    .trim()
    .toLowerCase();
}

function registrationLabel(registration: Registration | null, isRegistered: boolean) {
  if (!isRegistered) return "Belum Terdaftar";

  const status = getRegistrationStatus(registration);

  if (["registered", "joined", "join", "approved", "active"].includes(status)) return "Terdaftar";
  if (["pending", "menunggu"].includes(status)) return "Menunggu";
  if (["cancelled", "canceled", "batal"].includes(status)) return "Batal";
  if (["rejected", "ditolak"].includes(status)) return "Ditolak";

  return status.replace(/_/g, " ").toUpperCase();
}

function registrationBadge(registration: Registration | null, isRegistered: boolean) {
  if (!isRegistered) return "bg-slate-100 text-slate-700";

  const status = getRegistrationStatus(registration);

  if (["registered", "joined", "join", "approved", "active"].includes(status)) return "bg-green-50 text-green-700";
  if (["pending", "menunggu"].includes(status)) return "bg-yellow-50 text-yellow-700";
  if (["cancelled", "canceled", "batal", "rejected", "ditolak"].includes(status)) return "bg-red-50 text-red-700";

  return "bg-purple-50 text-purple-700";
}

function getParticipantNumber(registration: Registration | null) {
  return String(
    registration?.participant_number ||
      registration?.bib_number ||
      registration?.id ||
      "-",
  ).trim() || "-";
}

function getCanOpenParticipantAccess(registration: Registration | null, isRegistered: boolean) {
  const status = getRegistrationStatus(registration);

  return Boolean(isRegistered && !["cancelled", "canceled", "batal", "rejected", "ditolak"].includes(status));
}

function getResultSummary(data: any): ResultSummary {
  const rows = Array.isArray(data?.data)
    ? data.data
    : Array.isArray(data?.results)
      ? data.results
      : Array.isArray(data?.items)
        ? data.items
        : [];

  const finish = rows.filter((item: any) => {
    const status = String(item?.result_status || item?.status || "").toUpperCase();
    return status === "FINISH" || status === "FINISHED" || status === "SELESAI";
  }).length;

  const totalDistance = rows.reduce((sum: number, item: any) => {
    const value = Number(item?.distance_km ?? item?.distance ?? 0);
    return Number.isFinite(value) ? sum + value : sum;
  }, 0);

  const speeds = rows
    .map((item: any) => Number(item?.avg_speed_kmh ?? item?.avg_speed ?? 0))
    .filter((value: number) => Number.isFinite(value) && value > 0);

  return {
    total: Number(data?.total || rows.length || 0),
    participant_total: Number(data?.participant_total || data?.participantTotal || rows.length || 0),
    finish,
    total_distance_km: totalDistance,
    avg_speed_kmh: speeds.length > 0 ? speeds.reduce((sum: number, value: number) => sum + value, 0) / speeds.length : 0,
  };
}

export default function AccountEventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = String(params?.id || "");

  const [user, setUser] = useState<CurrentUser | null>(null);
  const [event, setEvent] = useState<PublicEvent | null>(null);
  const [registration, setRegistration] = useState<Registration | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [resultSummary, setResultSummary] = useState<ResultSummary>({});

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [joining, setJoining] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function loadData(silent = false) {
    if (silent) setRefreshing(true);
    else setLoading(true);

    setErrorMessage("");

    try {
      const [meResponse, eventResponse, resultResponse] = await Promise.all([
        fetchJsonWithTimeout("/api/auth/me", { method: "GET" }, 6000).catch(() => null),
        fetchJsonWithTimeout(`/api/events/${eventId}`, { method: "GET" }, 8000),
        fetchJsonWithTimeout(`/api/events/${eventId}/results`, { method: "GET" }, 8000).catch(() => null),
      ]);

      if (meResponse?.response.status === 401) {
        router.replace(`/login?next=/account/events/${eventId}`);
        return;
      }

      if (meResponse?.response.ok && meResponse.data?.user) {
        setUser(meResponse.data.user);
      }

      if (!eventResponse.response.ok || eventResponse.data?.ok === false) {
        setEvent(null);
        setRegistration(null);
        setIsRegistered(false);
        setErrorMessage(eventResponse.data?.message || eventResponse.data?.error || "Event tidak ditemukan.");
        return;
      }

      const nextEvent = eventResponse.data?.event || eventResponse.data?.data || null;
      const nextRegistration = eventResponse.data?.registration || eventResponse.data?.data?.registration || null;

      setEvent(nextEvent);
      setRegistration(nextRegistration);
      setIsRegistered(Boolean(eventResponse.data?.isRegistered || eventResponse.data?.is_registered || nextRegistration));

      if (resultResponse?.response?.ok && resultResponse.data?.ok !== false) {
        setResultSummary(getResultSummary(resultResponse.data));
      } else {
        setResultSummary({});
      }
    } catch (error) {
      console.error(error);
      setErrorMessage("Koneksi ke server bermasalah.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function handleJoin() {
    if (!event?.id) return;

    setJoining(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await fetch(`/api/events/${event.id}/join`, {
        method: "POST",
        cache: "no-store",
        credentials: "include",
      });

      const data = await response.json().catch(() => null);

      if (response.status === 401) {
        router.push(`/login?next=/account/events/${event.id}`);
        return;
      }

      if (!response.ok || data?.ok === false) {
        setErrorMessage(data?.message || data?.error || "Pendaftaran gagal.");
        return;
      }

      const newRegistration = data.registration || data.data || null;

      setRegistration(newRegistration);
      setIsRegistered(true);
      setSuccessMessage(data.message || "Berhasil daftar event. Akses peserta sudah dibuka.");
      await loadData(true);
    } catch (error) {
      console.error(error);
      setErrorMessage("Koneksi ke server bermasalah.");
    } finally {
      setJoining(false);
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

  const realEventId = String(event?.id || eventId);
  const title = getEventTitle(event, realEventId);
  const displayName = getDisplayName(user);
  const initials = getInitials(displayName);
  const roleLabel = formatRole(user?.role);
  const canOpenParticipantAccess = getCanOpenParticipantAccess(registration, isRegistered);
  const participantNumber = getParticipantNumber(registration);

  const summary = useMemo(() => {
    return {
      participantCount: Number(event?.participant_count || 0),
      quota: Number(event?.quota || 0),
      doorprizeCount: Number(event?.doorprize_count || 0),
      finishCount: Number(resultSummary.finish || 0),
      resultTotal: Number(resultSummary.total || 0),
      routeDistance: event?.distance_km,
      avgSpeed: Number(resultSummary.avg_speed_kmh || 0),
    };
  }, [event, resultSummary]);

  return (
    <main className="min-h-screen bg-[#f7f8fb] text-slate-950">
      <EventDetailSidebar />

      <section className="min-h-screen lg:pl-[260px]">
        <EventDetailTopbar
          title="Detail Event"
          subtitle={`Detail peserta untuk ${title}.`}
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
              <p className="mt-4 text-xl font-black text-slate-950">Memuat detail event...</p>
              <p className="mt-2 text-sm text-slate-500">Mengambil data event, status registrasi, dan result.</p>
            </section>
          ) : errorMessage && !event ? (
            <section className="xl:col-span-2 rounded-[2rem] border border-red-200 bg-red-50 p-6 text-red-800 shadow-sm">
              <h2 className="text-lg font-black">Detail event belum bisa dimuat</h2>
              <p className="mt-2 text-sm font-semibold">{errorMessage}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  onClick={() => loadData()}
                  className="rounded-xl bg-red-700 px-4 py-2 text-sm font-black text-white hover:bg-red-800"
                >
                  Muat ulang
                </button>
                <Link
                  href="/account/events"
                  className="rounded-xl border border-red-300 px-4 py-2 text-sm font-black text-red-800 hover:bg-red-100"
                >
                  Kembali ke My Events
                </Link>
              </div>
            </section>
          ) : (
            <>
              <section className="space-y-5">
                <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
                  {event?.image_url ? (
                    <img src={event.image_url} alt={title} className="h-[260px] w-full object-cover" />
                  ) : (
                    <div className="relative flex h-[240px] items-center justify-center overflow-hidden bg-gradient-to-br from-purple-50 via-white to-slate-100">
                      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.05)_1px,transparent_1px)] bg-[size:42px_42px]" />
                      <div className="relative z-10 flex h-20 w-20 items-center justify-center rounded-[2rem] bg-purple-700 text-white shadow-lg">
                        <CalendarDays size={42} />
                      </div>
                    </div>
                  )}

                  <div className="p-6">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`rounded-full px-3 py-1 text-xs font-black uppercase ${eventStatusBadge(event?.status)}`}>
                            {normalizeEventStatus(event?.status)}
                          </span>
                          <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-black uppercase text-purple-700">
                            {event?.category || "AMOST Event"}
                          </span>
                        </div>

                        <h1 className="mt-4 text-4xl font-black leading-tight text-slate-950">{title}</h1>
                        <p className="mt-4 max-w-3xl text-sm font-semibold leading-7 text-slate-600">
                          {event?.description || "Event olahraga outdoor AMOST. Pantau detail event, status registrasi, Live View, Results, Doorprize, dan GPX dari satu halaman."}
                        </p>
                      </div>

                      <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5 lg:min-w-[320px]">
                        <p className="text-xs font-black uppercase text-slate-500">Status Pendaftaran</p>

                        <div className="mt-3 flex items-center justify-between gap-3">
                          <span className={`rounded-full px-3 py-1 text-xs font-black uppercase ${registrationBadge(registration, isRegistered)}`}>
                            {registrationLabel(registration, isRegistered)}
                          </span>
                          {canOpenParticipantAccess ? (
                            <CheckCircle2 className="text-green-600" size={24} />
                          ) : (
                            <XCircle className="text-slate-400" size={24} />
                          )}
                        </div>

                        {isRegistered ? (
                          <div className="mt-5">
                            <p className="text-4xl font-black text-purple-700">{participantNumber}</p>
                            <p className="mt-1 text-sm font-bold text-slate-600">Nomor peserta aktif</p>
                            <p className="mt-2 text-xs font-semibold text-slate-500">
                              Terdaftar: {formatDate(registration?.joined_at || registration?.created_at)}
                            </p>
                          </div>
                        ) : (
                          <div className="mt-5">
                            <p className="text-xl font-black text-slate-950">Belum Terdaftar</p>
                            <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                              Daftar dulu untuk membuka akses Live View, Results, Doorprize, dan GPX.
                            </p>
                          </div>
                        )}

                        {canOpenParticipantAccess ? (
                          <Link
                            href={`/account/events/${realEventId}/view`}
                            className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-purple-700 px-4 text-sm font-black text-white hover:bg-purple-800"
                          >
                            <Map size={18} />
                            Buka Live View
                          </Link>
                        ) : (
                          <button
                            type="button"
                            disabled={joining}
                            onClick={handleJoin}
                            className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-purple-700 px-4 text-sm font-black text-white hover:bg-purple-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                          >
                            {joining ? <Loader2 className="h-5 w-5 animate-spin" /> : <Ticket size={18} />}
                            {joining ? "Mendaftar..." : "Daftar Event Sekarang"}
                          </button>
                        )}
                      </div>
                    </div>

                    {errorMessage ? (
                      <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
                        {errorMessage}
                      </div>
                    ) : null}

                    {successMessage ? (
                      <div className="mt-5 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm font-bold text-green-700">
                        {successMessage}
                      </div>
                    ) : null}
                  </div>
                </section>

                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <SummaryCard icon={CalendarDays} title="Tanggal" value={formatEventDate(event?.event_date)} note="Jadwal event" />
                  <SummaryCard icon={MapPin} title="Lokasi" value={event?.location || "Lokasi menyusul"} note="Area event" />
                  <SummaryCard icon={Route} title="Distance" value={formatKm(summary.routeDistance)} note="Route event" />
                  <SummaryCard icon={UsersRound} title="Peserta" value={`${summary.participantCount}/${summary.quota || "-"}`} note="Terdaftar / kuota" />
                </section>

                <section className="rounded-[2rem] border border-purple-100 bg-purple-50 p-6 shadow-sm">
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.22em] text-purple-700">Akses Peserta</p>
                      <h2 className="mt-2 text-3xl font-black text-slate-950">Menu Event Kamu</h2>
                      <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-600">
                        {canOpenParticipantAccess
                          ? "Akses ini terbuka karena akunmu sudah terdaftar pada event ini."
                          : "Daftar event untuk membuka akses penuh peserta."}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-5 lg:min-w-[760px]">
                      <ParticipantAccessButton
                        href={canOpenParticipantAccess ? `/account/events/${realEventId}/view` : undefined}
                        icon={Map}
                        label="Live View"
                        primary
                        disabled={!canOpenParticipantAccess}
                      />
                      <ParticipantAccessButton
                        href={canOpenParticipantAccess ? `/account/events/${realEventId}/results` : undefined}
                        icon={Trophy}
                        label="Results"
                        disabled={!canOpenParticipantAccess}
                      />
                      <ParticipantAccessButton
                        href={canOpenParticipantAccess ? `/account/events/${realEventId}/doorprize` : undefined}
                        icon={Gift}
                        label="Doorprize"
                        disabled={!canOpenParticipantAccess}
                      />
                      <ParticipantAccessButton
                        href={canOpenParticipantAccess ? `/account/events/${realEventId}/gpx` : undefined}
                        icon={Download}
                        label="GPX"
                        disabled={!canOpenParticipantAccess}
                      />
                      <ParticipantAccessButton
                        href="/account/events"
                        icon={CalendarDays}
                        label="My Events"
                      />
                    </div>
                  </div>
                </section>

                <section className="grid gap-5 lg:grid-cols-2">
                  <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-50 text-purple-700">
                        <FileText size={23} />
                      </div>
                      <h3 className="text-xl font-black text-slate-950">Informasi Event</h3>
                    </div>

                    <div className="mt-5 space-y-3">
                      <InfoRow label="Status Event" value={normalizeEventStatus(event?.status)} />
                      <InfoRow label="Biaya Registrasi" value={formatCurrency(event?.registration_fee)} />
                      <InfoRow label="File Route" value={event?.route_file || event?.gpx_filename || "GPX belum tersedia"} />
                      <InfoRow label="Slug" value={event?.slug || "-"} />
                    </div>
                  </section>

                  <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-50 text-purple-700">
                        <Gauge size={23} />
                      </div>
                      <h3 className="text-xl font-black text-slate-950">Ringkasan Result</h3>
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-3">
                      <SmallMetric label="Result" value={String(summary.resultTotal)} />
                      <SmallMetric label="Finish" value={String(summary.finishCount)} />
                      <SmallMetric label="Doorprize" value={String(summary.doorprizeCount)} />
                      <SmallMetric label="Avg Speed" value={summary.avgSpeed > 0 ? `${summary.avgSpeed.toFixed(1)} km/jam` : "-"} />
                    </div>
                  </section>
                </section>
              </section>

              <aside className="space-y-5">
                <section className="rounded-[2rem] border border-slate-200 bg-white p-5 text-center shadow-sm">
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-purple-700 text-2xl font-black text-white">
                    {initials}
                  </div>
                  <h2 className="mt-4 text-xl font-black text-slate-950">{displayName}</h2>
                  <p className="mt-1 break-all text-sm font-semibold text-slate-500">{user?.email || "-"}</p>
                  <span className="mt-4 inline-flex rounded-full bg-purple-50 px-3 py-1 text-xs font-black uppercase text-purple-700">
                    {roleLabel}
                  </span>
                </section>

                <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-50 text-purple-700">
                      <ShieldCheck size={23} />
                    </div>
                    <h3 className="text-lg font-black text-slate-950">Status Akun Event</h3>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <RightMetric label="Daftar" value={registrationLabel(registration, isRegistered)} />
                    <RightMetric label="Nomor" value={participantNumber} />
                    <RightMetric label="Live" value={canOpenParticipantAccess ? "Ready" : "Locked"} />
                    <RightMetric label="Result" value="Ready" />
                  </div>
                </section>

                <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
                  <h3 className="text-lg font-black text-slate-950">Quick Access</h3>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <QuickAccess href={`/account/events/${realEventId}/view`} icon={Map} label="Live View" disabled={!canOpenParticipantAccess} />
                    <QuickAccess href={`/account/events/${realEventId}/results`} icon={Trophy} label="Results" disabled={!canOpenParticipantAccess} />
                    <QuickAccess href={`/account/events/${realEventId}/doorprize`} icon={Gift} label="Doorprize" disabled={!canOpenParticipantAccess} />
                    <QuickAccess href={`/account/events/${realEventId}/gpx`} icon={Download} label="GPX" disabled={!canOpenParticipantAccess} />
                  </div>
                </section>

                <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
                  <h3 className="text-lg font-black text-slate-950">Alur Event</h3>

                  <div className="mt-4 space-y-3">
                    <FlowStep number="1" title="Detail Event" text="Cek informasi dan status pendaftaran." active />
                    <FlowStep number="2" title="Live View" text="Pantau posisi dan peserta standby/live." />
                    <FlowStep number="3" title="Results" text="Lihat hasil setelah tracking dikirim." />
                    <FlowStep number="4" title="Doorprize & GPX" text="Cek pemenang dan download route." />
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

function EventDetailSidebar() {
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
        <p className="text-sm font-black text-purple-700">Detail Event</p>
        <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
          Cek status daftar, buka Live View, Results, Doorprize, dan GPX.
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

function EventDetailTopbar({
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

        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-500">{title}</p>
          <p className="mt-2 break-words text-xl font-black text-slate-950">{value}</p>
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

function ParticipantAccessButton({
  href,
  icon: Icon,
  label,
  primary = false,
  disabled = false,
}: {
  href?: string;
  icon: ElementType;
  label: string;
  primary?: boolean;
  disabled?: boolean;
}) {
  const className = `flex min-h-[92px] flex-col items-center justify-center rounded-2xl px-3 py-5 text-center text-sm font-black shadow-sm ring-1 ${
    disabled
      ? "cursor-not-allowed bg-slate-100 text-slate-400 ring-slate-200"
      : primary
        ? "bg-purple-700 text-white ring-purple-700 hover:bg-purple-800"
        : "bg-white text-slate-950 ring-purple-100 hover:bg-purple-700 hover:text-white"
  }`;

  if (disabled || !href) {
    return (
      <span className={className}>
        <Icon size={27} />
        <span className="mt-3">{label}</span>
      </span>
    );
  }

  return (
    <Link href={href} className={className}>
      <Icon size={27} />
      <span className="mt-3">{label}</span>
    </Link>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 p-4">
      <p className="text-xs font-black uppercase text-slate-400">{label}</p>
      <p className="text-right text-sm font-black text-slate-950">{value}</p>
    </div>
  );
}

function SmallMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="text-xs font-black uppercase text-slate-400">{label}</p>
      <p className="mt-2 text-lg font-black text-slate-950">{value}</p>
    </div>
  );
}

function RightMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="text-xs font-black uppercase text-slate-400">{label}</p>
      <p className="mt-2 text-lg font-black text-slate-950">{value}</p>
    </div>
  );
}

function QuickAccess({
  href,
  icon: Icon,
  label,
  disabled = false,
}: {
  href: string;
  icon: ElementType;
  label: string;
  disabled?: boolean;
}) {
  const className = `flex min-h-[82px] flex-col items-center justify-center rounded-2xl border px-3 py-4 text-center text-xs font-black ${
    disabled
      ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
      : "border-slate-200 bg-slate-50 text-slate-950 hover:bg-purple-700 hover:text-white"
  }`;

  if (disabled) {
    return (
      <span className={className}>
        <Icon size={23} />
        <span className="mt-2">{label}</span>
      </span>
    );
  }

  return (
    <Link href={href} prefetch={false} className={className}>
      <Icon size={23} />
      <span className="mt-2">{label}</span>
    </Link>
  );
}

function FlowStep({
  number,
  title,
  text,
  active = false,
}: {
  number: string;
  title: string;
  text: string;
  active?: boolean;
}) {
  return (
    <div className={`flex gap-3 rounded-2xl p-4 ${active ? "bg-purple-50" : "bg-slate-50"}`}>
      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-black ${
        active ? "bg-purple-700 text-white" : "bg-slate-200 text-slate-600"
      }`}>
        {number}
      </div>
      <div>
        <p className="text-sm font-black text-slate-950">{title}</p>
        <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">{text}</p>
      </div>
    </div>
  );
}
