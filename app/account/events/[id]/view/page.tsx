"use client";

import AccountAppShell from "../../../../components/AccountAppShell";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Box,
  Gift,
  Layers,
  List,
  Loader2,
  LocateFixed,
  MapPin,
  Navigation,
  RefreshCw,
  Satellite,
  Trophy,
  Wifi,
  WifiOff,
  Zap,
} from "lucide-react";

type PublicEvent = {
  id: number | string;
  title?: string | null;
  event_title?: string | null;
  name?: string | null;
  event_date?: string | null;
  location?: string | null;
  participant_count?: number | string | null;
  quota?: number | string | null;
  status?: string | null;
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

type LiveMarker = {
  position_id?: string | null;
  event_id?: string | null;
  user_id?: string | null;
  full_name?: string | null;
  email?: string | null;
  participant_number?: string | null;
  lat: number;
  lng: number;
  speed_kmh?: number | null;
  distance_km?: number | null;
  updated_at?: string | null;
  status?: string | null;
  seconds_ago?: number | null;
  is_online?: boolean;
  projected?: {
    x: number;
    y: number;
  };
};

type StandbyParticipant = {
  user_id?: string | null;
  full_name?: string | null;
  email?: string | null;
  participant_number?: string | null;
  registration_status?: string | null;
  registered_at?: string | null;
};

type RoutePoint = {
  lat: number;
  lng: number;
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

function formatDateTime(value: string | null | undefined) {
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

  if (!Number.isFinite(numberValue) || numberValue <= 0) return "0.00 KM";

  return `${numberValue.toFixed(2)} KM`;
}

function formatSpeed(value: number | string | null | undefined) {
  const numberValue = Number(value || 0);

  if (!Number.isFinite(numberValue) || numberValue <= 0) return "-";

  return `${numberValue.toFixed(1)} km/jam`;
}

function formatSecondsAgo(value: number | null | undefined) {
  if (value === null || value === undefined) return "-";
  if (value < 60) return `${value} detik lalu`;
  if (value < 3600) return `${Math.floor(value / 60)} menit lalu`;
  return `${Math.floor(value / 3600)} jam lalu`;
}

function getEventTitle(event: PublicEvent | null, eventId: string) {
  return String(event?.title || event?.event_title || event?.name || "").trim() || `Event #${eventId}`;
}

function calculatePercent(value: number, total: number) {
  if (!Number.isFinite(value) || !Number.isFinite(total) || total <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((value / total) * 100)));
}

function buildBounds(points: Array<{ lat: number; lng: number }>) {
  const valid = points.filter((point) => Number.isFinite(point.lat) && Number.isFinite(point.lng));
  if (valid.length === 0) return null;

  let minLat = valid[0].lat;
  let maxLat = valid[0].lat;
  let minLng = valid[0].lng;
  let maxLng = valid[0].lng;

  for (const point of valid) {
    minLat = Math.min(minLat, point.lat);
    maxLat = Math.max(maxLat, point.lat);
    minLng = Math.min(minLng, point.lng);
    maxLng = Math.max(maxLng, point.lng);
  }

  const latPadding = Math.max((maxLat - minLat) * 0.18, 0.0005);
  const lngPadding = Math.max((maxLng - minLng) * 0.18, 0.0005);

  return {
    minLat: minLat - latPadding,
    maxLat: maxLat + latPadding,
    minLng: minLng - lngPadding,
    maxLng: maxLng + lngPadding,
  };
}

function projectPoint(point: { lat: number; lng: number }, bounds: ReturnType<typeof buildBounds>) {
  if (!bounds) return { x: 50, y: 50 };

  const lngRange = bounds.maxLng - bounds.minLng || 1;
  const latRange = bounds.maxLat - bounds.minLat || 1;
  const x = ((point.lng - bounds.minLng) / lngRange) * 100;
  const y = (1 - (point.lat - bounds.minLat) / latRange) * 100;

  return {
    x: Math.min(96, Math.max(4, x)),
    y: Math.min(96, Math.max(4, y)),
  };
}

export default function AccountEventLiveViewPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = String(params?.id || "");

  const [event, setEvent] = useState<PublicEvent | null>(null);
  const [results, setResults] = useState<EventResult[]>([]);
  const [liveMarkers, setLiveMarkers] = useState<LiveMarker[]>([]);
  const [routePoints, setRoutePoints] = useState<RoutePoint[]>([]);
  const [standbyParticipants, setStandbyParticipants] = useState<StandbyParticipant[]>([]);
  const [participantTotal, setParticipantTotal] = useState(0);
  const [liveMessage, setLiveMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const title = getEventTitle(event, eventId);

  /*
    AccountAppShell otomatis membuat hero card di awal content.
    Untuk halaman Live View ini, target UI adalah langsung membuka Peta Live Tracking.
    Efek ini hanya menyembunyikan hero card shell pada halaman ini saja.
  */
  useEffect(() => {
    const marker = document.querySelector("[data-amost-live-exact-page]");
    const shellContent = marker?.closest("section.space-y-5");
    const firstCard = shellContent?.querySelector(":scope > section:first-child") as HTMLElement | null;

    if (firstCard && !firstCard.contains(marker)) {
      firstCard.style.display = "none";
    }

    return () => {
      if (firstCard) firstCard.style.display = "";
    };
  }, []);

  const stats = useMemo(() => {
    const participantCount = Number(event?.participant_count || participantTotal || 0);
    const finishCount = results.filter(
      (item) => String(item.result_status || "").toUpperCase() === "FINISH",
    ).length;
    const onlineCount = liveMarkers.filter((item) => item.is_online).length;
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
      finishCount,
      liveCount: liveMarkers.length,
      onlineCount,
      standbyCount: standbyParticipants.length,
      progress: calculatePercent(finishCount, participantCount || 1),
      totalDistance,
      avgSpeed,
    };
  }, [event, participantTotal, results, liveMarkers, standbyParticipants.length]);

  const projected = useMemo(() => {
    const allPoints = [
      ...routePoints.map((point) => ({ lat: Number(point.lat), lng: Number(point.lng) })),
      ...liveMarkers.map((point) => ({ lat: Number(point.lat), lng: Number(point.lng) })),
    ];

    const bounds = buildBounds(allPoints);
    const routePath = routePoints
      .map((point, index) => {
        const projectedPoint = projectPoint(point, bounds);
        return `${index === 0 ? "M" : "L"} ${projectedPoint.x.toFixed(2)} ${projectedPoint.y.toFixed(2)}`;
      })
      .join(" ");

    const markers = liveMarkers.map((marker) => ({
      ...marker,
      projected: projectPoint(marker, bounds),
    }));

    return { routePath, markers };
  }, [routePoints, liveMarkers]);

  async function loadData(silent = false) {
    if (silent) setRefreshing(true);
    else setLoading(true);

    setErrorMessage("");
    setLiveMessage("");

    try {
      const [eventResponse, resultsResponse, liveResponse] = await Promise.all([
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
        fetch(`/api/events/${eventId}/live`, {
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
        setErrorMessage(eventData?.message || eventData?.error || "Event belum bisa dimuat.");
        return;
      }

      setEvent(eventData?.event || eventData?.data || null);

      if (resultsResponse) {
        const resultsData = await resultsResponse.json().catch(() => null);
        setResults(
          Array.isArray(resultsData?.data)
            ? resultsData.data
            : Array.isArray(resultsData?.items)
              ? resultsData.items
              : [],
        );
      }

      if (liveResponse) {
        const liveData = await liveResponse.json().catch(() => null);
        setLiveMarkers(
          Array.isArray(liveData?.data)
            ? liveData.data
            : Array.isArray(liveData?.items)
              ? liveData.items
              : [],
        );
        setRoutePoints(Array.isArray(liveData?.route_points) ? liveData.route_points : []);
        setStandbyParticipants(
          Array.isArray(liveData?.standby_participants) ? liveData.standby_participants : [],
        );
        setParticipantTotal(Number(liveData?.participant_total || 0));
        setLiveMessage(liveData?.debug?.reason || liveData?.message || "");
      }
    } catch (error) {
      console.error(error);
      setErrorMessage("Koneksi ke server bermasalah.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    if (eventId) void loadData();
  }, [eventId]);

  const rightPanel = (
    <section className="space-y-5">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-black text-slate-950">Ringkasan Live</h3>
          <Zap className="text-purple-700" size={22} />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <InfoBox label="Peserta" value={String(stats.participantCount)} />
          <InfoBox label="Live" value={String(stats.liveCount)} />
          <InfoBox label="Online" value={String(stats.onlineCount)} accent="green" />
          <InfoBox label="Standby" value={String(stats.standbyCount)} />
          <InfoBox label="Finish" value={String(stats.finishCount)} />
          <InfoBox label="Progress Result" value={`${stats.progress}%`} />
        </div>

        <Link
          href={`/account/events/${eventId}/results`}
          className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-sm font-black text-slate-700 hover:bg-slate-50"
        >
          <Trophy size={17} />
          Lihat Hasil Event
        </Link>
      </section>

      <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-black text-slate-950">Live/Result Ringkas</h3>
          <List className="text-purple-700" size={22} />
        </div>

        {results.length === 0 ? (
          <div className="flex min-h-[150px] flex-col items-center justify-center text-center">
            <p className="text-sm font-black text-slate-950">Belum ada hasil.</p>
            <p className="mt-2 max-w-[230px] text-sm leading-6 text-slate-500">
              Hasil peserta akan tampil setelah event selesai dan data dikirim.
            </p>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {results.slice(0, 4).map((item) => (
              <div
                key={String(item.result_id || `${item.user_id}-${item.event_id}`)}
                className="rounded-2xl bg-slate-50 p-4"
              >
                <p className="font-black text-slate-950">{item.full_name || "Peserta AMOST"}</p>
                <p className="mt-1 text-xs font-semibold text-slate-500">
                  {item.participant_number || "-"} · {formatDistance(item.distance)}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </section>
  );

  return (
    <AccountAppShell
      active="events"
      title="Tracking Live"
      eyebrow="AMOST LIVE"
      description={`Live tracking event ${title}.`}
      icon={Satellite}
      rightPanel={rightPanel}
    >
      <div data-amost-live-exact-page className="space-y-5">
        {loading ? (
          <section className="flex min-h-[520px] flex-col items-center justify-center rounded-[2rem] border border-slate-200 bg-white text-center shadow-sm">
            <Loader2 className="h-12 w-12 animate-spin text-purple-700" />
            <p className="mt-4 text-xl font-black text-slate-950">Memuat live tracking...</p>
            <p className="mt-2 text-sm text-slate-500">Mengambil data event, result, dan posisi live.</p>
          </section>
        ) : errorMessage ? (
          <section className="rounded-[2rem] border border-red-200 bg-red-50 p-6 text-sm font-black text-red-700">
            {errorMessage}
          </section>
        ) : (
          <>
            <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.24em] text-purple-700">
                Peta Live Tracking
              </p>

              <section className="relative mt-5 min-h-[360px] overflow-hidden rounded-[1.5rem] border border-slate-200 bg-[#eaf1f0]">
                <div className="absolute inset-0 opacity-90">
                  <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.07)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.07)_1px,transparent_1px)] bg-[size:44px_44px]" />
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_18%,rgba(34,197,94,0.12),transparent_25%),radial-gradient(circle_at_82%_20%,rgba(59,130,246,0.12),transparent_22%),radial-gradient(circle_at_53%_70%,rgba(124,58,237,0.15),transparent_26%)]" />
                  <div className="absolute left-0 top-[18%] h-8 w-full rotate-[-4deg] bg-white/45" />
                  <div className="absolute left-[-10%] top-[55%] h-7 w-[120%] rotate-[8deg] bg-white/40" />
                  <div className="absolute left-[12%] top-0 h-full w-8 rotate-[12deg] bg-white/35" />
                </div>

                <div className="absolute left-4 top-1/2 z-10 flex -translate-y-1/2 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                  <button className="flex h-10 w-10 items-center justify-center border-b border-slate-200 text-lg font-black text-slate-700">+</button>
                  <button className="flex h-10 w-10 items-center justify-center border-b border-slate-200 text-lg font-black text-slate-700">-</button>
                  <button className="flex h-10 w-10 items-center justify-center text-slate-700">
                    <LocateFixed size={17} />
                  </button>
                </div>

                <svg
                  className="absolute inset-0 h-full w-full"
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                >
                  {projected.routePath ? (
                    <>
                      <path
                        d={projected.routePath}
                        fill="none"
                        stroke="rgba(126, 34, 206, 0.95)"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.8"
                      />
                      <path
                        d={projected.routePath}
                        fill="none"
                        stroke="rgba(255, 255, 255, 0.9)"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="0.6"
                      />
                    </>
                  ) : null}
                </svg>

                {projected.markers.map((marker) => (
                  <LiveMarkerBubble
                    key={String(marker.position_id || marker.user_id || `${marker.lat}-${marker.lng}`)}
                    marker={marker}
                  />
                ))}

                {liveMarkers.length === 0 ? (
                  <div className="absolute inset-0 z-10 flex items-center justify-center px-8">
                    <div className="max-w-xl rounded-[1.5rem] bg-white/75 p-7 text-center backdrop-blur">
                      <MapPin className="mx-auto h-11 w-11 text-purple-700" />
                      <h2 className="mt-4 text-2xl font-black text-slate-950">Belum ada posisi live.</h2>
                      <p className="mt-3 text-sm font-semibold leading-6 text-slate-700">
                        Peserta event sudah dapat muncul sebagai Standby, tetapi marker peta baru tampil setelah
                        Android mengirim lat/lng ke live_tracking_positions.
                      </p>
                      <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-slate-50 px-4 py-2 text-xs font-bold text-slate-500">
                        <Box size={15} />
                        {liveMessage || "Belum ada data live tracking untuk event ini."}
                      </p>
                    </div>
                  </div>
                ) : null}
              </section>
            </section>

            <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-lg font-black text-slate-950">Daftar Posisi Live</h3>

              {liveMarkers.length === 0 ? (
                <div className="mt-4 flex min-h-[120px] flex-col items-center justify-center rounded-2xl bg-slate-50 text-center">
                  <Box className="text-slate-300" size={30} />
                  <p className="mt-3 text-sm font-bold text-slate-500">Belum ada data live tracking.</p>
                </div>
              ) : (
                <LiveTable rows={liveMarkers} />
              )}
            </section>

            <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-lg font-black text-slate-950">Peserta Standby</h3>

              {standbyParticipants.length === 0 ? (
                <div className="mt-4 rounded-2xl bg-green-50 p-6 text-center text-sm font-bold text-green-700">
                  Tidak ada peserta standby.
                </div>
              ) : (
                <StandbyTable rows={standbyParticipants} />
              )}
            </section>

            <footer className="flex flex-wrap items-center justify-between gap-3 px-2 py-4 text-xs font-semibold text-slate-500">
              <p>
                © 2026 <span className="font-black text-slate-900">AMOST.</span> Semua hak dilindungi.
              </p>
              <div className="flex flex-wrap gap-6">
                <Link href="/privacy" className="hover:text-purple-700">Kebijakan Privasi</Link>
                <Link href="/terms" className="hover:text-purple-700">Syarat & Ketentuan</Link>
                <Link href="/help" className="hover:text-purple-700">Bantuan</Link>
              </div>
            </footer>
          </>
        )}
      </div>
    </AccountAppShell>
  );
}

function InfoBox({
  label,
  value,
  accent = "slate",
}: {
  label: string;
  value: string;
  accent?: "slate" | "green";
}) {
  const cls = accent === "green" ? "bg-green-50 text-green-700" : "bg-slate-50 text-slate-950";

  return (
    <div className={`rounded-2xl p-4 ${cls}`}>
      <p className="text-xs font-black uppercase opacity-70">{label}</p>
      <p className="mt-1 text-2xl font-black">{value}</p>
    </div>
  );
}

function LiveMarkerBubble({ marker }: { marker: LiveMarker }) {
  const x = marker.projected?.x ?? 50;
  const y = marker.projected?.y ?? 50;
  const initials =
    String(marker.full_name || "A")
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((item) => item[0]?.toUpperCase())
      .join("") || "A";

  return (
    <div className="absolute z-20 -translate-x-1/2 -translate-y-1/2" style={{ left: `${x}%`, top: `${y}%` }}>
      <div className="relative">
        <div className={`absolute -inset-4 rounded-full ${marker.is_online ? "bg-green-500/20" : "bg-slate-500/20"}`} />
        <div
          className={`relative flex h-14 w-14 items-center justify-center rounded-full border-4 border-white text-sm font-black text-white shadow-xl ${
            marker.is_online ? "bg-green-600" : "bg-slate-500"
          }`}
        >
          {initials}
        </div>
        <div className="absolute left-1/2 top-[58px] min-w-[160px] -translate-x-1/2 rounded-xl border border-slate-200 bg-white/95 px-3 py-2 text-center shadow-lg">
          <p className="truncate text-xs font-black text-slate-950">{marker.full_name || "Peserta AMOST"}</p>
          <p className="mt-1 text-[11px] font-bold text-slate-500">
            {marker.participant_number || "-"} · {formatSpeed(marker.speed_kmh)}
          </p>
        </div>
      </div>
    </div>
  );
}

function LiveTable({ rows }: { rows: LiveMarker[] }) {
  return (
    <div className="mt-4 overflow-x-auto">
      <table className="w-full min-w-[920px] border-separate border-spacing-y-3 text-left">
        <thead>
          <tr className="text-xs font-black uppercase tracking-wide text-slate-400">
            <th className="px-4 py-2">No</th>
            <th className="px-4 py-2">Nomor</th>
            <th className="px-4 py-2">Nama Peserta</th>
            <th className="px-4 py-2">Status</th>
            <th className="px-4 py-2">Waktu Update</th>
            <th className="px-4 py-2">Koordinat</th>
            <th className="px-4 py-2">Jarak</th>
            <th className="px-4 py-2">Speed</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((item, index) => (
            <tr key={String(item.position_id || `${item.user_id}-${item.event_id}`)} className="bg-slate-50 text-sm">
              <td className="rounded-l-2xl px-4 py-4 font-black text-slate-500">{index + 1}</td>
              <td className="px-4 py-4 font-black text-purple-700">{item.participant_number || "-"}</td>
              <td className="px-4 py-4">
                <p className="font-black text-slate-950">{item.full_name || "Peserta AMOST"}</p>
                <p className="mt-1 text-xs font-semibold text-slate-500">{item.email || "-"}</p>
              </td>
              <td className="px-4 py-4">
                <span
                  className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-black uppercase ${
                    item.is_online ? "bg-green-50 text-green-700" : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {item.is_online ? <Wifi size={14} /> : <WifiOff size={14} />}
                  {item.is_online ? "ONLINE" : "OFFLINE"}
                </span>
              </td>
              <td className="px-4 py-4 font-semibold text-slate-600">
                {formatDateTime(item.updated_at)} · {formatSecondsAgo(item.seconds_ago)}
              </td>
              <td className="px-4 py-4 font-semibold text-slate-600">
                {Number(item.lat).toFixed(6)}, {Number(item.lng).toFixed(6)}
              </td>
              <td className="px-4 py-4 font-black text-slate-950">{formatDistance(item.distance_km)}</td>
              <td className="rounded-r-2xl px-4 py-4 font-semibold text-slate-600">{formatSpeed(item.speed_kmh)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StandbyTable({ rows }: { rows: StandbyParticipant[] }) {
  return (
    <div className="mt-4 overflow-x-auto">
      <table className="w-full min-w-[760px] border-separate border-spacing-y-3 text-left">
        <thead>
          <tr className="text-xs font-black uppercase tracking-wide text-slate-400">
            <th className="px-4 py-2">No</th>
            <th className="px-4 py-2">Nomor</th>
            <th className="px-4 py-2">Nama Peserta</th>
            <th className="px-4 py-2">Status</th>
            <th className="px-4 py-2">Terdaftar</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((item, index) => (
            <tr key={String(item.user_id || index)} className="bg-slate-50 text-sm">
              <td className="rounded-l-2xl px-4 py-4 font-black text-slate-500">{index + 1}</td>
              <td className="px-4 py-4 font-black text-purple-700">{item.participant_number || "-"}</td>
              <td className="px-4 py-4">
                <p className="font-black text-slate-950">{item.full_name || "Peserta AMOST"}</p>
                <p className="mt-1 text-xs font-semibold text-slate-500">{item.email || "-"}</p>
              </td>
              <td className="px-4 py-4">
                <span className="rounded-full bg-yellow-50 px-3 py-1 text-xs font-black uppercase text-yellow-700">
                  Standby
                </span>
              </td>
              <td className="rounded-r-2xl px-4 py-4 font-semibold text-slate-600">
                {formatDateTime(item.registered_at)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
