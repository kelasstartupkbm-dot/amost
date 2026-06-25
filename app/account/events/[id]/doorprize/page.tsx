"use client";

import AccountAppShell from "../../../../components/AccountAppShell";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Gift,
  Loader2,
  RefreshCw,
  Sparkles,
  Trophy,
  UsersRound,
} from "lucide-react";

type PublicEvent = {
  id: number | string;
  title?: string | null;
  name?: string | null;
  event_title?: string | null;
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

function getEventTitle(event: PublicEvent | null, eventId: string) {
  return (
    String(event?.title || event?.event_title || event?.name || "").trim() ||
    `Event #${eventId}`
  );
}

export default function EventDoorprizeLoggedInPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = String(params?.id || "");

  const [event, setEvent] = useState<PublicEvent | null>(null);
  const [winners, setWinners] = useState<DoorprizeWinner[]>([]);
  const [eligibleTotal, setEligibleTotal] = useState(0);
  const [participantTotal, setParticipantTotal] = useState(0);
  const [canDraw, setCanDraw] = useState(false);

  const [loading, setLoading] = useState(true);
  const [drawLoading, setDrawLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [drawMessage, setDrawMessage] = useState("");

  const [prizeName, setPrizeName] = useState("Doorprize");
  const [prizeNotes, setPrizeNotes] = useState("");

  async function loadData(silent = false) {
    if (!silent) {
      setLoading(true);
    }

    setErrorMessage("");

    try {
      const response = await fetch(`/api/events/${eventId}/doorprize`, {
        method: "GET",
        cache: "no-store",
        credentials: "include",
      });

      const data = await response.json().catch(() => null);

      if (response.status === 401) {
        router.replace(`/login?next=/account/events/${eventId}/doorprize`);
        return;
      }

      if (!response.ok || data?.ok === false) {
        setWinners([]);
        setCanDraw(false);
        setEligibleTotal(0);
        setParticipantTotal(0);
        setErrorMessage(
          data?.message ||
            data?.error ||
            "Doorprize belum bisa dimuat.",
        );
        return;
      }

      setEvent(data?.event || null);
      setWinners(Array.isArray(data?.winners) ? data.winners : []);
      setCanDraw(Boolean(data?.canDraw));
      setEligibleTotal(Number(data?.eligibleTotal || 0));
      setParticipantTotal(Number(data?.participantTotal || 0));
    } catch (error) {
      console.error(error);
      setWinners([]);
      setCanDraw(false);
      setEligibleTotal(0);
      setParticipantTotal(0);
      setErrorMessage("Koneksi ke server bermasalah.");
    } finally {
      setLoading(false);
    }
  }

  async function drawDoorprize() {
    const confirmed = window.confirm("Yakin ingin mengundi doorprize dari peserta eligible?");

    if (!confirmed) return;

    setDrawLoading(true);
    setErrorMessage("");
    setDrawMessage("");

    try {
      const response = await fetch(`/api/official/events/${eventId}/doorprize`, {
        method: "POST",
        cache: "no-store",
        credentials: "include",
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
        setErrorMessage(data?.message || data?.error || "Gagal mengundi doorprize.");
        return;
      }

      if (data?.winner?.full_name) {
        setDrawMessage(
          `Pemenang: ${data.winner.participant_number || "-"} - ${data.winner.full_name}`,
        );
      } else {
        setDrawMessage(data?.message || "Doorprize berhasil diundi.");
      }

      await loadData(true);
    } catch (error) {
      console.error(error);
      setErrorMessage("Koneksi ke server bermasalah.");
    } finally {
      setDrawLoading(false);
    }
  }

  useEffect(() => {
    if (eventId) {
      loadData();
    }
  }, [eventId]);

  const title = getEventTitle(event, eventId);
  const latestWinner = winners[0] || null;

  const rightPanel = (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-black text-slate-950">Doorprize</h3>
        <Gift className="text-purple-700" size={22} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-xs font-black uppercase text-slate-400">Eligible</p>
          <p className="mt-1 text-2xl font-black text-slate-950">{eligibleTotal}</p>
        </div>
        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-xs font-black uppercase text-slate-400">Pemenang</p>
          <p className="mt-1 text-2xl font-black text-slate-950">{winners.length}</p>
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
      title="Doorprize Event"
      eyebrow="AMOST DOORPRIZE"
      description={`Halaman undian dan riwayat pemenang doorprize untuk ${title}.`}
      icon={Gift}
      rightPanel={rightPanel}
    >
      <section className="rounded-[2rem] border border-slate-900/10 bg-slate-950 p-5 text-white shadow-sm lg:p-8">
        <div className="mb-4 rounded-2xl border border-green-400/20 bg-green-400/10 px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-green-300">
          Account Layout Active · Doorprize
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href={`/events/${eventId}`}
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-black text-white hover:bg-white/10"
          >
            <ArrowLeft size={18} />
            Detail Event
          </Link>

          <button
            type="button"
            onClick={() => loadData(true)}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-black text-white hover:bg-white/10"
          >
            <RefreshCw size={17} />
            Refresh
          </button>
        </div>

        <section className="mt-6 rounded-[2rem] border border-white/10 bg-gradient-to-br from-green-500/20 via-slate-900 to-purple-600/20 p-6 shadow-2xl lg:p-10">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.28em] text-green-400">
                AMOST Doorprize
              </p>

              <h2 className="mt-4 text-4xl font-black leading-tight text-white lg:text-6xl">
                Undian Doorprize
              </h2>

              <p className="mt-4 max-w-3xl text-base leading-7 text-slate-300">
                Peserta terdaftar bisa melihat hasil doorprize. Tombol undi hanya muncul untuk Official Event, Staff AMOST, atau Super Admin.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 lg:min-w-[360px]">
              <div className="rounded-3xl border border-white/10 bg-white/10 p-6">
                <UsersRound className="h-9 w-9 text-green-400" />
                <p className="mt-5 text-4xl font-black">{eligibleTotal}</p>
                <p className="mt-1 text-sm font-bold text-slate-300">Eligible</p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/10 p-6">
                <Trophy className="h-9 w-9 text-yellow-300" />
                <p className="mt-5 text-4xl font-black">{winners.length}</p>
                <p className="mt-1 text-sm font-bold text-slate-300">Pemenang</p>
              </div>
            </div>
          </div>
        </section>

        {loading ? (
          <section className="mt-6 flex min-h-[300px] flex-col items-center justify-center rounded-[2rem] border border-white/10 bg-white/5 text-center">
            <Loader2 className="h-12 w-12 animate-spin text-green-400" />
            <p className="mt-4 text-xl font-black">Memuat doorprize...</p>
          </section>
        ) : errorMessage ? (
          <section className="mt-6 rounded-[2rem] border border-red-500/30 bg-red-500/10 p-6 text-red-200">
            <p className="font-black">{errorMessage}</p>
          </section>
        ) : (
          <>
            <section className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 lg:col-span-2">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-yellow-300 text-slate-950">
                  <Gift size={34} />
                </div>

                <p className="mt-6 text-sm font-black uppercase tracking-[0.24em] text-yellow-300">
                  Pemenang Terbaru
                </p>

                {latestWinner ? (
                  <div className="mt-4">
                    <p className="text-5xl font-black leading-tight text-white">
                      {latestWinner.participant_number || "-"}
                    </p>
                    <p className="mt-3 text-3xl font-black text-green-300">
                      {latestWinner.full_name || "Tanpa Nama"}
                    </p>
                    <p className="mt-2 text-base font-bold text-slate-300">
                      {latestWinner.prize_name || "Doorprize"} • {formatDate(latestWinner.drawn_at)}
                    </p>
                  </div>
                ) : (
                  <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-8 text-center">
                    <p className="text-2xl font-black text-white">Belum Ada Pemenang</p>
                    <p className="mt-2 text-sm text-slate-300">
                      Doorprize belum diundi untuk event ini.
                    </p>
                  </div>
                )}
              </div>

              {canDraw ? (
                <div className="rounded-[2rem] border border-green-400/30 bg-green-400/10 p-6">
                  <p className="text-sm font-black uppercase tracking-wide text-green-300">
                    Panel Official
                  </p>
                  <h3 className="mt-2 text-2xl font-black">Jalankan Undian</h3>

                  <label className="mt-5 block text-xs font-black uppercase text-slate-300">
                    Nama Hadiah
                  </label>
                  <input
                    value={prizeName}
                    onChange={(event) => setPrizeName(event.target.value)}
                    className="mt-2 h-12 w-full rounded-xl border border-white/10 bg-white px-4 text-sm font-bold text-slate-950 outline-none"
                    placeholder="Contoh: Botol minum"
                  />

                  <label className="mt-4 block text-xs font-black uppercase text-slate-300">
                    Catatan
                  </label>
                  <textarea
                    value={prizeNotes}
                    onChange={(event) => setPrizeNotes(event.target.value)}
                    className="mt-2 min-h-[92px] w-full rounded-xl border border-white/10 bg-white px-4 py-3 text-sm font-bold text-slate-950 outline-none"
                    placeholder="Opsional"
                  />

                  <button
                    type="button"
                    disabled={drawLoading || eligibleTotal === 0}
                    onClick={drawDoorprize}
                    className="mt-5 flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-green-500 px-4 text-base font-black text-slate-950 hover:bg-green-400 disabled:cursor-not-allowed disabled:bg-slate-600 disabled:text-slate-300"
                  >
                    {drawLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles size={20} />}
                    {drawLoading ? "Mengundi..." : "Undi Doorprize"}
                  </button>

                  {drawMessage ? (
                    <div className="mt-5 rounded-xl border border-green-300/30 bg-green-300/10 p-4 text-sm font-black text-green-200">
                      {drawMessage}
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
                  <Gift className="h-12 w-12 text-green-400" />
                  <h3 className="mt-5 text-2xl font-black">Mode Peserta</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    Kamu bisa melihat hasil doorprize. Undian dijalankan oleh Official Event.
                  </p>
                </div>
              )}
            </section>

            <section className="mt-6 rounded-[2rem] border border-white/10 bg-white/5 p-6">
              <h3 className="text-2xl font-black text-white">Riwayat Pemenang</h3>

              {winners.length === 0 ? (
                <div className="mt-5 rounded-3xl border border-white/10 bg-white/5 p-8 text-center text-slate-300">
                  Belum ada riwayat pemenang.
                </div>
              ) : (
                <div className="mt-5 overflow-x-auto">
                  <table className="w-full min-w-[860px] border-separate border-spacing-y-3 text-left">
                    <thead>
                      <tr className="text-xs font-black uppercase tracking-wide text-slate-400">
                        <th className="px-4 py-2">Nomor</th>
                        <th className="px-4 py-2">Pemenang</th>
                        <th className="px-4 py-2">Hadiah</th>
                        <th className="px-4 py-2">Catatan</th>
                        <th className="px-4 py-2">Diundi</th>
                        <th className="px-4 py-2">Oleh</th>
                      </tr>
                    </thead>

                    <tbody>
                      {winners.map((winner) => (
                        <tr key={String(winner.id)} className="rounded-2xl bg-white/10 text-sm">
                          <td className="rounded-l-2xl px-4 py-4 font-black text-green-300">
                            {winner.participant_number || "-"}
                          </td>
                          <td className="px-4 py-4">
                            <p className="font-black text-white">
                              {winner.full_name || "Tanpa Nama"}
                            </p>
                            <p className="mt-1 text-xs font-semibold text-slate-400">
                              {winner.email || "-"}
                            </p>
                          </td>
                          <td className="px-4 py-4 font-black text-white">
                            {winner.prize_name || "Doorprize"}
                          </td>
                          <td className="px-4 py-4 font-semibold text-slate-300">
                            {winner.notes || "-"}
                          </td>
                          <td className="px-4 py-4 font-semibold text-slate-300">
                            {formatDate(winner.drawn_at)}
                          </td>
                          <td className="rounded-r-2xl px-4 py-4 font-black text-white">
                            {winner.drawn_by_name || "-"}
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
