"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowLeft,
  CalendarDays,
  Gift,
  Gauge,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Ticket,
  Timer,
  Trophy,
  UsersRound,
} from "lucide-react";

type OfficialAccess = {
  id: number;
  event_id: number | string;
  user_id: number | string;
  permission_level: string;
  status: string;
  notes?: string | null;
  event_title?: string | null;
  event_name?: string | null;
  event_status?: string | null;
  category?: string | null;
  location?: string | null;
  quota?: number | string | null;
  doorprize_count?: number | string | null;
};

type Participant = {
  registration_id: number | string;
  event_id: number | string;
  user_id: number | string;
  full_name?: string | null;
  email?: string | null;
  participant_number?: string | null;
  registration_status?: string | null;
  registered_at?: string | null;
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

type DoorprizeEligible = {
  registration_id: number | string;
  event_id: number | string;
  user_id: number | string;
  participant_number?: string | null;
  full_name?: string | null;
  email?: string | null;
};

type DoorprizeWinner = {
  id: number | string;
  event_id: number | string;
  user_id: number | string;
  participant_number?: string | null;
  prize_name?: string | null;
  notes?: string | null;
  drawn_by?: number | string | null;
  drawn_at?: string | null;
  full_name?: string | null;
  email?: string | null;
  drawn_by_name?: string | null;
};

function getEventTitle(item: OfficialAccess) {
  return item.event_title || item.event_name || `Event #${item.event_id}`;
}

function formatPermission(value: string | null | undefined) {
  const permission = String(value || "operator").toLowerCase();

  if (permission === "result") return "Result Officer";
  if (permission === "doorprize") return "Doorprize Officer";
  if (permission === "viewer") return "Viewer";

  return "Operator Event";
}

function formatDate(value: string | null | undefined) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

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

  if (!Number.isFinite(numberValue) || numberValue <= 0) {
    return "-";
  }

  return `${numberValue.toFixed(2)} KM`;
}

function formatSpeed(value: number | string | null | undefined) {
  const numberValue = Number(value || 0);

  if (!Number.isFinite(numberValue) || numberValue <= 0) {
    return "-";
  }

  return `${numberValue.toFixed(2)} km/jam`;
}

function formatDuration(value: number | string | null | undefined) {
  const seconds = Number(value || 0);

  if (!Number.isFinite(seconds) || seconds <= 0) {
    return "-";
  }

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

function getResultBadgeClass(status: string | null | undefined) {
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

export default function OfficialEventDetailPage() {
  const params = useParams();
  const router = useRouter();

  const eventId = String(params?.id || "");

  const [items, setItems] = useState<OfficialAccess[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [results, setResults] = useState<EventResult[]>([]);
  const [eligibleDoorprize, setEligibleDoorprize] = useState<DoorprizeEligible[]>([]);
  const [doorprizeWinners, setDoorprizeWinners] = useState<DoorprizeWinner[]>([]);

  const [loading, setLoading] = useState(true);
  const [participantsLoading, setParticipantsLoading] = useState(true);
  const [resultsLoading, setResultsLoading] = useState(true);
  const [doorprizeLoading, setDoorprizeLoading] = useState(true);
  const [drawLoading, setDrawLoading] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [participantsError, setParticipantsError] = useState("");
  const [resultsError, setResultsError] = useState("");
  const [doorprizeError, setDoorprizeError] = useState("");
  const [doorprizeMessage, setDoorprizeMessage] = useState("");

  const [prizeName, setPrizeName] = useState("Doorprize");
  const [prizeNotes, setPrizeNotes] = useState("");

  const eventAccess = useMemo(() => {
    return items.find((item) => String(item.event_id) === eventId) || null;
  }, [items, eventId]);

  async function loadAccess() {
    setLoading(true);
    setErrorMessage("");

    try {
      const response = await fetch("/api/account/event-officials", {
        method: "GET",
        cache: "no-store",
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || data?.ok === false) {
        setItems([]);
        setErrorMessage(
          data?.message ||
            data?.error ||
            "Akses Official Event belum bisa dimuat."
        );
        return;
      }

      const rows = Array.isArray(data?.data)
        ? data.data
        : Array.isArray(data?.items)
          ? data.items
          : [];

      setItems(rows);
    } catch (error) {
      console.error(error);
      setItems([]);
      setErrorMessage("Koneksi ke server bermasalah.");
    } finally {
      setLoading(false);
    }
  }

  async function loadParticipants() {
    setParticipantsLoading(true);
    setParticipantsError("");

    try {
      const response = await fetch(
        `/api/official/events/${eventId}/participants`,
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const data = await response.json().catch(() => null);

      if (!response.ok || data?.ok === false) {
        setParticipants([]);
        setParticipantsError(
          data?.message || data?.error || "Data peserta belum bisa dimuat."
        );
        return;
      }

      const rows = Array.isArray(data?.data)
        ? data.data
        : Array.isArray(data?.items)
          ? data.items
          : [];

      setParticipants(rows);
    } catch (error) {
      console.error(error);
      setParticipants([]);
      setParticipantsError("Koneksi ke server bermasalah.");
    } finally {
      setParticipantsLoading(false);
    }
  }

  async function loadResults() {
    setResultsLoading(true);
    setResultsError("");

    try {
      const response = await fetch(`/api/official/events/${eventId}/results`, {
        method: "GET",
        cache: "no-store",
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || data?.ok === false) {
        setResults([]);
        setResultsError(
          data?.message || data?.error || "Data results belum bisa dimuat."
        );
        return;
      }

      const rows = Array.isArray(data?.data)
        ? data.data
        : Array.isArray(data?.items)
          ? data.items
          : [];

      setResults(rows);
    } catch (error) {
      console.error(error);
      setResults([]);
      setResultsError("Koneksi ke server bermasalah.");
    } finally {
      setResultsLoading(false);
    }
  }

  async function loadDoorprize() {
    setDoorprizeLoading(true);
    setDoorprizeError("");
    setDoorprizeMessage("");

    try {
      const response = await fetch(`/api/official/events/${eventId}/doorprize`, {
        method: "GET",
        cache: "no-store",
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || data?.ok === false) {
        setEligibleDoorprize([]);
        setDoorprizeWinners([]);
        setDoorprizeError(
          data?.message || data?.error || "Data doorprize belum bisa dimuat."
        );
        return;
      }

      setEligibleDoorprize(Array.isArray(data?.eligible) ? data.eligible : []);
      setDoorprizeWinners(Array.isArray(data?.winners) ? data.winners : []);
    } catch (error) {
      console.error(error);
      setEligibleDoorprize([]);
      setDoorprizeWinners([]);
      setDoorprizeError("Koneksi ke server bermasalah.");
    } finally {
      setDoorprizeLoading(false);
    }
  }

  async function drawDoorprize() {
    const confirmed = window.confirm(
      "Yakin ingin mengundi doorprize dari peserta eligible?"
    );

    if (!confirmed) return;

    setDrawLoading(true);
    setDoorprizeError("");
    setDoorprizeMessage("");

    try {
      const response = await fetch(`/api/official/events/${eventId}/doorprize`, {
        method: "POST",
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prizeName,
          notes: prizeNotes,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || data?.ok === false) {
        setDoorprizeError(
          data?.message || data?.error || "Gagal mengundi doorprize."
        );
        return;
      }

      setDoorprizeMessage(data?.message || "Doorprize berhasil diundi.");
      setEligibleDoorprize(Array.isArray(data?.eligible) ? data.eligible : []);
      setDoorprizeWinners(Array.isArray(data?.winners) ? data.winners : []);

      if (data?.winner?.full_name) {
        setDoorprizeMessage(
          `Pemenang: ${data.winner.participant_number || "-"} - ${data.winner.full_name}`
        );
      }
    } catch (error) {
      console.error(error);
      setDoorprizeError("Koneksi ke server bermasalah.");
    } finally {
      setDrawLoading(false);
    }
  }

  useEffect(() => {
    loadAccess();
  }, []);

  useEffect(() => {
    if (eventId) {
      loadParticipants();
      loadResults();
      loadDoorprize();
    }
  }, [eventId]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-950">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-green-700" />
          <p className="mt-4 text-lg font-black">Memuat panel official...</p>
          <p className="mt-2 text-sm text-slate-500">
            Mengambil data event yang ditugaskan.
          </p>
        </div>
      </main>
    );
  }

  if (errorMessage) {
    return (
      <main className="min-h-screen bg-slate-50 p-6 text-slate-950">
        <div className="mx-auto max-w-[960px] rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
          <p className="font-black">{errorMessage}</p>
          <button
            type="button"
            onClick={() => router.push("/official")}
            className="mt-4 rounded-xl bg-red-700 px-5 py-3 text-sm font-black text-white"
          >
            Kembali
          </button>
        </div>
      </main>
    );
  }

  if (!eventAccess) {
    return (
      <main className="min-h-screen bg-slate-50 p-6 text-slate-950">
        <div className="mx-auto max-w-[960px] rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-700">
            <ShieldCheck size={30} />
          </div>

          <h1 className="mt-5 text-2xl font-black">
            Akses Event Tidak Ditemukan
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Akun ini tidak memiliki akses official untuk Event ID {eventId}.
          </p>

          <Link
            href="/official"
            className="mt-5 inline-flex h-11 items-center justify-center rounded-xl bg-green-700 px-5 text-sm font-black text-white"
          >
            Kembali ke Panel Official
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
              href="/official"
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
              <p className="text-xs font-black uppercase tracking-[0.22em] text-green-700">
                Official Event
              </p>
              <h1 className="mt-1 text-2xl font-black leading-tight text-slate-950">
                {getEventTitle(eventAccess)}
              </h1>
              <p className="mt-1 max-w-xl text-sm font-medium leading-6 text-slate-500">
                Panel kelola terbatas untuk event yang ditugaskan.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => {
                loadAccess();
                loadParticipants();
                loadResults();
                loadDoorprize();
              }}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 hover:bg-slate-50"
            >
              <RefreshCw size={17} />
              Refresh
            </button>

            <Link
              href="/official"
              className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 hover:bg-slate-50"
            >
              Panel Official
            </Link>

            <Link
              href="/account"
              className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 hover:bg-slate-50"
            >
              Akun Saya
            </Link>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 lg:px-[88px]">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-wide text-green-700">
                Event Ditugaskan
              </p>

              <h2 className="mt-2 text-3xl font-black text-slate-950">
                {getEventTitle(eventAccess)}
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                Event ID: {eventAccess.event_id}
              </p>
            </div>

            <div className="rounded-2xl bg-green-50 px-5 py-4">
              <p className="text-xs font-black uppercase text-green-700">
                Level Akses
              </p>

              <p className="mt-1 text-lg font-black text-green-800">
                {formatPermission(eventAccess.permission_level)}
              </p>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-6">
            <InfoCard
              icon={CalendarDays}
              label="Status Event"
              value={eventAccess.event_status || "-"}
            />

            <InfoCard
              icon={Ticket}
              label="Kuota"
              value={String(eventAccess.quota || 0)}
            />

            <InfoCard
              icon={Gift}
              label="Doorprize"
              value={String(doorprizeWinners.length)}
            />

            <InfoCard
              icon={ShieldCheck}
              label="Status Akses"
              value={eventAccess.status || "active"}
            />

            <InfoCard
              icon={UsersRound}
              label="Peserta"
              value={String(participants.length)}
            />

            <InfoCard
              icon={Activity}
              label="Results"
              value={String(results.length)}
            />
          </div>
        </section>

        <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-200 pb-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-wide text-green-700">
                Kelola Peserta
              </p>

              <h3 className="mt-1 text-2xl font-black text-slate-950">
                Peserta Event
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Daftar peserta yang terdaftar pada event ini.
              </p>
            </div>

            <button
              type="button"
              onClick={loadParticipants}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 hover:bg-slate-50"
            >
              <RefreshCw size={17} />
              Refresh Peserta
            </button>
          </div>

          {participantsLoading ? (
            <div className="flex min-h-[240px] flex-col items-center justify-center text-center">
              <Loader2 className="h-10 w-10 animate-spin text-green-700" />
              <p className="mt-4 text-lg font-black text-slate-950">
                Memuat peserta...
              </p>
            </div>
          ) : participantsError ? (
            <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm font-bold text-red-700">
              {participantsError}
            </div>
          ) : participants.length === 0 ? (
            <EmptyState
              icon={UsersRound}
              title="Belum Ada Peserta"
              description="Belum ada peserta yang terdaftar pada event ini."
            />
          ) : (
            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[760px] border-separate border-spacing-y-3 text-left">
                <thead>
                  <tr className="text-xs font-black uppercase tracking-wide text-slate-500">
                    <th className="px-4 py-2">Nomor</th>
                    <th className="px-4 py-2">Peserta</th>
                    <th className="px-4 py-2">Email</th>
                    <th className="px-4 py-2">Status</th>
                    <th className="px-4 py-2">Daftar</th>
                    <th className="px-4 py-2">User ID</th>
                  </tr>
                </thead>

                <tbody>
                  {participants.map((participant) => (
                    <tr
                      key={String(participant.registration_id)}
                      className="rounded-2xl bg-slate-50 text-sm"
                    >
                      <td className="rounded-l-2xl px-4 py-4 font-black text-green-700">
                        {participant.participant_number || "-"}
                      </td>

                      <td className="px-4 py-4 font-black text-slate-950">
                        {participant.full_name || "Tanpa Nama"}
                      </td>

                      <td className="px-4 py-4 font-semibold text-slate-600">
                        {participant.email || "-"}
                      </td>

                      <td className="px-4 py-4">
                        <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-black uppercase text-green-700">
                          {participant.registration_status || "registered"}
                        </span>
                      </td>

                      <td className="px-4 py-4 font-semibold text-slate-600">
                        {formatDate(participant.registered_at)}
                      </td>

                      <td className="rounded-r-2xl px-4 py-4 font-black text-slate-950">
                        {participant.user_id}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-200 pb-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-wide text-green-700">
                Results Event
              </p>

              <h3 className="mt-1 text-2xl font-black text-slate-950">
                Hasil Tracking Event
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Data hasil peserta pada event ini. Untuk tahap ini masih
                view-only.
              </p>
            </div>

            <button
              type="button"
              onClick={loadResults}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 hover:bg-slate-50"
            >
              <RefreshCw size={17} />
              Refresh Results
            </button>
          </div>

          {resultsLoading ? (
            <div className="flex min-h-[240px] flex-col items-center justify-center text-center">
              <Loader2 className="h-10 w-10 animate-spin text-green-700" />
              <p className="mt-4 text-lg font-black text-slate-950">
                Memuat results...
              </p>
            </div>
          ) : resultsError ? (
            <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm font-bold text-red-700">
              {resultsError}
            </div>
          ) : results.length === 0 ? (
            <EmptyState
              icon={Activity}
              title="Belum Ada Results"
              description="Belum ada hasil tracking untuk event ini."
            />
          ) : (
            <div className="mt-5 overflow-x-auto">
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
                      <td className="rounded-l-2xl px-4 py-4 font-black text-green-700">
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
                          className={`rounded-full px-3 py-1 text-xs font-black uppercase ${getResultBadgeClass(
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

        <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-200 pb-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-wide text-green-700">
                Doorprize
              </p>

              <h3 className="mt-1 text-2xl font-black text-slate-950">
                Undian Doorprize
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Undi pemenang dari peserta yang sudah terdaftar. Peserta yang
                sudah menang tidak akan ikut undian berikutnya.
              </p>
            </div>

            <button
              type="button"
              onClick={loadDoorprize}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 hover:bg-slate-50"
            >
              <RefreshCw size={17} />
              Refresh Doorprize
            </button>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-3">
            <div className="rounded-2xl border border-green-100 bg-green-50 p-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-green-700">
                <Gift size={24} />
              </div>

              <p className="mt-4 text-xs font-black uppercase text-green-700">
                Peserta Eligible
              </p>

              <p className="mt-2 text-3xl font-black text-green-900">
                {eligibleDoorprize.length}
              </p>

              <p className="mt-2 text-sm leading-6 text-green-800">
                Peserta yang masih bisa ikut undian.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-slate-700">
                <Trophy size={24} />
              </div>

              <p className="mt-4 text-xs font-black uppercase text-slate-500">
                Total Pemenang
              </p>

              <p className="mt-2 text-3xl font-black text-slate-950">
                {doorprizeWinners.length}
              </p>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                Riwayat pemenang tersimpan di database.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <label className="text-xs font-black uppercase text-slate-500">
                Nama Hadiah
              </label>

              <input
                value={prizeName}
                onChange={(event) => setPrizeName(event.target.value)}
                className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-900 outline-none focus:border-green-700"
                placeholder="Contoh: Botol minum / Jersey / Voucher"
              />

              <label className="mt-4 block text-xs font-black uppercase text-slate-500">
                Catatan
              </label>

              <textarea
                value={prizeNotes}
                onChange={(event) => setPrizeNotes(event.target.value)}
                className="mt-2 min-h-[78px] w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-green-700"
                placeholder="Opsional"
              />

              <button
                type="button"
                disabled={drawLoading || eligibleDoorprize.length === 0}
                onClick={drawDoorprize}
                className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-green-700 px-4 text-sm font-black text-white hover:bg-green-800 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {drawLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Sparkles size={18} />
                )}
                {drawLoading ? "Mengundi..." : "Undi Doorprize"}
              </button>
            </div>
          </div>

          {doorprizeError ? (
            <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm font-bold text-red-700">
              {doorprizeError}
            </div>
          ) : null}

          {doorprizeMessage ? (
            <div className="mt-5 rounded-2xl border border-green-200 bg-green-50 p-5 text-sm font-black text-green-800">
              {doorprizeMessage}
            </div>
          ) : null}

          {doorprizeLoading ? (
            <div className="flex min-h-[200px] flex-col items-center justify-center text-center">
              <Loader2 className="h-10 w-10 animate-spin text-green-700" />
              <p className="mt-4 text-lg font-black text-slate-950">
                Memuat doorprize...
              </p>
            </div>
          ) : doorprizeWinners.length === 0 ? (
            <EmptyState
              icon={Gift}
              title="Belum Ada Pemenang"
              description="Belum ada pemenang doorprize untuk event ini."
            />
          ) : (
            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[860px] border-separate border-spacing-y-3 text-left">
                <thead>
                  <tr className="text-xs font-black uppercase tracking-wide text-slate-500">
                    <th className="px-4 py-2">Nomor</th>
                    <th className="px-4 py-2">Pemenang</th>
                    <th className="px-4 py-2">Hadiah</th>
                    <th className="px-4 py-2">Catatan</th>
                    <th className="px-4 py-2">Diundi</th>
                    <th className="px-4 py-2">Oleh</th>
                  </tr>
                </thead>

                <tbody>
                  {doorprizeWinners.map((winner) => (
                    <tr
                      key={String(winner.id)}
                      className="rounded-2xl bg-slate-50 text-sm"
                    >
                      <td className="rounded-l-2xl px-4 py-4 font-black text-green-700">
                        {winner.participant_number || "-"}
                      </td>

                      <td className="px-4 py-4">
                        <p className="font-black text-slate-950">
                          {winner.full_name || "Tanpa Nama"}
                        </p>
                        <p className="mt-1 text-xs font-semibold text-slate-500">
                          {winner.email || "-"}
                        </p>
                      </td>

                      <td className="px-4 py-4 font-black text-slate-950">
                        {winner.prize_name || "Doorprize"}
                      </td>

                      <td className="px-4 py-4 font-semibold text-slate-600">
                        {winner.notes || "-"}
                      </td>

                      <td className="px-4 py-4 font-semibold text-slate-600">
                        {formatDate(winner.drawn_at)}
                      </td>

                      <td className="rounded-r-2xl px-4 py-4 font-black text-slate-950">
                        {winner.drawn_by_name || "-"}
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

function InfoCard({
  icon: Icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-100 text-green-700">
        <Icon size={22} />
      </div>

      <p className="mt-4 text-xs font-black uppercase tracking-wide text-slate-500">
        {label}
      </p>

      <p className="mt-2 text-xl font-black text-slate-950">{value}</p>
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: any;
  title: string;
  description: string;
}) {
  return (
    <div className="flex min-h-[220px] flex-col items-center justify-center text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-700">
        <Icon size={30} />
      </div>

      <h4 className="mt-5 text-xl font-black text-slate-950">{title}</h4>

      <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
        {description}
      </p>
    </div>
  );
}
