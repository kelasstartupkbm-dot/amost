"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type ElementType } from "react";
import {
  Activity,
  ArrowLeft,
  Bike,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Gift,
  Gauge,
  Loader2,
  LocateFixed,
  MapPin,
  Maximize2,
  Navigation,
  RefreshCw,
  Route,
  Satellite,
  ShieldCheck,
  Trophy,
  UsersRound,
  Wifi,
} from "lucide-react";

type PublicEvent = {
  id: number | string;
  title?: string | null;
  event_title?: string | null;
  name?: string | null;
  category?: string | null;
  event_date?: string | null;
  location?: string | null;
  participant_count?: number | string | null;
  quota?: number | string | null;
  doorprize_count?: number | string | null;
  status?: string | null;
  description?: string | null;
  distance_km?: number | string | null;
  route_file?: string | null;
};

type Registration = {
  id?: number | string;
  participant_number?: string | null;
  status?: string | null;
  registration_status?: string | null;
};

type EventResult = {
  result_id: number | string;
  event_id: number | string;
  user_id: number | string;
  full_name?: string | null;
  email?: string | null;
  participant_number?: string | null;
  distance?: number | string | null;
  duration?: number | string | null;
  avg_speed?: number | string | null;
  result_status?: string | null;
  submitted_at?: string | null;
};

function getEventTitle(event: PublicEvent | null, eventId: string) {
  return (
    event?.title ||
    event?.event_title ||
    event?.name ||
    `Event #${eventId}`
  );
}

function normalizeStatus(status: string | null | undefined) {
  const raw = String(status || "published").toLowerCase();

  if (["published", "open", "active", "buka", "live"].includes(raw)) {
    return "Aktif";
  }

  if (["upcoming", "draft", "soon", "segera"].includes(raw)) {
    return "Segera";
  }

  if (["closed", "selesai", "finish", "finished"].includes(raw)) {
    return "Selesai";
  }

  return status || "Aktif";
}

function formatDate(value: string | null | undefined) {
  if (!value) return "Tanggal menyusul";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatDistance(value: number | string | null | undefined) {
  const numberValue = Number(value || 0);

  if (!Number.isFinite(numberValue) || numberValue <= 0) {
    return "0.00 KM";
  }

  return `${numberValue.toFixed(2)} KM`;
}

function formatSpeed(value: number | string | null | undefined) {
  const numberValue = Number(value || 0);

  if (!Number.isFinite(numberValue) || numberValue <= 0) {
    return "0.00 km/jam";
  }

  return `${numberValue.toFixed(2)} km/jam`;
}

function formatDuration(value: number | string | null | undefined) {
  const seconds = Number(value || 0);

  if (!Number.isFinite(seconds) || seconds <= 0) {
    return "00:00:00";
  }

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  return [hours, minutes, remainingSeconds]
    .map((value) => String(value).padStart(2, "0"))
    .join(":");
}

function percent(value: number, total: number) {
  if (!total || total <= 0) return 0;

  const result = Math.round((value / total) * 100);

  if (result < 0) return 0;
  if (result > 100) return 100;

  return result;
}

export default function EventLiveViewPage() {
  const params = useParams();
  const router = useRouter();

  const eventId = String(params?.id || "");

  const [event, setEvent] = useState<PublicEvent | null>(null);
  const [registration, setRegistration] = useState<Registration | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [results, setResults] = useState<EventResult[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [resultsError, setResultsError] = useState("");

  const eventTitle = getEventTitle(event, eventId);

  const finishedCount = useMemo(() => {
    return results.filter(
      (item) => String(item.result_status || "").toUpperCase() === "FINISH"
    ).length;
  }, [results]);

  const registeredCount = Number(event?.participant_count || 0);
  const quota = Number(event?.quota || 0);
  const routeDistance = Number(event?.distance_km || 0);
  const progressValue = percent(finishedCount, registeredCount || quota || 1);

  const leaderResult = results[0] || null;

  async function loadData(silent = false) {
    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setErrorMessage("");
    setResultsError("");

    try {
      const [eventResponse, resultsResponse] = await Promise.all([
        fetch(`/api/events/${eventId}`, {
          method: "GET",
          cache: "no-store",
        }),
        fetch(`/api/events/${eventId}/results`, {
          method: "GET",
          cache: "no-store",
        }).catch(() => null),
      ]);

      const eventData = await eventResponse.json().catch(() => null);

      if (eventResponse.status === 401) {
        router.push(`/login?next=/event/${eventId}/view`);
        return;
      }

      if (!eventResponse.ok || eventData?.ok === false) {
        setEvent(null);
        setErrorMessage(
          eventData?.message || eventData?.error || "Event belum bisa dimuat."
        );
        return;
      }

      setEvent(eventData.event || eventData.data || null);
      setRegistration(eventData.registration || null);
      setIsRegistered(Boolean(eventData.isRegistered));

      if (resultsResponse) {
        const resultsData = await resultsResponse.json().catch(() => null);

        if (resultsResponse.ok && resultsData?.ok !== false) {
          const rows = Array.isArray(resultsData?.data)
            ? resultsData.data
            : Array.isArray(resultsData?.items)
              ? resultsData.items
              : [];

          setResults(rows);
        } else {
          setResults([]);
          setResultsError(
            resultsData?.message ||
              resultsData?.error ||
              "Results belum bisa dimuat."
          );
        }
      }
    } catch (error) {
      console.error(error);
      setEvent(null);
      setResults([]);
      setErrorMessage("Koneksi ke server bermasalah.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [eventId]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-950">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-purple-700" />
          <p className="mt-4 text-lg font-black">Memuat Live View...</p>
          <p className="mt-2 text-sm text-slate-500">
            Mengambil data event dan status peserta.
          </p>
        </div>
      </main>
    );
  }

  if (errorMessage) {
    return (
      <main className="min-h-screen bg-slate-50 p-6 text-slate-950">
        <div className="mx-auto max-w-[960px] rounded-2xl border border-red-200 bg-red-50 p-8 text-center text-red-700">
          <p className="text-xl font-black">{errorMessage}</p>
          <Link
            href={`/events/${eventId}`}
            className="mt-5 inline-flex h-11 items-center justify-center rounded-xl bg-red-700 px-5 text-sm font-black text-white"
          >
            Kembali ke Event
          </Link>
        </div>
      </main>
    );
  }

  if (!isRegistered) {
    return (
      <main className="min-h-screen bg-slate-50 p-6 text-slate-950">
        <div className="mx-auto max-w-[960px] rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-purple-50 text-purple-700">
            <ShieldCheck size={30} />
          </div>

          <h1 className="mt-5 text-2xl font-black">Akses Live View Terkunci</h1>

          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
            Live View Tracking hanya tersedia untuk peserta yang sudah terdaftar
            pada event ini.
          </p>

          <Link
            href={`/events/${eventId}`}
            className="mt-5 inline-flex h-11 items-center justify-center rounded-xl bg-purple-700 px-5 text-sm font-black text-white"
          >
            Daftar / Kembali ke Event
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex min-h-[92px] max-w-[1440px] flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-[88px]">
          <div className="flex items-center gap-5">
            <Link
              href={`/events/${eventId}`}
              className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            >
              <ArrowLeft size={22} />
            </Link>

            <Link href="/" className="flex items-center">
              <img
                src="/amost_logo_wide_.png"
                alt="AMOST"
                className="h-[58px] w-auto object-contain"
              />
            </Link>

            <div className="hidden border-l border-slate-200 pl-5 md:block">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-purple-700">
                Tracking Live
              </p>
              <h1 className="mt-1 text-2xl font-black leading-tight text-slate-950">
                {eventTitle}
              </h1>
              <p className="mt-1 max-w-xl text-sm font-medium leading-6 text-slate-500">
                Live View event untuk peserta terdaftar.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <StatusPill icon={Wifi} title="GPS Signal" value="Standby" />

            <button
              type="button"
              onClick={() => loadData(true)}
              disabled={refreshing}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 hover:bg-slate-50 disabled:opacity-70"
            >
              {refreshing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw size={17} />
              )}
              Refresh
            </button>

            <Link
              href={`/events/${eventId}/results`}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 hover:bg-slate-50"
            >
              Results
            </Link>

            <Link
              href={`/events/${eventId}/doorprize`}
              className="inline-flex h-11 items-center justify-center rounded-xl bg-purple-700 px-4 text-sm font-black text-white hover:bg-purple-800"
            >
              Doorprize
            </Link>
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-[1440px] grid-cols-1 gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:px-[88px]">
        <section className="relative min-h-[680px] overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <MapPlaceholder />

          <div className="absolute left-5 top-5 z-10 w-[calc(100%-40px)] max-w-[380px] rounded-3xl border border-slate-200 bg-white/95 p-5 shadow-lg backdrop-blur">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-100 text-purple-700">
                <Bike size={26} />
              </div>

              <div className="min-w-0">
                <p className="text-xs font-black uppercase tracking-wide text-slate-500">
                  Event Aktif
                </p>
                <h2 className="mt-1 truncate text-lg font-black text-slate-950">
                  {eventTitle}
                </h2>
                <p className="mt-1 text-sm font-semibold text-slate-500">
                  {formatDate(event?.event_date)} •{" "}
                  {event?.location || "Lokasi menyusul"}
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-black uppercase text-purple-700">
                {normalizeStatus(event?.status)}
              </span>
              <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-black uppercase text-green-700">
                Peserta #{registration?.participant_number || registration?.id || "-"}
              </span>
            </div>
          </div>

          <div className="absolute bottom-5 left-5 right-5 z-10 rounded-3xl border border-slate-200 bg-white/95 p-5 shadow-lg backdrop-blur md:left-1/2 md:right-auto md:w-[520px] md:-translate-x-1/2">
            <p className="text-center text-xs font-black uppercase tracking-wide text-slate-500">
              Status Live Tracking
            </p>

            <div className="mt-3 flex items-center justify-center gap-5">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-700">
                <Clock3 size={24} />
              </div>

              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-purple-700 text-white">
                <Navigation size={28} />
              </div>

              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-700">
                <Maximize2 size={24} />
              </div>
            </div>

            <p className="mt-3 text-center text-2xl font-black text-slate-950">
              Live View Standby
            </p>

            <p className="mt-1 text-center text-sm leading-6 text-slate-500">
              Peta live tracking belum tersambung ke data posisi real-time.
              Tahap ini memastikan halaman live tidak 404 dan siap disambungkan
              ke tracking.
            </p>
          </div>

          <div className="absolute right-5 top-5 z-10 flex flex-col gap-3">
            <MapToolButton icon={LocateFixed} label="Lokasi" />
            <MapToolButton icon={Satellite} label="Satelit" />
            <MapToolButton icon={Route} label="Rute" />
          </div>
        </section>

        <aside className="space-y-6">
          <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-950">
                Statistik Real-time
              </h3>

              <span className="inline-flex items-center gap-2 rounded-full bg-green-50 px-3 py-1 text-xs font-black text-green-700">
                <span className="h-2 w-2 rounded-full bg-green-500" />
                Standby
              </span>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <StatBox label="Jarak Rute" value={formatDistance(routeDistance)} />
              <StatBox label="Durasi" value={formatDuration(leaderResult?.duration)} />
              <StatBox label="Avg Speed" value={formatSpeed(leaderResult?.avg_speed)} />
              <StatBox label="Finish" value={String(finishedCount)} />
            </div>
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-950">
                Progress Event
              </h3>

              <p className="text-sm font-black text-slate-500">
                {progressValue}%
              </p>
            </div>

            <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-purple-700"
                style={{ width: `${progressValue}%` }}
              />
            </div>

            <div className="mt-5 grid grid-cols-3 gap-3">
              <MiniCounter label="Peserta" value={String(registeredCount)} />
              <MiniCounter label="Finish" value={String(finishedCount)} />
              <MiniCounter label="Kuota" value={String(quota || "-")} />
            </div>
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-950">
                Peserta / Results
              </h3>

              <Link
                href={`/events/${eventId}/results`}
                className="text-sm font-black text-purple-700 hover:text-purple-800"
              >
                Lihat Semua
              </Link>
            </div>

            {resultsError ? (
              <div className="mt-4 rounded-2xl border border-yellow-200 bg-yellow-50 p-4 text-sm font-bold text-yellow-700">
                {resultsError}
              </div>
            ) : results.length === 0 ? (
              <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-center">
                <UsersRound className="mx-auto h-10 w-10 text-slate-300" />
                <p className="mt-3 text-sm font-black text-slate-950">
                  Belum ada data tracking
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Data peserta live akan muncul setelah tracking tersambung.
                </p>
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {results.slice(0, 5).map((item, index) => (
                  <div
                    key={String(item.result_id)}
                    className="flex items-center justify-between rounded-2xl bg-slate-50 p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-100 text-sm font-black text-purple-700">
                        {index + 1}
                      </div>

                      <div>
                        <p className="text-sm font-black text-slate-950">
                          {item.full_name || "Tanpa Nama"}
                        </p>
                        <p className="text-xs font-bold text-slate-500">
                          {item.participant_number || "-"} •{" "}
                          {formatDistance(item.distance)}
                        </p>
                      </div>
                    </div>

                    <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-black uppercase text-green-700">
                      {item.result_status || "REVIEW"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-black text-slate-950">Pintasan</h3>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <ShortcutLink
                href={`/events/${eventId}`}
                icon={CalendarDays}
                label="Detail Event"
              />
              <ShortcutLink
                href={`/events/${eventId}/results`}
                icon={Trophy}
                label="Results"
              />
              <ShortcutLink
                href={`/events/${eventId}/doorprize`}
                icon={Gift}
                label="Doorprize"
              />
              <ShortcutLink
                href="/account"
                icon={Activity}
                label="Akun Saya"
              />
            </div>
          </section>
        </aside>
      </section>
    </main>
  );
}

function StatusPill({
  icon: Icon,
  title,
  value,
}: {
  icon: ElementType;
  title: string;
  value: string;
}) {
  return (
    <div className="hidden h-11 items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 lg:flex">
      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-green-50 text-green-700">
        <Icon size={16} />
      </div>

      <div>
        <p className="text-xs font-black leading-none text-slate-950">{title}</p>
        <p className="mt-1 text-xs font-bold leading-none text-slate-500">
          {value}
        </p>
      </div>
    </div>
  );
}

function MapPlaceholder() {
  return (
    <div className="absolute inset-0 overflow-hidden bg-[#eef3f1]">
      <div className="absolute inset-0 opacity-[0.55]">
        <div className="h-full w-full bg-[linear-gradient(90deg,rgba(100,116,139,.12)_1px,transparent_1px),linear-gradient(0deg,rgba(100,116,139,.12)_1px,transparent_1px)] bg-[size:44px_44px]" />
      </div>

      <div className="absolute left-[8%] top-[18%] h-[760px] w-[760px] rounded-full border border-slate-300/60" />
      <div className="absolute left-[31%] top-[4%] h-[620px] w-[620px] rounded-full border border-slate-300/50" />
      <div className="absolute bottom-[8%] right-[10%] h-[520px] w-[520px] rounded-full border border-slate-300/50" />

      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 1000 700"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          d="M160 520 C230 505 255 455 315 462 C390 472 380 372 455 382 C528 392 520 295 592 300 C650 305 652 210 720 214 C775 218 780 128 846 132"
          fill="none"
          stroke="#7e22ce"
          strokeWidth="8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M160 520 C230 505 255 455 315 462 C390 472 380 372 455 382 C528 392 520 295 592 300 C650 305 652 210 720 214 C775 218 780 128 846 132"
          fill="none"
          stroke="#a855f7"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {[{ x: 160, y: 520, label: "START" }, { x: 315, y: 462, label: "1" }, { x: 455, y: 382, label: "2" }, { x: 592, y: 300, label: "3" }, { x: 720, y: 214, label: "4" }, { x: 846, y: 132, label: "FINISH" }].map(
          (point) => (
            <g key={point.label}>
              <circle
                cx={point.x}
                cy={point.y}
                r={18}
                fill="white"
                stroke="#7e22ce"
                strokeWidth="3"
              />
              <text
                x={point.x}
                y={point.y + 5}
                textAnchor="middle"
                fontSize="16"
                fontWeight="800"
                fill="#7e22ce"
              >
                {point.label === "START"
                  ? "S"
                  : point.label === "FINISH"
                    ? "F"
                    : point.label}
              </text>
            </g>
          )
        )}

        <g>
          <circle cx="540" cy="335" r="38" fill="#2563eb" opacity="0.18" />
          <circle cx="540" cy="335" r="18" fill="#2563eb" />
          <path
            d="M540 315 L555 360 L540 350 L525 360 Z"
            fill="white"
            transform="rotate(35 540 335)"
          />
        </g>
      </svg>

      <div className="absolute inset-0 bg-gradient-to-br from-white/25 via-transparent to-white/20" />
    </div>
  );
}

function MapToolButton({
  icon: Icon,
  label,
}: {
  icon: ElementType;
  label: string;
}) {
  return (
    <button
      type="button"
      className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-white/95 text-slate-700 shadow-sm backdrop-blur hover:bg-white"
      title={label}
    >
      <Icon size={20} />
    </button>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
      <p className="text-xs font-black uppercase text-slate-500">{label}</p>
      <p className="mt-2 text-xl font-black text-slate-950">{value}</p>
    </div>
  );
}

function MiniCounter({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4 text-center">
      <p className="text-2xl font-black text-slate-950">{value}</p>
      <p className="mt-1 text-xs font-black uppercase text-slate-500">{label}</p>
    </div>
  );
}

function ShortcutLink({
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
      className="flex min-h-[86px] flex-col items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 px-3 py-4 text-center text-sm font-black text-slate-950 hover:bg-purple-700 hover:text-white"
    >
      <Icon size={24} />
      <span className="mt-2">{label}</span>
    </Link>
  );
}
