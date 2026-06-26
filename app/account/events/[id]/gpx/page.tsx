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
  Copy,
  Download,
  Eye,
  FileText,
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
  event_date?: string | null;
  location?: string | null;
  status?: string | null;
  participant_count?: number | string | null;
  quota?: number | string | null;
  distance_km?: number | string | null;
  route_file?: string | null;
  gpx_filename?: string | null;
};

type GpxStatus = {
  state: "checking" | "available" | "unavailable" | "forbidden" | "error";
  message: string;
  filename: string;
  sizeBytes: number;
  contentType: string;
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

async function fetchBlobWithTimeout(url: string, timeoutMs = REQUEST_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: "GET",
      cache: "no-store",
      credentials: "include",
      signal: controller.signal,
    });

    const contentType = response.headers.get("content-type") || "";
    const contentDisposition = response.headers.get("content-disposition") || "";

    if (!response.ok) {
      const errorText = contentType.includes("application/json")
        ? await response.json().catch(() => null)
        : null;

      return {
        response,
        ok: false,
        blob: null as Blob | null,
        contentType,
        contentDisposition,
        message: errorText?.message || errorText?.error || "GPX belum bisa diunduh.",
      };
    }

    const blob = await response.blob();

    return {
      response,
      ok: true,
      blob,
      contentType,
      contentDisposition,
      message: "GPX tersedia.",
    };
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

function formatKm(value?: number | string | null) {
  const numberValue = Number(value || 0);

  if (!Number.isFinite(numberValue) || numberValue <= 0) return "-";

  return `${numberValue.toFixed(2)} KM`;
}

function parseFilename(contentDisposition: string, fallback: string) {
  const match = contentDisposition.match(/filename\*?=(?:UTF-8''|")?([^";]+)/i);
  const raw = match?.[1] ? decodeURIComponent(match[1].replace(/"/g, "")) : fallback;

  return raw || fallback;
}

function sanitizeFilename(value: string) {
  const clean = String(value || "amost-route.gpx")
    .trim()
    .replace(/[\\/:*?"<>|]+/g, "-")
    .replace(/\s+/g, "-");

  return clean.toLowerCase().endsWith(".gpx") ? clean : `${clean}.gpx`;
}

function formatFileSize(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "-";

  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;

  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function statusBadge(status: GpxStatus["state"]) {
  if (status === "available") return "bg-green-50 text-green-700";
  if (status === "checking") return "bg-blue-50 text-blue-700";
  if (status === "forbidden") return "bg-red-50 text-red-700";
  if (status === "unavailable") return "bg-yellow-50 text-yellow-700";

  return "bg-red-50 text-red-700";
}

function statusLabel(status: GpxStatus["state"]) {
  if (status === "available") return "Siap Diunduh";
  if (status === "checking") return "Mengecek";
  if (status === "forbidden") return "Tidak Ada Akses";
  if (status === "unavailable") return "Belum Tersedia";

  return "Error";
}

export default function AccountEventGpxPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = String(params?.id || "");

  const [user, setUser] = useState<CurrentUser | null>(null);
  const [event, setEvent] = useState<PublicEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [copyMessage, setCopyMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [gpxStatus, setGpxStatus] = useState<GpxStatus>({
    state: "checking",
    message: "Mengecek file GPX.",
    filename: "",
    sizeBytes: 0,
    contentType: "",
  });

  const downloadUrl = `/api/gpx-download?id=${encodeURIComponent(eventId)}`;

  async function checkGpxAvailability(eventTitle: string) {
    setGpxStatus({
      state: "checking",
      message: "Mengecek file GPX.",
      filename: "",
      sizeBytes: 0,
      contentType: "",
    });

    try {
      const result = await fetchBlobWithTimeout(downloadUrl, 9000);

      if (result.response.status === 401) {
        router.replace(`/login?next=/account/events/${eventId}/gpx`);
        return;
      }

      if (result.response.status === 403) {
        setGpxStatus({
          state: "forbidden",
          message: result.message || "GPX hanya dapat diunduh oleh peserta event atau admin.",
          filename: "",
          sizeBytes: 0,
          contentType: result.contentType,
        });
        return;
      }

      if (!result.ok || !result.blob) {
        const unavailable = result.response.status === 404;

        setGpxStatus({
          state: unavailable ? "unavailable" : "error",
          message: result.message || "GPX belum tersedia untuk event ini.",
          filename: "",
          sizeBytes: 0,
          contentType: result.contentType,
        });
        return;
      }

      const fallbackFilename = sanitizeFilename(eventTitle || `amost-event-${eventId}.gpx`);
      const filename = sanitizeFilename(parseFilename(result.contentDisposition, fallbackFilename));

      setGpxStatus({
        state: "available",
        message: "GPX siap diunduh.",
        filename,
        sizeBytes: result.blob.size,
        contentType: result.contentType || "application/gpx+xml",
      });
    } catch (error) {
      console.error(error);
      setGpxStatus({
        state: "error",
        message: "Koneksi ke server bermasalah saat mengecek GPX.",
        filename: "",
        sizeBytes: 0,
        contentType: "",
      });
    }
  }

  async function loadData(silent = false) {
    if (silent) setRefreshing(true);
    else setLoading(true);

    setErrorMessage("");
    setCopyMessage("");

    try {
      const [meResponse, eventResponse] = await Promise.all([
        fetchJsonWithTimeout("/api/auth/me", { method: "GET" }, 6000).catch(() => null),
        fetchJsonWithTimeout(`/api/events/${eventId}`, { method: "GET" }, 7000),
      ]);

      if (meResponse?.response.status === 401) {
        router.replace(`/login?next=/account/events/${eventId}/gpx`);
        return;
      }

      if (meResponse?.response.ok && meResponse.data?.user) {
        setUser(meResponse.data.user);
      }

      if (!eventResponse.response.ok || eventResponse.data?.ok === false) {
        setEvent(null);
        setErrorMessage(eventResponse.data?.message || eventResponse.data?.error || "Event tidak ditemukan.");
        return;
      }

      const nextEvent = eventResponse.data?.event || eventResponse.data?.data || null;
      const title = getEventTitle(nextEvent, eventId);

      setEvent(nextEvent);
      await checkGpxAvailability(title);
    } catch (error) {
      console.error(error);
      setErrorMessage("Koneksi ke server bermasalah.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function copyDownloadLink() {
    setCopyMessage("");

    try {
      const absoluteUrl =
        typeof window !== "undefined"
          ? `${window.location.origin}${downloadUrl}`
          : downloadUrl;

      await navigator.clipboard.writeText(absoluteUrl);
      setCopyMessage("Link download GPX berhasil disalin.");
    } catch {
      setCopyMessage("Browser belum mengizinkan copy otomatis.");
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

  const canDownload = gpxStatus.state === "available";

  const summary = useMemo(() => {
    return {
      eventName: title,
      date: formatDate(event?.event_date),
      location: event?.location || "-",
      distance: formatKm(event?.distance_km),
      participants: String(event?.participant_count || 0),
      filename: gpxStatus.filename || event?.route_file || event?.gpx_filename || "-",
    };
  }, [event, gpxStatus.filename, title]);

  return (
    <main className="min-h-screen bg-[#f7f8fb] text-slate-950">
      <GpxSidebar />

      <section className="min-h-screen lg:pl-[260px]">
        <GpxTopbar
          title="GPX Event"
          subtitle={`Download route GPX untuk event ${title}.`}
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
              <p className="mt-4 text-xl font-black text-slate-950">Mengecek GPX...</p>
              <p className="mt-2 text-sm text-slate-500">Mengambil detail event dan status file route.</p>
            </section>
          ) : errorMessage ? (
            <section className="xl:col-span-2 rounded-[2rem] border border-red-200 bg-red-50 p-6 text-red-800 shadow-sm">
              <h2 className="text-lg font-black">GPX belum bisa dimuat</h2>
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
                      <p className="text-xs font-black uppercase tracking-[0.22em] text-purple-700">AMOST GPX</p>
                      <h1 className="mt-2 text-3xl font-black text-slate-950">{title}</h1>
                      <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
                        GPX digunakan peserta untuk route guidance dan arsip rute event.
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
                        href={`/account/events/${eventId}/results`}
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 hover:bg-slate-50"
                      >
                        <Trophy size={17} />
                        Results
                      </Link>
                      <Link
                        href={`/events/${eventId}`}
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 hover:bg-slate-50"
                      >
                        <Eye size={17} />
                        Detail Event
                      </Link>
                    </div>
                  </div>
                </section>

                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <SummaryCard icon={FileText} title="Status GPX" value={statusLabel(gpxStatus.state)} note="Status file" />
                  <SummaryCard icon={Download} title="Ukuran File" value={formatFileSize(gpxStatus.sizeBytes)} note="Estimasi download" />
                  <SummaryCard icon={Navigation} title="Distance" value={summary.distance} note="Route event" />
                  <SummaryCard icon={UsersRoundSafe} title="Peserta" value={summary.participants} note="Peserta terdaftar" />
                </section>

                <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
                    <div className="overflow-hidden rounded-[2rem] bg-slate-950 p-6 text-white">
                      <div className="flex items-center gap-3">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-600 text-white">
                          <FileText size={30} />
                        </div>

                        <div>
                          <p className="text-xs font-black uppercase tracking-[0.22em] text-purple-300">GPX Route File</p>
                          <h2 className="mt-1 text-2xl font-black text-white">{summary.filename}</h2>
                        </div>
                      </div>

                      <div className="mt-8 rounded-[2rem] border border-white/10 bg-white/5 p-6">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <span className={`rounded-full px-4 py-2 text-sm font-black ${statusBadge(gpxStatus.state)}`}>
                            {statusLabel(gpxStatus.state)}
                          </span>

                          <p className="text-sm font-bold text-slate-300">{gpxStatus.contentType || "application/gpx+xml"}</p>
                        </div>

                        <p className="mt-5 text-base font-semibold leading-7 text-slate-300">{gpxStatus.message}</p>

                        <div className="mt-6 grid gap-3 md:grid-cols-3">
                          <DarkMetric label="Event" value={summary.eventName} />
                          <DarkMetric label="Tanggal" value={summary.date} />
                          <DarkMetric label="Lokasi" value={summary.location} />
                        </div>

                        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                          {canDownload ? (
                            <a
                              href={downloadUrl}
                              className="inline-flex h-13 min-h-[52px] flex-1 items-center justify-center gap-2 rounded-xl bg-purple-700 px-5 text-sm font-black text-white hover:bg-purple-800"
                            >
                              <Download size={19} />
                              Download GPX
                            </a>
                          ) : (
                            <button
                              type="button"
                              disabled
                              className="inline-flex h-13 min-h-[52px] flex-1 cursor-not-allowed items-center justify-center gap-2 rounded-xl bg-slate-700 px-5 text-sm font-black text-slate-300"
                            >
                              <XCircle size={19} />
                              GPX Belum Bisa Diunduh
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={copyDownloadLink}
                            disabled={!canDownload}
                            className="inline-flex h-13 min-h-[52px] items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/10 px-5 text-sm font-black text-white hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <Copy size={18} />
                            Copy Link
                          </button>
                        </div>

                        {copyMessage ? (
                          <div className="mt-4 rounded-xl border border-white/10 bg-white/10 p-3 text-sm font-black text-white">
                            {copyMessage}
                          </div>
                        ) : null}
                      </div>
                    </div>

                    <div className="rounded-[2rem] border border-slate-200 bg-slate-50 p-6">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-50 text-purple-700">
                        <CheckCircle2 size={30} />
                      </div>
                      <h3 className="mt-5 text-2xl font-black text-slate-950">Aturan Download GPX</h3>
                      <p className="mt-3 text-sm font-semibold leading-7 text-slate-600">
                        GPX hanya dapat diunduh oleh peserta yang sudah terdaftar/join event atau akun admin.
                        Jika tombol belum aktif, pastikan kamu sudah login dan sudah mengikuti event.
                      </p>

                      <div className="mt-6 space-y-3">
                        <RuleItem label="Peserta Event" text="Akun harus sudah terdaftar pada event." />
                        <RuleItem label="Admin" text="Super Admin dan Staff AMOST dapat mengunduh GPX event." />
                        <RuleItem label="File Route" text="GPX diambil dari gpx_content, file GPX, atau route_path_json." />
                      </div>
                    </div>
                  </div>
                </section>
              </section>

              <aside className="space-y-5">
                <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-50 text-purple-700">
                      <Download size={23} />
                    </div>
                    <h3 className="text-lg font-black text-slate-950">Ringkasan GPX</h3>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <RightMetric label="Status" value={statusLabel(gpxStatus.state)} />
                    <RightMetric label="Ukuran" value={formatFileSize(gpxStatus.sizeBytes)} />
                    <RightMetric label="Distance" value={summary.distance} />
                    <RightMetric label="Peserta" value={summary.participants} />
                  </div>
                </section>

                <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
                  <h3 className="text-lg font-black text-slate-950">Event</h3>
                  <h4 className="mt-4 text-xl font-black text-slate-950">{title}</h4>
                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
                    {summary.date}
                    {event?.location ? ` · ${event.location}` : ""}
                  </p>

                  <div className="mt-5 grid grid-cols-1 gap-3">
                    <Link
                      href={`/account/events/${eventId}/view`}
                      className="flex h-11 items-center justify-center gap-2 rounded-xl bg-purple-700 text-sm font-black text-white hover:bg-purple-800"
                    >
                      <Map size={17} />
                      Live View
                    </Link>
                    <Link
                      href={`/account/events/${eventId}/results`}
                      className="flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-sm font-black text-slate-700 hover:bg-slate-50"
                    >
                      <Trophy size={17} />
                      Results Event
                    </Link>
                  </div>
                </section>

                <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
                  <h3 className="text-lg font-black text-slate-950">Quick Access</h3>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <QuickAccess href={`/account/events/${eventId}/view`} icon={Map} label="Live View" />
                    <QuickAccess href={`/account/events/${eventId}/results`} icon={Trophy} label="Results" />
                    <QuickAccess href={`/account/events/${eventId}/doorprize`} icon={Ticket} label="Doorprize" />
                    <QuickAccess href="/account/tracking" icon={Navigation} label="Tracking" />
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

function UsersRoundSafe({ size = 24 }: { size?: number }) {
  return <UserRound size={size} />;
}

function GpxSidebar() {
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
        <p className="text-sm font-black text-purple-700">GPX Route</p>
        <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
          Download route event untuk panduan latihan dan tracking.
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

function GpxTopbar({
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

function DarkMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/10 p-4">
      <p className="text-xs font-black uppercase text-slate-400">{label}</p>
      <p className="mt-1 text-base font-black text-white">{value}</p>
    </div>
  );
}

function RuleItem({ label, text }: { label: string; text: string }) {
  return (
    <div className="rounded-2xl bg-white p-4">
      <p className="text-sm font-black text-slate-950">{label}</p>
      <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">{text}</p>
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
