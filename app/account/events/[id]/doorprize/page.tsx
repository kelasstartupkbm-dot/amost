"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type ElementType } from "react";
import {
  Activity,
  Bell,
  CalendarDays,
  CheckCircle2,
  CloudSun,
  Download,
  Eye,
  Gift,
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
  Sparkles,
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
  id?: number | string;
  title?: string | null;
  event_title?: string | null;
  name?: string | null;
  event_date?: string | null;
  location?: string | null;
  status?: string | null;
  participant_count?: number | string | null;
  quota?: number | string | null;
};

type DoorprizeWinner = {
  id?: number | string;
  event_id?: number | string;
  user_id?: number | string;
  participant_number?: string | null;
  bib_number?: string | null;
  prize_name?: string | null;
  prizeName?: string | null;
  notes?: string | null;
  note?: string | null;
  drawn_by?: number | string | null;
  drawn_at?: string | null;
  created_at?: string | null;
  full_name?: string | null;
  name?: string | null;
  username?: string | null;
  email?: string | null;
  drawn_by_name?: string | null;
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

function getWinnerName(winner: DoorprizeWinner | null | undefined) {
  return String(winner?.full_name || winner?.name || winner?.username || "Tanpa Nama").trim();
}

function getWinnerNumber(winner: DoorprizeWinner | null | undefined) {
  return String(winner?.participant_number || winner?.bib_number || "-").trim() || "-";
}

function getPrizeName(winner: DoorprizeWinner | null | undefined) {
  return String(winner?.prize_name || winner?.prizeName || "Doorprize").trim() || "Doorprize";
}

function getPrizeNotes(winner: DoorprizeWinner | null | undefined) {
  return String(winner?.notes || winner?.note || "-").trim() || "-";
}

function getDrawnAt(winner: DoorprizeWinner | null | undefined) {
  return winner?.drawn_at || winner?.created_at || null;
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

function formatEventDate(value?: string | null) {
  if (!value) return "Tanggal event belum tersedia";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return String(value);

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

function sortWinners(rows: DoorprizeWinner[]) {
  return [...rows].sort((a, b) => {
    const aTime = new Date(getDrawnAt(a) || "").getTime() || 0;
    const bTime = new Date(getDrawnAt(b) || "").getTime() || 0;

    return bTime - aTime;
  });
}

export default function AccountEventDoorprizePage() {
  const params = useParams();
  const router = useRouter();
  const eventId = String(params?.id || "");

  const [user, setUser] = useState<CurrentUser | null>(null);
  const [event, setEvent] = useState<PublicEvent | null>(null);
  const [winners, setWinners] = useState<DoorprizeWinner[]>([]);
  const [eligibleTotal, setEligibleTotal] = useState(0);
  const [participantTotal, setParticipantTotal] = useState(0);
  const [canDraw, setCanDraw] = useState(false);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [drawLoading, setDrawLoading] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [drawMessage, setDrawMessage] = useState("");

  const [prizeName, setPrizeName] = useState("Doorprize");
  const [prizeNotes, setPrizeNotes] = useState("");

  async function loadData(silent = false) {
    if (silent) setRefreshing(true);
    else setLoading(true);

    setErrorMessage("");

    try {
      const [meResponse, doorprizeResponse] = await Promise.all([
        fetchJsonWithTimeout("/api/auth/me", { method: "GET" }, 6000).catch(() => null),
        fetchJsonWithTimeout(`/api/events/${eventId}/doorprize`, { method: "GET" }, 8000),
      ]);

      if (meResponse?.response.status === 401 || doorprizeResponse.response.status === 401) {
        router.replace(`/login?next=/account/events/${eventId}/doorprize`);
        return;
      }

      if (meResponse?.response.ok && meResponse.data?.user) {
        setUser(meResponse.data.user);
      }

      if (!doorprizeResponse.response.ok || doorprizeResponse.data?.ok === false) {
        setWinners([]);
        setCanDraw(false);
        setEligibleTotal(0);
        setParticipantTotal(0);
        setErrorMessage(
          doorprizeResponse.data?.message ||
            doorprizeResponse.data?.error ||
            "Doorprize belum bisa dimuat.",
        );
        return;
      }

      const nextEvent = doorprizeResponse.data?.event || doorprizeResponse.data?.data?.event || null;
      const nextWinners = Array.isArray(doorprizeResponse.data?.winners)
        ? doorprizeResponse.data.winners
        : Array.isArray(doorprizeResponse.data?.data?.winners)
          ? doorprizeResponse.data.data.winners
          : [];

      setEvent(nextEvent);
      setWinners(nextWinners);
      setCanDraw(Boolean(doorprizeResponse.data?.canDraw || doorprizeResponse.data?.can_draw));
      setEligibleTotal(Number(doorprizeResponse.data?.eligibleTotal || doorprizeResponse.data?.eligible_total || 0));
      setParticipantTotal(
        Number(
          doorprizeResponse.data?.participantTotal ||
            doorprizeResponse.data?.participant_total ||
            nextEvent?.participant_count ||
            0,
        ),
      );
    } catch (error) {
      console.error(error);
      setWinners([]);
      setCanDraw(false);
      setEligibleTotal(0);
      setParticipantTotal(0);
      setErrorMessage("Koneksi ke server bermasalah.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function drawDoorprize() {
    const cleanPrizeName = prizeName.trim() || "Doorprize";

    const confirmed = window.confirm(`Yakin ingin mengundi ${cleanPrizeName} dari peserta eligible?`);

    if (!confirmed) return;

    setDrawLoading(true);
    setErrorMessage("");
    setDrawMessage("");

    try {
      const { response, data } = await fetchJsonWithTimeout(
        `/api/official/events/${eventId}/doorprize`,
        {
          method: "POST",
          cache: "no-store",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            prizeName: cleanPrizeName,
            notes: prizeNotes.trim(),
          }),
        },
        10000,
      );

      if (response.status === 401) {
        router.replace(`/login?next=/account/events/${eventId}/doorprize`);
        return;
      }

      if (!response.ok || data?.ok === false) {
        setErrorMessage(data?.message || data?.error || "Gagal mengundi doorprize.");
        return;
      }

      const winner = data?.winner || data?.data?.winner || null;

      if (winner?.full_name || winner?.name) {
        setDrawMessage(`Pemenang: ${getWinnerNumber(winner)} - ${getWinnerName(winner)}`);
      } else {
        setDrawMessage(data?.message || "Doorprize berhasil diundi.");
      }

      setPrizeNotes("");
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
  const displayName = getDisplayName(user);
  const initials = getInitials(displayName);
  const roleLabel = formatRole(user?.role);
  const sortedWinners = useMemo(() => sortWinners(winners), [winners]);
  const latestWinner = sortedWinners[0] || null;
  const remainingEligible = Math.max(0, eligibleTotal - winners.length);
  const winnerProgress = participantTotal > 0
    ? Math.min(100, Math.round((winners.length / participantTotal) * 100))
    : 0;

  return (
    <main className="min-h-screen bg-[#f7f8fb] text-slate-950">
      <DoorprizeSidebar />

      <section className="min-h-screen lg:pl-[260px]">
        <DoorprizeTopbar
          title="Doorprize Event"
          subtitle={`Undian dan riwayat pemenang doorprize untuk ${title}.`}
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
              <p className="mt-4 text-xl font-black text-slate-950">Memuat doorprize...</p>
              <p className="mt-2 text-sm text-slate-500">Mengambil data event, eligible peserta, dan riwayat pemenang.</p>
            </section>
          ) : errorMessage ? (
            <section className="xl:col-span-2 rounded-[2rem] border border-red-200 bg-red-50 p-6 text-red-800 shadow-sm">
              <h2 className="text-lg font-black">Doorprize belum bisa dimuat</h2>
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
                      <p className="text-xs font-black uppercase tracking-[0.22em] text-purple-700">AMOST Doorprize</p>
                      <h1 className="mt-2 text-3xl font-black text-slate-950">{title}</h1>
                      <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
                        Peserta dapat melihat hasil doorprize. Undian dijalankan oleh Official Event, Staff AMOST, atau Super Admin.
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
                  <SummaryCard icon={UsersRound} title="Total Peserta" value={String(participantTotal)} note="Peserta event" />
                  <SummaryCard icon={CheckCircle2} title="Eligible" value={String(eligibleTotal)} note="Bisa diundi" />
                  <SummaryCard icon={Trophy} title="Pemenang" value={String(winners.length)} note="Sudah terundi" />
                  <SummaryCard icon={Gift} title="Sisa Eligible" value={String(remainingEligible)} note="Belum menang" />
                </section>

                <section className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.7fr)]">
                  <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-slate-950 p-6 text-white shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-300 text-slate-950">
                        <Gift size={26} />
                      </div>
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.22em] text-yellow-300">Pemenang Terbaru</p>
                        <h2 className="mt-1 text-2xl font-black text-white">Latest Winner</h2>
                      </div>
                    </div>

                    {latestWinner ? (
                      <div className="mt-8 rounded-[2rem] border border-white/10 bg-white/5 p-6">
                        <p className="text-6xl font-black leading-none text-yellow-300">
                          {getWinnerNumber(latestWinner)}
                        </p>
                        <h3 className="mt-5 text-3xl font-black text-white">{getWinnerName(latestWinner)}</h3>
                        <p className="mt-2 text-base font-bold text-slate-300">{latestWinner.email || "-"}</p>

                        <div className="mt-6 grid gap-3 md:grid-cols-3">
                          <WinnerInfo label="Hadiah" value={getPrizeName(latestWinner)} />
                          <WinnerInfo label="Diundi" value={formatDate(getDrawnAt(latestWinner))} />
                          <WinnerInfo label="Oleh" value={latestWinner.drawn_by_name || "-"} />
                        </div>
                      </div>
                    ) : (
                      <div className="mt-8 rounded-[2rem] border border-white/10 bg-white/5 p-10 text-center">
                        <Sparkles className="mx-auto h-14 w-14 text-yellow-300" />
                        <h3 className="mt-5 text-3xl font-black text-white">Belum Ada Pemenang</h3>
                        <p className="mx-auto mt-3 max-w-[420px] text-sm font-semibold leading-6 text-slate-300">
                          Doorprize belum diundi untuk event ini. Pemenang terbaru akan tampil besar di panel ini.
                        </p>
                      </div>
                    )}
                  </section>

                  {canDraw ? (
                    <section className="rounded-[2rem] border border-green-200 bg-green-50 p-5 shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-green-100 text-green-700">
                          <Sparkles size={23} />
                        </div>
                        <div>
                          <p className="text-xs font-black uppercase text-green-700">Panel Official</p>
                          <h3 className="text-xl font-black text-slate-950">Jalankan Undian</h3>
                        </div>
                      </div>

                      <label className="mt-5 block text-xs font-black uppercase text-slate-500">
                        Nama Hadiah
                      </label>
                      <input
                        value={prizeName}
                        onChange={(event) => setPrizeName(event.target.value)}
                        className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-950 outline-none focus:border-green-400"
                        placeholder="Contoh: Botol minum"
                      />

                      <label className="mt-4 block text-xs font-black uppercase text-slate-500">
                        Catatan
                      </label>
                      <textarea
                        value={prizeNotes}
                        onChange={(event) => setPrizeNotes(event.target.value)}
                        className="mt-2 min-h-[98px] w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-950 outline-none focus:border-green-400"
                        placeholder="Opsional"
                      />

                      <button
                        type="button"
                        disabled={drawLoading || eligibleTotal === 0}
                        onClick={drawDoorprize}
                        className="mt-5 flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-4 text-base font-black text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                      >
                        {drawLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles size={20} />}
                        {drawLoading ? "Mengundi..." : "Undi Doorprize"}
                      </button>

                      {drawMessage ? (
                        <div className="mt-5 rounded-xl border border-green-200 bg-white p-4 text-sm font-black text-green-700">
                          {drawMessage}
                        </div>
                      ) : null}

                      <p className="mt-4 text-xs font-semibold leading-5 text-slate-500">
                        Sistem akan memilih peserta eligible secara acak dan menyimpan riwayat pemenang.
                      </p>
                    </section>
                  ) : (
                    <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-50 text-purple-700">
                        <Gift size={26} />
                      </div>
                      <h3 className="mt-5 text-2xl font-black text-slate-950">Mode Peserta</h3>
                      <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
                        Kamu bisa melihat hasil doorprize. Tombol undi hanya tersedia untuk Official Event, Staff AMOST, atau Super Admin.
                      </p>

                      <div className="mt-5 rounded-2xl bg-slate-50 p-4">
                        <p className="text-xs font-black uppercase text-slate-400">Status</p>
                        <p className="mt-1 text-xl font-black text-slate-950">View Only</p>
                      </div>
                    </section>
                  )}
                </section>

                <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-50 text-purple-700">
                        <Trophy size={23} />
                      </div>
                      <div>
                        <h2 className="text-xl font-black text-slate-950">Riwayat Pemenang</h2>
                        <p className="text-sm font-semibold text-slate-500">Daftar peserta yang sudah memenangkan doorprize.</p>
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
                    <table className="w-full min-w-[920px] text-left text-sm">
                      <thead className="bg-white">
                        <tr className="border-b border-slate-200 text-xs font-black uppercase tracking-wide text-slate-500">
                          <th className="px-4 py-4">No</th>
                          <th className="px-4 py-4">Nomor</th>
                          <th className="px-4 py-4">Pemenang</th>
                          <th className="px-4 py-4">Hadiah</th>
                          <th className="px-4 py-4">Catatan</th>
                          <th className="px-4 py-4">Diundi</th>
                          <th className="px-4 py-4">Oleh</th>
                        </tr>
                      </thead>

                      <tbody>
                        {sortedWinners.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="px-4 py-16">
                              <div className="flex flex-col items-center justify-center text-center">
                                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-300">
                                  <Gift size={30} />
                                </div>
                                <h2 className="mt-4 text-2xl font-black text-slate-950">Belum ada riwayat pemenang.</h2>
                                <p className="mt-2 max-w-[420px] text-sm font-semibold leading-6 text-slate-500">
                                  Pemenang doorprize akan muncul setelah official menjalankan undian.
                                </p>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          sortedWinners.map((winner, index) => (
                            <tr key={String(winner.id || `${winner.user_id}-${index}`)} className="border-b border-slate-100 last:border-b-0">
                              <td className="px-4 py-4">
                                <div className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-black ${
                                  index === 0 ? "bg-purple-700 text-white" : "bg-slate-100 text-slate-700"
                                }`}>
                                  {index + 1}
                                </div>
                              </td>

                              <td className="px-4 py-4 font-black text-purple-700">
                                {getWinnerNumber(winner)}
                              </td>

                              <td className="px-4 py-4">
                                <p className="font-black text-slate-950">{getWinnerName(winner)}</p>
                                <p className="mt-1 text-xs font-semibold text-slate-500">{winner.email || "-"}</p>
                              </td>

                              <td className="px-4 py-4 font-black text-slate-950">
                                {getPrizeName(winner)}
                              </td>

                              <td className="px-4 py-4 font-semibold text-slate-600">
                                {getPrizeNotes(winner)}
                              </td>

                              <td className="px-4 py-4 font-semibold text-slate-600">
                                {formatDate(getDrawnAt(winner))}
                              </td>

                              <td className="px-4 py-4 font-black text-slate-950">
                                {winner.drawn_by_name || "-"}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  <p className="mt-4 text-sm font-semibold text-slate-500">
                    Menampilkan {sortedWinners.length} pemenang dari {eligibleTotal || participantTotal || 0} peserta eligible.
                  </p>
                </section>
              </section>

              <aside className="space-y-5">
                <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-50 text-purple-700">
                      <Gift size={23} />
                    </div>
                    <h3 className="text-lg font-black text-slate-950">Ringkasan Doorprize</h3>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <RightMetric label="Peserta" value={String(participantTotal)} />
                    <RightMetric label="Eligible" value={String(eligibleTotal)} />
                    <RightMetric label="Pemenang" value={String(winners.length)} />
                    <RightMetric label="Sisa" value={String(remainingEligible)} />
                  </div>

                  <div className="mt-5">
                    <div className="flex items-center justify-between text-sm font-black">
                      <span>Progress Pemenang</span>
                      <span className="text-purple-700">{winnerProgress}%</span>
                    </div>
                    <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-purple-700" style={{ width: `${winnerProgress}%` }} />
                    </div>
                  </div>
                </section>

                <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
                  <h3 className="text-lg font-black text-slate-950">Event</h3>
                  <h4 className="mt-4 text-xl font-black text-slate-950">{title}</h4>
                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
                    {formatEventDate(event?.event_date)}
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
                    <QuickAccess href="/account/tracking" icon={Navigation} label="Tracking" />
                    <QuickAccess href="/account/events" icon={CalendarDays} label="My Events" />
                  </div>
                </section>
              </aside>
            </>
          )}
        </section>
      </section>
    </main>
  );

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
}

function DoorprizeSidebar() {
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
        <p className="text-sm font-black text-purple-700">Doorprize Event</p>
        <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
          Lihat hasil undian dan daftar pemenang doorprize event.
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

function DoorprizeTopbar({
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

function WinnerInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/10 p-4">
      <p className="text-xs font-black uppercase text-slate-400">{label}</p>
      <p className="mt-1 text-base font-black text-white">{value}</p>
    </div>
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
