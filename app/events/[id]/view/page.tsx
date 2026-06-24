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
  Layers,
  Loader2,
  MapPin,
  Maximize2,
  Menu,
  Navigation,
  RefreshCw,
  Route,
  Satellite,
  ShieldCheck,
  Trophy,
  UsersRound,
  X,
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
    month: "short",
    year: "numeric",
  });
}

function formatDistance(value: number | string | null | undefined) {
  const numberValue = Number(value || 0);

  if (!Number.isFinite(numberValue) || numberValue <= 0) {
    return "0.00";
  }

  return numberValue.toFixed(2);
}

function formatSpeed(value: number | string | null | undefined) {
  const numberValue = Number(value || 0);

  if (!Number.isFinite(numberValue) || numberValue <= 0) {
    return "0.0";
  }

  return numberValue.toFixed(1);
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
    .map((item) => String(item).padStart(2, "0"))
    .join(":");
}

function calculatePercent(value: number, total: number) {
  if (!total || total <= 0) return 0;

  const result = Math.round((value / total) * 100);

  if (result < 0) return 0;
  if (result > 100) return 100;

  return result;
}

function getStatusBadgeClass(status: string | null | undefined) {
  const clean = String(status || "REVIEW").toUpperCase();

  if (clean === "FINISH") {
    return "bg-green-50 text-green-700";
  }

  if (clean === "DNF") {
    return "bg-orange-50 text-orange-700";
  }

  if (clean === "DNS") {
    return "bg-slate-100 text-slate-700";
  }

  if (clean === "REVIEW") {
    return "bg-yellow-50 text-yellow-700";
  }

  return "bg-purple-50 text-purple-700";
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
  const [panelOpen, setPanelOpen] = useState(false);

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
  const progressValue = calculatePercent(finishedCount, registeredCount || quota || 1);
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
        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-purple-700" />
          <p className="mt-4 text-lg font-black">Memuat Live View Event...</p>
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
        <div className="mx-auto max-w-[960px] rounded-3xl border border-red-200 bg-red-50 p-8 text-center text-red-700">
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
        <div className="mx-auto max-w-[960px] rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-purple-50 text-purple-700">
            <ShieldCheck size={30} />
          </div>

          <h1 className="mt-5 text-2xl font-black">Akses Live View Terkunci</h1>

          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
            Live View Event hanya tersedia untuk peserta yang sudah terdaftar
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
    <main className="min-h-screen bg-[#f7f8fb] text-slate-950">
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex min-h-[88px] max-w-[1440px] flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-[40px] xl:px-[64px]">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setPanelOpen(true)}
              className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 lg:hidden"
              title="Buka panel"
            >
              <Menu size={21} />
            </button>

            <Link
              href={`/events/${eventId}`}
              className="hidden h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 sm:flex"
              title="Kembali ke event"
            >
              <ArrowLeft size={21} />
            </Link>

            <Link href="/" className="hidden items-center sm:flex">
              <img
                src="/amost_logo_wide_.png"
                alt="AMOST"
                className="h-[54px] w-auto object-contain"
              />
            </Link>

            <div className="min-w-0 border-slate-200 sm:border-l sm:pl-5">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-purple-700">
                Live View Event
              </p>
              <h1 className="truncate text-xl font-black text-slate-950 lg:text-2xl">
                {eventTitle}
              </h1>
              <p className="mt-1 hidden text-sm font-semibold text-slate-500 md:block">
                Pantau status event, peserta, results, dan akses doorprize.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => loadData(true)}
              disabled={refreshing}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 hover:bg-slate-50 disabled:opacity-70"
            >
              <RefreshCw size={17} className={refreshing ? "animate-spin" : ""} />
              Refresh
            </button>

            <Link
              href={`/events/${eventId}/results`}
              className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 hover:bg-slate-50"
            >
              Results
            </Link>

            <Link
              href={`/events/${eventId}/doorprize`}
              className="inline-flex h-11 items-center justify-center rounded-2xl bg-purple-700 px-4 text-sm font-black text-white hover:bg-purple-800"
            >
              Doorprize
            </Link>
          </div>
        </div>
      </header>

      <section className="grid min-h-[calc(100vh-88px)] grid-cols-1 gap-5 p-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="relative min-h-[680px] overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm lg:min-h-[calc(100vh-120px)]">
          <MapMockup />

          <EventCard
            event={event}
            eventTitle={eventTitle}
            registration={registration}
          />

          <ParticipantMiniPanel results={results} resultsError={resultsError} />

          <LiveStatusCard />

          <div className="absolute right-5 top-5 z-10 flex flex-col gap-3">
            <MapToolButton icon={Satellite} label="Satelit" />
            <MapToolButton icon={Layers} label="Layer" />
            <MapToolButton icon={Maximize2} label="Full Map" />
          </div>
        </section>

        <aside className="hidden space-y-5 xl:block">
          <LiveSidePanel
            eventId={eventId}
            event={event}
            results={results}
            resultsError={resultsError}
            finishedCount={finishedCount}
            registeredCount={registeredCount}
            quota={quota}
            progressValue={progressValue}
            routeDistance={routeDistance}
            leaderResult={leaderResult}
          />
        </aside>
      </section>

      <MobilePanel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        eventId={eventId}
        event={event}
        results={results}
        resultsError={resultsError}
        finishedCount={finishedCount}
        registeredCount={registeredCount}
        quota={quota}
        progressValue={progressValue}
        routeDistance={routeDistance}
        leaderResult={leaderResult}
      />
    </main>
  );
}

function EventCard({
  event,
  eventTitle,
  registration,
}: {
  event: PublicEvent | null;
  eventTitle: string;
  registration: Registration | null;
}) {
  return (
    <div className="absolute left-5 top-5 z-10 w-[calc(100%-40px)] max-w-[390px] rounded-[1.5rem] border border-slate-200 bg-white/95 p-5 shadow-xl backdrop-blur">
      <p className="text-xs font-black uppercase tracking-wide text-slate-500">
        Event Aktif
      </p>

      <div className="mt-3 flex items-start gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-100 text-purple-700">
          <Bike size={25} />
        </div>

        <div className="min-w-0">
          <h2 className="truncate text-lg font-black text-slate-950">
            {eventTitle}
          </h2>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            {formatDate(event?.event_date)} • {event?.location || "Lokasi menyusul"}
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-black uppercase text-green-700">
          {normalizeStatus(event?.status)}
        </span>

        <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-black uppercase text-purple-700">
          {registration?.participant_number || registration?.id || "Peserta"}
        </span>
      </div>
    </div>
  );
}

function MapMockup() {
  const checkpointPoints = [
    { x: 155, y: 525, label: "S" },
    { x: 315, y: 465, label: "1" },
    { x: 455, y: 382, label: "2" },
    { x: 592, y: 302, label: "3" },
    { x: 720, y: 216, label: "4" },
    { x: 846, y: 130, label: "F" },
  ];

  return (
    <div className="absolute inset-0 overflow-hidden bg-[#eef3f1]">
      <div className="absolute inset-0 opacity-[0.55]">
        <div className="h-full w-full bg-[linear-gradient(90deg,rgba(100,116,139,.14)_1px,transparent_1px),linear-gradient(0deg,rgba(100,116,139,.14)_1px,transparent_1px)] bg-[size:44px_44px]" />
      </div>

      <div className="absolute -left-24 top-4 h-[760px] w-[760px] rounded-full border border-slate-300/60" />
      <div className="absolute left-[28%] -top-28 h-[640px] w-[640px] rounded-full border border-slate-300/50" />
      <div className="absolute bottom-10 right-2 h-[520px] w-[520px] rounded-full border border-slate-300/50" />

      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 1000 700"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          d="M155 525 C226 511 255 455 315 465 C390 478 381 372 455 382 C530 394 520 295 592 302 C650 310 650 210 720 216 C778 222 780 132 846 130"
          fill="none"
          stroke="#7e22ce"
          strokeWidth="9"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        <path
          d="M155 525 C226 511 255 455 315 465 C390 478 381 372 455 382 C530 394 520 295 592 302 C650 310 650 210 720 216 C778 222 780 132 846 130"
          fill="none"
          stroke="#a855f7"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {checkpointPoints.map((point) => (
          <g key={point.label}>
            <circle
              cx={point.x}
              cy={point.y}
              r={19}
              fill="white"
              stroke="#7e22ce"
              strokeWidth="3"
            />
            <text
              x={point.x}
              y={point.y + 6}
              textAnchor="middle"
              fontSize="16"
              fontWeight="900"
              fill="#7e22ce"
            >
              {point.label}
            </text>
          </g>
        ))}

        <g>
          <circle cx="540" cy="335" r="42" fill="#2563eb" opacity="0.18" />
          <circle cx="540" cy="335" r="20" fill="#2563eb" />
          <path
            d="M540 313 L557 363 L540 351 L523 363 Z"
            fill="white"
            transform="rotate(35 540 335)"
          />
        </g>
      </svg>

      <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-white/25" />
      <MapLabel className="left-[25%] top-[20%]" label="Karanglewas" />
      <MapLabel className="left-[63%] top-[24%]" label="Kalisari" />
      <MapLabel className="right-[18%] top-[31%]" label="Purwokerto" />
      <MapLabel className="bottom-[20%] left-[38%]" label="Baturraden" />
    </div>
  );
}

function MapLabel({ label, className }: { label: string; className: string }) {
  return (
    <div
      className={`absolute rounded-full bg-white/60 px-3 py-1 text-xs font-bold text-slate-400 ${className}`}
    >
      {label}
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
      className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white/95 text-slate-700 shadow-sm backdrop-blur hover:bg-white"
      title={label}
    >
      <Icon size={20} />
    </button>
  );
}

function ParticipantMiniPanel({
  results,
  resultsError,
}: {
  results: EventResult[];
  resultsError: string;
}) {
  return (
    <div className="absolute bottom-5 left-5 z-10 hidden w-[340px] rounded-[1.5rem] border border-slate-200 bg-white/95 p-5 shadow-xl backdrop-blur md:block">
      <div className="flex items-center justify-between">
        <p className="text-sm font-black text-slate-950">
          Peserta / Results ({results.length})
        </p>

        <UsersRound size={18} className="text-purple-700" />
      </div>

      {resultsError ? (
        <div className="mt-4 rounded-2xl border border-yellow-200 bg-yellow-50 p-4 text-sm font-bold text-yellow-700">
          {resultsError}
        </div>
      ) : results.length === 0 ? (
        <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-center">
          <p className="text-sm font-black text-slate-950">
            Belum ada data tracking
          </p>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            Data live akan tampil setelah tracking tersambung.
          </p>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {results.slice(0, 5).map((item, index) => (
            <div
              key={String(item.result_id)}
              className={`flex items-center justify-between rounded-2xl p-3 ${
                index === 0 ? "bg-purple-50" : "bg-white"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-sm font-black text-purple-700 ring-1 ring-purple-100">
                  {index + 1}
                </div>

                <div>
                  <p className="text-sm font-black text-slate-950">
                    {item.full_name || "Tanpa Nama"}
                  </p>
                  <p className="text-xs font-bold text-slate-500">
                    {formatSpeed(item.avg_speed)} km/jam •{" "}
                    {formatDistance(item.distance)} km
                  </p>
                </div>
              </div>

              <span
                className={`rounded-full px-2 py-1 text-[10px] font-black uppercase ${getStatusBadgeClass(
                  item.result_status
                )}`}
              >
                {item.result_status || "REVIEW"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function LiveStatusCard() {
  return (
    <div className="absolute bottom-5 left-1/2 z-20 hidden w-[520px] -translate-x-1/2 rounded-[1.5rem] border border-slate-200 bg-white/95 p-5 shadow-xl backdrop-blur xl:block">
      <p className="text-center text-xs font-black uppercase tracking-wide text-slate-500">
        Live View Event
      </p>

      <div className="mt-3 flex items-center justify-center gap-6">
        <div className="flex flex-col items-center">
          <button
            type="button"
            className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-700"
          >
            <Clock3 size={24} />
          </button>
          <span className="mt-2 text-xs font-bold text-slate-500">Standby</span>
        </div>

        <div className="flex flex-col items-center">
          <button
            type="button"
            className="flex h-16 w-16 items-center justify-center rounded-full bg-purple-700 text-white"
          >
            <Navigation size={28} />
          </button>
          <span className="mt-2 text-xs font-bold text-slate-500">Live</span>
        </div>

        <div className="flex flex-col items-center">
          <button
            type="button"
            className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-700"
          >
            <Route size={24} />
          </button>
          <span className="mt-2 text-xs font-bold text-slate-500">Route</span>
        </div>
      </div>

      <p className="mt-3 text-center text-sm leading-6 text-slate-500">
        Ini halaman Live View Event. Kontrol start/stop tetap dilakukan dari aplikasi Android.
      </p>
    </div>
  );
}

function LiveSidePanel({
  eventId,
  event,
  results,
  resultsError,
  finishedCount,
  registeredCount,
  quota,
  progressValue,
  routeDistance,
  leaderResult,
}: {
  eventId: string;
  event: PublicEvent | null;
  results: EventResult[];
  resultsError: string;
  finishedCount: number;
  registeredCount: number;
  quota: number;
  progressValue: number;
  routeDistance: number;
  leaderResult: EventResult | null;
}) {
  return (
    <>
      <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-black text-slate-950">
            Statistik Real-time
          </h3>

          <span className="inline-flex items-center gap-2 rounded-full bg-green-50 px-3 py-1 text-xs font-black text-green-700">
            <span className="h-2 w-2 rounded-full bg-green-500" />
            Standby
          </span>
        </div>

        <div className="mt-5 grid grid-cols-2 overflow-hidden rounded-2xl border border-slate-200">
          <StatCell label="Jarak Rute" value={formatDistance(routeDistance)} unit="km" />
          <StatCell label="Durasi" value={formatDuration(leaderResult?.duration)} unit="jam" />
          <StatCell label="Kecepatan" value={formatSpeed(leaderResult?.avg_speed)} unit="km/h" />
          <StatCell label="Finish" value={String(finishedCount)} unit="orang" />
        </div>
      </section>

      <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-black text-slate-950">Progress Event</h3>
          <p className="text-sm font-black text-slate-500">{progressValue}%</p>
        </div>

        <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-purple-700"
            style={{ width: `${progressValue}%` }}
          />
        </div>

        <div className="mt-5 grid grid-cols-3 gap-3">
          <MiniStat label="Peserta" value={String(registeredCount)} />
          <MiniStat label="Finish" value={String(finishedCount)} />
          <MiniStat label="Kuota" value={quota ? String(quota) : "-"} />
        </div>

        <div className="mt-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-black text-slate-950">Check Point</p>
            <p className="text-sm font-bold text-slate-500">0 / 6</p>
          </div>

          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div key={item} className="flex flex-1 items-center">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-black ${
                    item === 1
                      ? "bg-purple-700 text-white"
                      : "border border-slate-200 bg-white text-slate-400"
                  }`}
                >
                  {item}
                </div>
                {item < 6 ? <div className="h-px flex-1 bg-slate-200" /> : null}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-black text-slate-950">Result Ringkas</h3>

          <Link
            href={`/events/${eventId}/results`}
            className="text-sm font-black text-purple-700 hover:text-purple-800"
          >
            Lihat
          </Link>
        </div>

        {resultsError ? (
          <div className="mt-4 rounded-2xl border border-yellow-200 bg-yellow-50 p-4 text-sm font-bold text-yellow-700">
            {resultsError}
          </div>
        ) : results.length === 0 ? (
          <div className="mt-4 rounded-2xl bg-slate-50 p-5 text-center">
            <Trophy className="mx-auto h-10 w-10 text-slate-300" />
            <p className="mt-3 text-sm font-black text-slate-950">
              Belum ada results
            </p>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {results.slice(0, 4).map((item, index) => (
              <div
                key={String(item.result_id)}
                className="flex items-center justify-between rounded-2xl bg-slate-50 p-3"
              >
                <div>
                  <p className="text-sm font-black text-slate-950">
                    {index + 1}. {item.full_name || "Tanpa Nama"}
                  </p>
                  <p className="mt-1 text-xs font-bold text-slate-500">
                    {item.participant_number || "-"} •{" "}
                    {formatDistance(item.distance)} KM
                  </p>
                </div>

                <span
                  className={`rounded-full px-3 py-1 text-[10px] font-black uppercase ${getStatusBadgeClass(
                    item.result_status
                  )}`}
                >
                  {item.result_status || "REVIEW"}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-lg font-black text-slate-950">Pintasan</h3>

        <div className="mt-4 grid grid-cols-3 gap-3">
          <ShortcutLink
            href={`/events/${eventId}`}
            icon={CalendarDays}
            label="Event"
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
        </div>
      </section>
    </>
  );
}

function MobilePanel({
  open,
  onClose,
  ...props
}: {
  open: boolean;
  onClose: () => void;
  eventId: string;
  event: PublicEvent | null;
  results: EventResult[];
  resultsError: string;
  finishedCount: number;
  registeredCount: number;
  quota: number;
  progressValue: number;
  routeDistance: number;
  leaderResult: EventResult | null;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] xl:hidden">
      <button
        type="button"
        aria-label="Tutup panel"
        className="absolute inset-0 bg-slate-950/50"
        onClick={onClose}
      />

      <aside className="absolute right-0 top-0 h-full w-[min(92vw,420px)] overflow-y-auto bg-slate-50 p-4 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-purple-700">
              Live Panel
            </p>
            <h2 className="text-xl font-black text-slate-950">Event Status</h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-5">
          <LiveSidePanel {...props} />
        </div>
      </aside>
    </div>
  );
}

function StatCell({
  label,
  value,
  unit,
}: {
  label: string;
  value: string;
  unit: string;
}) {
  return (
    <div className="border-b border-r border-slate-200 p-5 last:border-r-0">
      <p className="text-xs font-bold text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-black text-slate-950">{value}</p>
      <p className="mt-1 text-xs font-bold text-slate-500">{unit}</p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4 text-center">
      <p className="text-2xl font-black text-slate-950">{value}</p>
      <p className="mt-1 text-xs font-black uppercase text-slate-500">
        {label}
      </p>
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
      className="flex min-h-[82px] flex-col items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 px-3 py-4 text-center text-xs font-black text-slate-950 hover:bg-purple-700 hover:text-white"
    >
      <Icon size={23} />
      <span className="mt-2">{label}</span>
    </Link>
  );
}
