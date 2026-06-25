"use client";

import AccountAppShell from "../../../../components/AccountAppShell";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowLeft,
  Bike,
  CircleDot,
  Clock3,
  Gauge,
  Gift,
  Layers,
  Loader2,
  MapPin,
  Maximize2,
  Navigation,
  RefreshCw,
  Route,
  Satellite,
  Trophy,
  UsersRound,
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
  distance_km?: number | string | null;
};

type EventResult = {
  result_id?: number | string;
  event_id?: number | string;
  user_id?: number | string;
  full_name?: string | null;
  email?: string | null;
  participant_number?: string | null;
  distance?: number | string | null;
  duration?: number | string | null;
  avg_speed?: number | string | null;
  result_status?: string | null;
  submitted_at?: string | null;
};

function formatDate(value: string | null | undefined) {
  if (!value) return "Tanggal menyusul";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDuration(value: number | string | null | undefined) {
  const seconds = Number(value || 0);

  if (!Number.isFinite(seconds) || seconds <= 0) return "-";

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  if (hours > 0) return `${hours} jam ${minutes} menit`;
  if (minutes > 0) return `${minutes} menit`;

  return `${remainingSeconds} detik`;
}

function formatDistance(value: number | string | null | undefined) {
  const numberValue = Number(value || 0);

  if (!Number.isFinite(numberValue) || numberValue <= 0) return "0.00 KM";

  return `${numberValue.toFixed(2)} KM`;
}

function getEventTitle(event: PublicEvent | null, eventId: string) {
  return (
    String(event?.title || event?.event_title || event?.name || "").trim() ||
    `Event #${eventId}`
  );
}

function getStatusLabel(event: PublicEvent | null) {
  const clean = String(event?.status || "live").toLowerCase();

  if (clean === "published") return "Aktif";
  if (clean === "active") return "Aktif";
  if (clean === "live") return "Live";
  if (clean === "draft") return "Draft";

  return clean ? clean.toUpperCase() : "Aktif";
}

function calculatePercent(value: number, total: number) {
  if (!Number.isFinite(value) || !Number.isFinite(total) || total <= 0) return 0;

  return Math.min(100, Math.max(0, Math.round((value / total) * 100)));
}

export default function AccountEventLiveViewPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = String(params?.id || "");

  const [event, setEvent] = useState<PublicEvent | null>(null);
  const [results, setResults] = useState<EventResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const title = getEventTitle(event, eventId);

  const stats = useMemo(() => {
    const participantCount = Number(event?.participant_count || 0);
    const quota = Number(event?.quota || 0);

    const finishCount = results.filter(
      (item) => String(item.result_status || "").toUpperCase() === "FINISH",
    ).length;

    const totalDistance = results.reduce((sum, item) => {
      const value = Number(item.distance || 0);
      return Number.isFinite(value) ? sum + value : sum;
    }, 0);

    const speedRows = results
      .map((item) => Number(item.avg_speed || 0))
      .filter((value) => Number.isFinite(value) && value > 0);

    const avgSpeed =
      speedRows.length > 0
        ? speedRows.reduce((sum, value) => sum + value, 0) / speedRows.length
        : 0;

    return {
      participantCount,
      quota,
      finishCount,
      totalDistance,
      avgSpeed,
      progress: calculatePercent(finishCount, participantCount || quota || 1),
      liveCount: Math.max(0, participantCount - finishCount),
    };
  }, [event, results]);

  const loadData = async (silent = false) => {
    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setErrorMessage("");

    try {
      const [eventResponse, resultsResponse] = await Promise.all([
        fetch(`/api/events/${eventId}`, {
          method: "GET",
          cache: "no-store",
          credentials: "include",
        }),
        fetch(`/api/events/${eventId}/results`, {
          method: "GET",
          cache: "no-store",
          credentials: "include",
        }).catch(() => null),
      ]);

      const eventData = await eventResponse.json().catch(() => null);

      if (eventResponse.status === 401) {
        router.replace(`/login?next=/account/events/${eventId}/view`);
        return;
      }

      if (!eventResponse.ok || eventData?.ok === false) {
        setEvent(null);
        setResults([]);
        setErrorMessage(eventData?.message || eventData?.error || "Event belum bisa dimuat.");
        return;
      }

      setEvent(eventData?.event || eventData?.data || null);

      if (resultsResponse) {
        const resultsData = await resultsResponse.json().catch(() => null);
        const rows = Array.isArray(resultsData?.data)
          ? resultsData.data
          : Array.isArray(resultsData?.items)
            ? resultsData.items
            : [];
        setResults(rows);
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
  };

  useEffect(() => {
    if (eventId) {
      loadData();
    }
  }, [eventId]);

  const rightPanel = (
    <section className="space-y-4">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-lg font-black text-slate-950">Live Tracking</h3>
          <Satellite className="text-purple-700" size={22} />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-xs font-black uppercase text-slate-400">Peserta</p>
            <p className="mt-1 text-2xl font-black text-slate-950">{stats.participantCount}</p>
          </div>

          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-xs font-black uppercase text-slate-400">Finish</p>
            <p className="mt-1 text-2xl font-black text-slate-950">{stats.finishCount}</p>
          </div>
        </div>

        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between text-sm font-black">
            <span className="text-slate-950">Progress</span>
            <span className="text-purple-700">{stats.progress}%</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-purple-700"
              style={{ width: `${stats.progress}%` }}
            />
          </div>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2">
          <QuickLink href={`/account/events/${eventId}/view`} icon={Navigation} label="Live" />
          <QuickLink href={`/account/events/${eventId}/results`} icon={Trophy} label="Results" />
          <QuickLink href={`/account/events/${eventId}/doorprize`} icon={Gift} label="Doorprize" />
        </div>
      </section>

      <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-lg font-black text-slate-950">Event</h3>
        <p className="mt-2 text-sm font-semibold text-slate-500">{title}</p>
        <p className="mt-1 text-sm font-semibold text-slate-500">
          {formatDate(event?.event_date)} · {event?.location || "Lokasi menyusul"}
        </p>

        <Link
          href={`/events/${eventId}`}
          className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-sm font-black text-slate-700 hover:bg-slate-50"
        >
          <ArrowLeft size={17} />
          Detail Event
        </Link>
      </section>
    </section>
  );

  return (
    <AccountAppShell
      active="tracking"
      title="Tracking Live"
      eyebrow="AMOST LIVE"
      description={`Live tracking event ${title}.`}
      icon={Satellite}
      rightPanel={rightPanel}
    >
      <section className="space-y-5">
        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 rounded-2xl bg-purple-50 px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-purple-700">
            Account Layout Active · Live Tracking
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link
              href={`/events/${eventId}`}
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 hover:bg-slate-50"
            >
              <ArrowLeft size={18} />
              Detail Event
            </Link>

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
        </section>

        {loading ? (
          <section className="flex min-h-[420px] flex-col items-center justify-center rounded-[2rem] border border-slate-200 bg-white text-center shadow-sm">
            <Loader2 className="h-12 w-12 animate-spin text-purple-700" />
            <p className="mt-4 text-xl font-black text-slate-950">Memuat live tracking...</p>
            <p className="mt-2 text-sm text-slate-500">Mengambil data event dan hasil peserta.</p>
          </section>
        ) : errorMessage ? (
          <section className="rounded-[2rem] border border-red-200 bg-red-50 p-6 text-sm font-black text-red-700">
            {errorMessage}
          </section>
        ) : (
          <>
            <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <StatCard icon={UsersRound} label="Peserta" value={String(stats.participantCount)} />
              <StatCard icon={Trophy} label="Finish" value={String(stats.finishCount)} />
              <StatCard icon={Activity} label="Total Jarak" value={formatDistance(stats.totalDistance)} />
              <StatCard
                icon={Gauge}
                label="Avg Speed"
                value={stats.avgSpeed > 0 ? `${stats.avgSpeed.toFixed(2)} km/jam` : "-"}
              />
            </section>

            <section className="relative min-h-[620px] overflow-hidden rounded-[2rem] border border-slate-200 bg-[#edf2f3] shadow-sm">
              <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.06)_1px,transparent_1px)] bg-[size:44px_44px]" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_45%_40%,rgba(124,58,237,0.16),transparent_25%),radial-gradient(circle_at_80%_10%,rgba(14,165,233,0.12),transparent_22%)]" />

              <div className="absolute left-6 top-6 z-10 max-w-md rounded-[1.5rem] border border-slate-200 bg-white/95 p-5 shadow-lg backdrop-blur">
                <p className="text-xs font-black uppercase tracking-wide text-slate-400">Event Aktif</p>
                <h2 className="mt-2 text-2xl font-black text-slate-950">{title}</h2>
                <p className="mt-1 text-sm font-semibold text-slate-500">
                  {formatDate(event?.event_date)} · {event?.location || "Lokasi menyusul"}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-black uppercase text-green-700">
                    {getStatusLabel(event)}
                  </span>
                  <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-black uppercase text-purple-700">
                    {stats.participantCount}/{stats.quota || "-"} Peserta
                  </span>
                </div>
              </div>

              <div className="absolute right-6 top-6 z-10 flex flex-col gap-3">
                <MapButton icon={Satellite} label="GPS" />
                <MapButton icon={Layers} label="Layer" />
                <MapButton icon={Maximize2} label="Full" />
              </div>

              <svg
                className="absolute inset-0 h-full w-full"
                viewBox="0 0 1000 620"
                preserveAspectRatio="none"
              >
                <path
                  d="M120 510 C210 455 250 440 310 360 C375 272 430 344 485 246 C535 160 610 286 680 176 C732 96 785 138 872 70"
                  fill="none"
                  stroke="rgba(126, 34, 206, 0.95)"
                  strokeWidth="12"
                  strokeLinecap="round"
                />
                <path
                  d="M120 510 C210 455 250 440 310 360 C375 272 430 344 485 246 C535 160 610 286 680 176 C732 96 785 138 872 70"
                  fill="none"
                  stroke="rgba(196, 181, 253, 0.9)"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
              </svg>

              <CheckpointMarker label="S" left="10%" top="78%" />
              <CheckpointMarker label="1" left="28%" top="62%" />
              <CheckpointMarker label="2" left="45%" top="45%" />
              <CheckpointMarker label="3" left="57%" top="34%" />
              <CheckpointMarker label="4" left="70%" top="27%" />
              <CheckpointMarker label="F" left="86%" top="12%" />

              <div className="absolute left-[47%] top-[43%] z-10">
                <div className="relative">
                  <div className="absolute -inset-7 rounded-full bg-blue-500/20" />
                  <div className="relative flex h-16 w-16 rotate-45 items-center justify-center rounded-[1.5rem] bg-blue-600 text-white shadow-xl">
                    <Navigation className="-rotate-45" size={28} />
                  </div>
                </div>
              </div>

              <div className="absolute bottom-6 left-6 z-10 rounded-[1.5rem] border border-slate-200 bg-white/95 p-5 shadow-lg backdrop-blur">
                <p className="text-xs font-black uppercase tracking-wide text-slate-400">Catatan</p>
                <p className="mt-2 max-w-md text-sm font-semibold leading-6 text-slate-600">
                  Tampilan ini sudah memakai layout akun. Data map real-time akan dihubungkan pada Stage 3E dari tabel tracking/live positions.
                </p>
              </div>
            </section>

            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-xl font-black text-slate-950">Live/Result Ringkas</h3>

              {results.length === 0 ? (
                <div className="mt-4 rounded-2xl bg-slate-50 p-6 text-center text-sm font-bold text-slate-500">
                  Belum ada result dari peserta.
                </div>
              ) : (
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full min-w-[760px] border-separate border-spacing-y-3 text-left">
                    <thead>
                      <tr className="text-xs font-black uppercase tracking-wide text-slate-400">
                        <th className="px-4 py-2">Nomor</th>
                        <th className="px-4 py-2">Peserta</th>
                        <th className="px-4 py-2">Jarak</th>
                        <th className="px-4 py-2">Durasi</th>
                        <th className="px-4 py-2">Speed</th>
                        <th className="px-4 py-2">Status</th>
                      </tr>
                    </thead>

                    <tbody>
                      {results.slice(0, 8).map((item) => (
                        <tr
                          key={String(item.result_id || `${item.user_id}-${item.event_id}`)}
                          className="bg-slate-50 text-sm"
                        >
                          <td className="rounded-l-2xl px-4 py-4 font-black text-purple-700">
                            {item.participant_number || "-"}
                          </td>
                          <td className="px-4 py-4">
                            <p className="font-black text-slate-950">{item.full_name || "Tanpa Nama"}</p>
                            <p className="mt-1 text-xs font-semibold text-slate-500">{item.email || "-"}</p>
                          </td>
                          <td className="px-4 py-4 font-black text-slate-950">{formatDistance(item.distance)}</td>
                          <td className="px-4 py-4 font-semibold text-slate-600">{formatDuration(item.duration)}</td>
                          <td className="px-4 py-4 font-semibold text-slate-600">
                            {Number(item.avg_speed || 0) > 0
                              ? `${Number(item.avg_speed || 0).toFixed(2)} km/jam`
                              : "-"}
                          </td>
                          <td className="rounded-r-2xl px-4 py-4">
                            <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-black uppercase text-purple-700">
                              {item.result_status || "REVIEW"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}
      </section>
    </AccountAppShell>
  );
}

function QuickLink({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: any;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex h-20 flex-col items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 text-xs font-black text-slate-700 hover:bg-purple-50 hover:text-purple-700"
    >
      <Icon size={22} />
      {label}
    </Link>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: string;
}) {
  return (
    <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-50 text-purple-700">
        <Icon size={24} />
      </div>
      <p className="mt-5 text-xs font-black uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-black text-slate-950">{value}</p>
    </section>
  );
}

function MapButton({
  icon: Icon,
  label,
}: {
  icon: any;
  label: string;
}) {
  return (
    <button
      type="button"
      className="flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200 bg-white/95 text-slate-700 shadow-lg backdrop-blur"
      title={label}
    >
      <Icon size={22} />
    </button>
  );
}

function CheckpointMarker({
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
      className="absolute z-10 flex h-12 w-12 items-center justify-center rounded-full border-4 border-purple-700 bg-white text-lg font-black text-purple-700 shadow"
      style={{ left, top }}
    >
      {label}
    </div>
  );
}
