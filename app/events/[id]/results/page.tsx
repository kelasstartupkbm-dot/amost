"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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

  if (hours > 0) {
    if (remainingSeconds > 0) {
      return `${hours} jam ${minutes} menit ${remainingSeconds} detik`;
    }

    return `${hours} jam ${minutes} menit`;
  }

  if (minutes > 0) {
    if (remainingSeconds > 0) {
      return `${minutes} menit ${remainingSeconds} detik`;
    }

    return `${minutes} menit`;
  }

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

export default function PublicEventResultsPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = String(params?.id || "");

  const [event, setEvent] = useState<PublicEvent | null>(null);
  const [results, setResults] = useState<EventResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  async function loadData() {
    setLoading(true);
    setErrorMessage("");

    try {
      const [eventResponse, resultsResponse] = await Promise.all([
        fetch(`/api/events/${eventId}`, { method: "GET", cache: "no-store" }),
        fetch(`/api/events/${eventId}/results`, {
          method: "GET",
          cache: "no-store",
        }),
      ]);

      const eventData = await eventResponse.json().catch(() => null);
      const resultsData = await resultsResponse.json().catch(() => null);

      if (eventResponse.ok && eventData?.ok !== false) {
        setEvent(eventData.event || eventData.data || null);
      }

      if (resultsResponse.status === 401) {
        router.push(`/login?next=/events/${eventId}/results`);
        return;
      }

      if (!resultsResponse.ok || resultsData?.ok === false) {
        setResults([]);
        setErrorMessage(
          resultsData?.message ||
            resultsData?.error ||
            "Results belum bisa dimuat."
        );
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
    loadData();
  }, [eventId]);

  const title = event?.title || `Event #${eventId}`;

  return (
    <main className="min-h-[calc(100vh-92px)] bg-slate-50 text-slate-950">

      <section className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 lg:px-[88px]">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Link
            href={`/events/${eventId}`}
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 hover:bg-slate-50"
          >
            <ArrowLeft size={18} />
            Detail Event
          </Link>

          <button
            type="button"
            onClick={loadData}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw size={17} />
            Refresh
          </button>
        </div>
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-100 text-purple-700">
              <Trophy size={30} />
            </div>

            <div>
              <p className="text-sm font-black uppercase tracking-wide text-purple-700">
                Results
              </p>
              <h2 className="mt-1 text-3xl font-black text-slate-950">
                Hasil Tracking Event
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Hanya peserta terdaftar, official, Staff AMOST, dan Super Admin yang bisa mengakses.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          {loading ? (
            <div className="flex min-h-[260px] flex-col items-center justify-center text-center">
              <Loader2 className="h-10 w-10 animate-spin text-purple-700" />
              <p className="mt-4 text-lg font-black">Memuat results...</p>
            </div>
          ) : errorMessage ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm font-bold text-red-700">
              {errorMessage}
            </div>
          ) : results.length === 0 ? (
            <div className="flex min-h-[260px] flex-col items-center justify-center text-center">
              <Activity className="h-12 w-12 text-slate-300" />
              <h3 className="mt-4 text-2xl font-black text-slate-950">
                Belum Ada Results
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                Belum ada hasil tracking untuk event ini.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] border-separate border-spacing-y-3 text-left">
                <thead>
                  <tr className="text-xs font-black uppercase tracking-wide text-slate-500">
                    <th className="px-4 py-2">Nomor</th>
                    <th className="px-4 py-2">Peserta</th>
                    <th className="px-4 py-2">Distance</th>
                    <th className="px-4 py-2">Duration</th>
                    <th className="px-4 py-2">Avg Speed</th>
                    <th className="px-4 py-2">Status</th>
                    <th className="px-4 py-2">Submit</th>
                  </tr>
                </thead>

                <tbody>
                  {results.map((item) => (
                    <tr
                      key={String(item.result_id)}
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
                        <span className="inline-flex items-center gap-2">
                          <Activity size={15} />
                          {formatDistance(item.distance)}
                        </span>
                      </td>
                      <td className="px-4 py-4 font-black text-slate-950">
                        <span className="inline-flex items-center gap-2">
                          <Timer size={15} />
                          {formatDuration(item.duration)}
                        </span>
                      </td>
                      <td className="px-4 py-4 font-black text-slate-950">
                        <span className="inline-flex items-center gap-2">
                          <Gauge size={15} />
                          {formatSpeed(item.avg_speed)}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-black uppercase ${getBadgeClass(
                            item.result_status
                          )}`}
                        >
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
    </main>
  );
}
