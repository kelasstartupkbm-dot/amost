"use client";

import AccountAppShell from "../../../components/AccountAppShell";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowLeft,
  Gauge,
  Loader2,
  RefreshCw,
  Timer,
  Trophy,
} from "lucide-react";

type PublicEvent = {
  id: number | string;
  title?: string | null;
  event_title?: string | null;
  name?: string | null;
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

function formatDate(value: string | null | undefined) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDistance(value: number | string | null | undefined) {
  const numberValue = Number(value || 0);
  if (!Number.isFinite(numberValue) || numberValue <= 0) return "-";
  return `${numberValue.toFixed(2)} KM`;
}

function formatSpeed(value: number | string | null | undefined) {
  const numberValue = Number(value || 0);
  if (!Number.isFinite(numberValue) || numberValue <= 0) return "-";
  return `${numberValue.toFixed(2)} km/jam`;
}

function formatDuration(value: number | string | null | undefined) {
  const seconds = Number(value || 0);

  if (!Number.isFinite(seconds) || seconds <= 0) return "-";

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  if (hours > 0) return `${hours} jam ${minutes} menit`;
  if (minutes > 0) return `${minutes} menit ${remainingSeconds > 0 ? `${remainingSeconds} detik` : ""}`.trim();

  return `${remainingSeconds} detik`;
}

function getBadgeClass(status: string | null | undefined) {
  const clean = String(status || "REVIEW").toUpperCase();

  if (clean === "FINISH") return "bg-green-50 text-green-700";
  if (clean === "DNF") return "bg-orange-50 text-orange-700";
  if (clean === "DNS") return "bg-slate-100 text-slate-700";
  if (clean === "REVIEW") return "bg-yellow-50 text-yellow-700";

  return "bg-purple-50 text-purple-700";
}

function getEventTitle(event: PublicEvent | null, eventId: string) {
  return (
    String(event?.title || event?.event_title || event?.name || "").trim() ||
    `Event #${eventId}`
  );
}

export default function EventResultsLoggedInPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = String(params?.id || "");

  const [event, setEvent] = useState<PublicEvent | null>(null);
  const [results, setResults] = useState<EventResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  async function loadData(silent = false) {
    if (!silent) {
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
        }),
      ]);

      const eventData = await eventResponse.json().catch(() => null);
      const resultsData = await resultsResponse.json().catch(() => null);

      if (eventResponse.ok && eventData?.ok !== false) {
        setEvent(eventData.event || eventData.data || null);
      }

      if (resultsResponse.status === 401) {
        router.replace(`/login?next=/events/${eventId}/results`);
        return;
      }

      if (!resultsResponse.ok || resultsData?.ok === false) {
        setResults([]);
        setErrorMessage(resultsData?.message || resultsData?.error || "Results belum bisa dimuat.");
        return;
      }

      const rows = Array.isArray(resultsData?.data)
        ? resultsData.data
        : Array.isArray(resultsData?.items)
          ? resultsData.items
          : [];

      setResults(rows);
    } catch (error) {
      console.error(error);
      setResults([]);
      setErrorMessage("Koneksi ke server bermasalah.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (eventId) {
      loadData();
    }
  }, [eventId]);

  const title = getEventTitle(event, eventId);

  const stats = useMemo(() => {
    const finishCount = results.filter(
      (item) => String(item.result_status || "").toUpperCase() === "FINISH",
    ).length;

    const totalDistance = results.reduce((sum, item) => {
      const value = Number(item.distance || 0);
      return Number.isFinite(value) ? sum + value : sum;
    }, 0);

    const avgSpeedRows = results
      .map((item) => Number(item.avg_speed || 0))
      .filter((value) => Number.isFinite(value) && value > 0);

    const avgSpeed =
      avgSpeedRows.length > 0
        ? avgSpeedRows.reduce((sum, value) => sum + value, 0) / avgSpeedRows.length
        : 0;

    return {
      total: results.length,
      finishCount,
      totalDistance,
      avgSpeed,
    };
  }, [results]);

  const rightPanel = (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-black text-slate-950">Results</h3>
        <Trophy className="text-purple-700" size={22} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-xs font-black uppercase text-slate-400">Peserta</p>
          <p className="mt-1 text-2xl font-black text-slate-950">{stats.total}</p>
        </div>
        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-xs font-black uppercase text-slate-400">Finish</p>
          <p className="mt-1 text-2xl font-black text-slate-950">{stats.finishCount}</p>
        </div>
      </div>

      <Link
        href={`/events/${eventId}`}
        className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-sm font-black text-slate-700 hover:bg-slate-50"
      >
        <ArrowLeft size={17} />
        Detail Event
      </Link>
    </section>
  );

  return (
    <AccountAppShell
      active="events"
      title="Results Event"
      eyebrow="AMOST RESULTS"
      description={`Hasil peserta event ${title}.`}
      icon={Trophy}
      rightPanel={rightPanel}
    >
      <section className="space-y-5">
        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 rounded-2xl bg-purple-50 px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-purple-700">
            Account Layout Active · Results
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
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 hover:bg-slate-50"
            >
              <RefreshCw size={17} />
              Refresh
            </button>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <StatCard icon={Trophy} label="Total Result" value={String(stats.total)} />
          <StatCard icon={Activity} label="Total Jarak" value={`${stats.totalDistance.toFixed(2)} KM`} />
          <StatCard icon={Gauge} label="Rata-rata Speed" value={stats.avgSpeed > 0 ? `${stats.avgSpeed.toFixed(2)} km/jam` : "-"} />
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          {loading ? (
            <div className="flex min-h-[240px] flex-col items-center justify-center text-center">
              <Loader2 className="h-12 w-12 animate-spin text-purple-700" />
              <p className="mt-4 text-xl font-black text-slate-950">Memuat results...</p>
            </div>
          ) : errorMessage ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm font-black text-red-700">
              {errorMessage}
            </div>
          ) : results.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center">
              <Trophy className="mx-auto h-12 w-12 text-slate-300" />
              <h2 className="mt-4 text-2xl font-black text-slate-950">Belum Ada Results</h2>
              <p className="mt-2 text-sm text-slate-500">
                Hasil event akan muncul setelah peserta menyelesaikan tracking.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[920px] border-separate border-spacing-y-3 text-left">
                <thead>
                  <tr className="text-xs font-black uppercase tracking-wide text-slate-400">
                    <th className="px-4 py-2">Nomor</th>
                    <th className="px-4 py-2">Peserta</th>
                    <th className="px-4 py-2">Jarak</th>
                    <th className="px-4 py-2">Durasi</th>
                    <th className="px-4 py-2">Speed</th>
                    <th className="px-4 py-2">Status</th>
                    <th className="px-4 py-2">Submit</th>
                  </tr>
                </thead>

                <tbody>
                  {results.map((item) => (
                    <tr
                      key={String(item.result_id || `${item.user_id}-${item.event_id}`)}
                      className="rounded-2xl bg-slate-50 text-sm"
                    >
                      <td className="rounded-l-2xl px-4 py-4 font-black text-purple-700">
                        {item.participant_number || "-"}
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-black text-slate-950">
                          {item.full_name || "Tanpa Nama"}
                        </p>
                        <p className="mt-1 text-xs font-semibold text-slate-500">
                          {item.email || "-"}
                        </p>
                      </td>
                      <td className="px-4 py-4 font-black text-slate-950">
                        {formatDistance(item.distance)}
                      </td>
                      <td className="px-4 py-4 font-semibold text-slate-600">
                        <span className="inline-flex items-center gap-2">
                          <Timer size={16} />
                          {formatDuration(item.duration)}
                        </span>
                      </td>
                      <td className="px-4 py-4 font-semibold text-slate-600">
                        {formatSpeed(item.avg_speed)}
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-black uppercase ${getBadgeClass(item.result_status)}`}>
                          {item.result_status || "REVIEW"}
                        </span>
                      </td>
                      <td className="rounded-r-2xl px-4 py-4 font-semibold text-slate-600">
                        {formatDate(item.submitted_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </section>
    </AccountAppShell>
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
      <p className="mt-5 text-xs font-black uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-2xl font-black text-slate-950">{value}</p>
    </section>
  );
}
