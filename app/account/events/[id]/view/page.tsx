"use client";

import AccountAppShell from "../../../../components/AccountAppShell";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowLeft,
  Gauge,
  Gift,
  Layers,
  Loader2,
  Maximize2,
  Navigation,
  RefreshCw,
  Satellite,
  Trophy,
  UsersRound,
  Wifi,
  WifiOff,
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
  return date.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("id-ID", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
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
  return { x: Math.min(96, Math.max(4, x)), y: Math.min(96, Math.max(4, y)) };
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

  const stats = useMemo(() => {
    const participantCount = Number(event?.participant_count || participantTotal || 0);
    const quota = Number(event?.quota || 0);
    const finishCount = results.filter((item) => String(item.result_status || "").toUpperCase() === "FINISH").length;
    const totalDistance = results.reduce((sum, item) => {
      const value = Number(item.distance || 0);
      return Number.isFinite(value) ? sum + value : sum;
    }, 0);
    const speedRows = results.map((item) => Number(item.avg_speed || 0)).filter((value) => Number.isFinite(value) && value > 0);
    const avgSpeed = speedRows.length > 0 ? speedRows.reduce((sum, value) => sum + value, 0) / speedRows.length : 0;
    const onlineCount = liveMarkers.filter((item) => item.is_online).length;
    return {
      participantCount,
      quota,
      finishCount,
      totalDistance,
      avgSpeed,
      progress: calculatePercent(finishCount, participantCount || quota || 1),
      liveCount: liveMarkers.length,
      onlineCount,
      standbyCount: standbyParticipants.length,
    };
  }, [event, results, liveMarkers, standbyParticipants.length, participantTotal]);

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

    const markers = liveMarkers.map((marker) => ({ ...marker, projected: projectPoint(marker, bounds) }));
    return { bounds, routePath, markers };
  }, [routePoints, liveMarkers]);

  const loadData = async (silent = false) => {
    if (silent) setRefreshing(true);
    else setLoading(true);

    setErrorMessage("");
    setLiveMessage("");

    try {
      const [eventResponse, resultsResponse, liveResponse] = await Promise.all([
        fetch(`/api/events/${eventId}`, { method: "GET", cache: "no-store", credentials: "include" }),
        fetch(`/api/events/${eventId}/results`, { method: "GET", cache: "no-store", credentials: "include" }).catch(() => null),
        fetch(`/api/events/${eventId}/live`, { method: "GET", cache: "no-store", credentials: "include" }).catch(() => null),
      ]);

      const eventData = await eventResponse.json().catch(() => null);

      if (eventResponse.status === 401) {
        router.replace(`/login?next=/account/events/${eventId}/view`);
        return;
      }

      if (!eventResponse.ok || eventData?.ok === false) {
        setEvent(null);
        setErrorMessage(eventData?.message || eventData?.error || "Event belum bisa dimuat.");
        return;
      }

      setEvent(eventData?.event || eventData?.data || null);

      if (resultsResponse) {
        const resultsData = await resultsResponse.json().catch(() => null);
        setResults(Array.isArray(resultsData?.data) ? resultsData.data : Array.isArray(resultsData?.items) ? resultsData.items : []);
      }

      if (liveResponse) {
        const liveData = await liveResponse.json().catch(() => null);
        setLiveMarkers(Array.isArray(liveData?.data) ? liveData.data : Array.isArray(liveData?.items) ? liveData.items : []);
        setRoutePoints(Array.isArray(liveData?.route_points) ? liveData.route_points : []);
        setStandbyParticipants(Array.isArray(liveData?.standby_participants) ? liveData.standby_participants : []);
        setParticipantTotal(Number(liveData?.participant_total || 0));
        setLiveMessage(liveData?.debug?.reason || liveData?.message || "");
      }
    } catch (error) {
      console.error(error);
      setEvent(null);
      setResults([]);
      setLiveMarkers([]);
      setRoutePoints([]);
      setStandbyParticipants([]);
      setErrorMessage("Koneksi ke server bermasalah.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (eventId) loadData();
  }, [eventId]);

  const rightPanel = (
    <section className="space-y-4">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-lg font-black text-slate-950">Live Tracking</h3>
          <Satellite className="text-purple-700" size={22} />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <InfoBox label="Peserta" value={String(stats.participantCount)} />
          <InfoBox label="Live" value={String(stats.liveCount)} />
          <InfoBox label="Online" value={String(stats.onlineCount)} accent="green" />
          <InfoBox label="Standby" value={String(stats.standbyCount)} />
        </div>

        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between text-sm font-black">
            <span className="text-slate-950">Progress Result</span>
            <span className="text-purple-700">{stats.progress}%</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-purple-700" style={{ width: `${stats.progress}%` }} />
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
        <p className="mt-1 text-sm font-semibold text-slate-500">{formatDate(event?.event_date)} · {event?.location || "Lokasi menyusul"}</p>
        <Link href={`/events/${eventId}`} className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-sm font-black text-slate-700 hover:bg-slate-50">
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
            Account Layout Active · Live Tracking Real Database
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link href={`/events/${eventId}`} className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 hover:bg-slate-50">
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
            <p className="mt-2 text-sm text-slate-500">Mengambil data event, result, posisi live, dan peserta standby.</p>
          </section>
        ) : errorMessage ? (
          <section className="rounded-[2rem] border border-red-200 bg-red-50 p-6 text-sm font-black text-red-700">{errorMessage}</section>
        ) : (
          <>
            <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <StatCard icon={UsersRound} label="Peserta" value={String(stats.participantCount)} />
              <StatCard icon={Satellite} label="Live Marker" value={String(stats.liveCount)} />
              <StatCard icon={Activity} label="Total Jarak Result" value={formatDistance(stats.totalDistance)} />
              <StatCard icon={Gauge} label="Avg Speed Result" value={stats.avgSpeed > 0 ? `${stats.avgSpeed.toFixed(2)} km/jam` : "-"} />
            </section>

            <section className="relative min-h-[620px] overflow-hidden rounded-[2rem] border border-slate-200 bg-[#edf2f3] shadow-sm">
              <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.06)_1px,transparent_1px)] bg-[size:44px_44px]" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_45%_40%,rgba(124,58,237,0.16),transparent_25%),radial-gradient(circle_at_80%_10%,rgba(14,165,233,0.12),transparent_22%)]" />

              <div className="absolute left-6 top-6 z-10 max-w-md rounded-[1.5rem] border border-slate-200 bg-white/95 p-5 shadow-lg backdrop-blur">
                <p className="text-xs font-black uppercase tracking-wide text-slate-400">Event Aktif</p>
                <h2 className="mt-2 text-2xl font-black text-slate-950">{title}</h2>
                <p className="mt-1 text-sm font-semibold text-slate-500">{formatDate(event?.event_date)} · {event?.location || "Lokasi menyusul"}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Badge color="green">{String(event?.status || "Aktif")}</Badge>
                  <Badge color="purple">{stats.liveCount} live marker</Badge>
                  <Badge>{stats.standbyCount} standby</Badge>
                  <Badge>{routePoints.length} route point</Badge>
                </div>
              </div>

              <div className="absolute right-6 top-6 z-10 flex flex-col gap-3">
                <MapButton icon={Satellite} label="GPS" />
                <MapButton icon={Layers} label="Layer" />
                <MapButton icon={Maximize2} label="Full" />
              </div>

              <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                {projected.routePath ? (
                  <>
                    <path d={projected.routePath} fill="none" stroke="rgba(126, 34, 206, 0.95)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    <path d={projected.routePath} fill="none" stroke="rgba(255, 255, 255, 0.86)" strokeWidth="0.55" strokeLinecap="round" strokeLinejoin="round" />
                  </>
                ) : null}
              </svg>

              {projected.markers.map((marker) => (
                <LiveMarkerBubble key={String(marker.position_id || marker.user_id || `${marker.lat}-${marker.lng}`)} marker={marker} />
              ))}

              {liveMarkers.length === 0 ? (
                <div className="absolute inset-x-6 bottom-6 z-10 rounded-[1.5rem] border border-slate-200 bg-white/95 p-6 text-center shadow-lg backdrop-blur">
                  <WifiOff className="mx-auto h-10 w-10 text-slate-300" />
                  <h3 className="mt-3 text-xl font-black text-slate-950">Belum ada posisi live.</h3>
                  <p className="mt-2 text-sm font-semibold text-slate-500">
                    Peserta event sudah dapat muncul sebagai Standby, tetapi marker peta baru tampil setelah Android mengirim lat/lng ke live_tracking_positions.
                  </p>
                  {liveMessage ? <p className="mt-2 text-xs font-bold text-slate-400">{liveMessage}</p> : null}
                </div>
              ) : null}
            </section>

            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-xl font-black text-slate-950">Daftar Posisi Live</h3>
              <p className="mt-1 text-sm text-slate-500">Data ini berasal dari live_tracking_positions.</p>

              {liveMarkers.length === 0 ? (
                <div className="mt-4 rounded-2xl bg-slate-50 p-6 text-center text-sm font-bold text-slate-500">
                  Belum ada data live tracking untuk event ini.
                </div>
              ) : (
                <LiveTable rows={liveMarkers} />
              )}
            </section>

            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-xl font-black text-slate-950">Peserta Standby</h3>
              <p className="mt-1 text-sm text-slate-500">
                Peserta yang sudah terdaftar, tetapi belum punya titik live di live_tracking_positions.
              </p>

              {standbyParticipants.length === 0 ? (
                <div className="mt-4 rounded-2xl bg-green-50 p-6 text-center text-sm font-bold text-green-700">
                  Tidak ada peserta standby. Semua peserta terdaftar yang terdeteksi sudah punya data live, atau belum ada data registrasi.
                </div>
              ) : (
                <StandbyTable rows={standbyParticipants} />
              )}
            </section>

            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-xl font-black text-slate-950">Live/Result Ringkas</h3>
              {results.length === 0 ? (
                <div className="mt-4 rounded-2xl bg-slate-50 p-6 text-center text-sm font-bold text-slate-500">
                  Belum ada result dari peserta.
                </div>
              ) : (
                <ResultTable rows={results} />
              )}
            </section>
          </>
        )}
      </section>
    </AccountAppShell>
  );
}

function InfoBox({ label, value, accent = "slate" }: { label: string; value: string; accent?: "slate" | "green" }) {
  const color = accent === "green" ? "bg-green-50 text-green-700" : "bg-slate-50 text-slate-950";
  return (
    <div className={`rounded-2xl p-4 ${color}`}>
      <p className="text-xs font-black uppercase opacity-70">{label}</p>
      <p className="mt-1 text-2xl font-black">{value}</p>
    </div>
  );
}

function Badge({ children, color = "slate" }: { children: React.ReactNode; color?: "slate" | "green" | "purple" }) {
  const cls =
    color === "green"
      ? "bg-green-50 text-green-700"
      : color === "purple"
        ? "bg-purple-50 text-purple-700"
        : "bg-white text-slate-600";
  return <span className={`rounded-full px-3 py-1 text-xs font-black uppercase ${cls}`}>{children}</span>;
}

function LiveTable({ rows }: { rows: LiveMarker[] }) {
  return (
    <div className="mt-4 overflow-x-auto">
      <table className="w-full min-w-[920px] border-separate border-spacing-y-3 text-left">
        <thead>
          <tr className="text-xs font-black uppercase tracking-wide text-slate-400">
            <th className="px-4 py-2">Nomor</th>
            <th className="px-4 py-2">Peserta</th>
            <th className="px-4 py-2">Status</th>
            <th className="px-4 py-2">Koordinat</th>
            <th className="px-4 py-2">Jarak</th>
            <th className="px-4 py-2">Speed</th>
            <th className="px-4 py-2">Update</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((item) => (
            <tr key={String(item.position_id || `${item.user_id}-${item.event_id}`)} className="bg-slate-50 text-sm">
              <td className="rounded-l-2xl px-4 py-4 font-black text-purple-700">{item.participant_number || "-"}</td>
              <td className="px-4 py-4">
                <p className="font-black text-slate-950">{item.full_name || "Peserta AMOST"}</p>
                <p className="mt-1 text-xs font-semibold text-slate-500">{item.email || "-"}</p>
              </td>
              <td className="px-4 py-4">
                <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-black uppercase ${item.is_online ? "bg-green-50 text-green-700" : "bg-slate-100 text-slate-700"}`}>
                  {item.is_online ? <Wifi size={14} /> : <WifiOff size={14} />}
                  {item.is_online ? "ONLINE" : "OFFLINE"}
                </span>
              </td>
              <td className="px-4 py-4 font-semibold text-slate-600">{Number(item.lat).toFixed(6)}, {Number(item.lng).toFixed(6)}</td>
              <td className="px-4 py-4 font-black text-slate-950">{formatDistance(item.distance_km)}</td>
              <td className="px-4 py-4 font-semibold text-slate-600">{formatSpeed(item.speed_kmh)}</td>
              <td className="rounded-r-2xl px-4 py-4 font-semibold text-slate-600">{formatDateTime(item.updated_at)} · {formatSecondsAgo(item.seconds_ago)}</td>
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
            <th className="px-4 py-2">Nomor</th>
            <th className="px-4 py-2">Peserta</th>
            <th className="px-4 py-2">Status</th>
            <th className="px-4 py-2">Daftar</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((item, index) => (
            <tr key={String(item.user_id || index)} className="bg-slate-50 text-sm">
              <td className="rounded-l-2xl px-4 py-4 font-black text-purple-700">{item.participant_number || "-"}</td>
              <td className="px-4 py-4">
                <p className="font-black text-slate-950">{item.full_name || "Peserta AMOST"}</p>
                <p className="mt-1 text-xs font-semibold text-slate-500">{item.email || "-"}</p>
              </td>
              <td className="px-4 py-4">
                <span className="rounded-full bg-yellow-50 px-3 py-1 text-xs font-black uppercase text-yellow-700">STANDBY</span>
              </td>
              <td className="rounded-r-2xl px-4 py-4 font-semibold text-slate-600">{formatDateTime(item.registered_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ResultTable({ rows }: { rows: EventResult[] }) {
  return (
    <div className="mt-4 overflow-x-auto">
      <table className="w-full min-w-[760px] border-separate border-spacing-y-3 text-left">
        <thead>
          <tr className="text-xs font-black uppercase tracking-wide text-slate-400">
            <th className="px-4 py-2">Nomor</th>
            <th className="px-4 py-2">Peserta</th>
            <th className="px-4 py-2">Jarak</th>
            <th className="px-4 py-2">Speed</th>
            <th className="px-4 py-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, 8).map((item) => (
            <tr key={String(item.result_id || `${item.user_id}-${item.event_id}`)} className="bg-slate-50 text-sm">
              <td className="rounded-l-2xl px-4 py-4 font-black text-purple-700">{item.participant_number || "-"}</td>
              <td className="px-4 py-4">
                <p className="font-black text-slate-950">{item.full_name || "Tanpa Nama"}</p>
                <p className="mt-1 text-xs font-semibold text-slate-500">{item.email || "-"}</p>
              </td>
              <td className="px-4 py-4 font-black text-slate-950">{formatDistance(item.distance)}</td>
              <td className="px-4 py-4 font-semibold text-slate-600">{formatSpeed(item.avg_speed)}</td>
              <td className="rounded-r-2xl px-4 py-4">
                <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-black uppercase text-purple-700">{item.result_status || "REVIEW"}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function LiveMarkerBubble({ marker }: { marker: LiveMarker & { projected?: { x: number; y: number } } }) {
  const x = marker.projected?.x ?? 50;
  const y = marker.projected?.y ?? 50;
  const initials = String(marker.full_name || "A").split(" ").filter(Boolean).slice(0, 2).map((item) => item[0]?.toUpperCase()).join("") || "A";

  return (
    <div className="absolute z-20 -translate-x-1/2 -translate-y-1/2" style={{ left: `${x}%`, top: `${y}%` }}>
      <div className="relative">
        <div className={`absolute -inset-4 rounded-full ${marker.is_online ? "bg-green-500/20" : "bg-slate-500/20"}`} />
        <div className={`relative flex h-14 w-14 items-center justify-center rounded-full border-4 border-white text-sm font-black text-white shadow-xl ${marker.is_online ? "bg-green-600" : "bg-slate-500"}`}>{initials}</div>
        <div className="absolute left-1/2 top-[58px] min-w-[160px] -translate-x-1/2 rounded-xl border border-slate-200 bg-white/95 px-3 py-2 text-center shadow-lg">
          <p className="truncate text-xs font-black text-slate-950">{marker.full_name || "Peserta AMOST"}</p>
          <p className="mt-1 text-[11px] font-bold text-slate-500">{marker.participant_number || "-"} · {formatSpeed(marker.speed_kmh)}</p>
        </div>
      </div>
    </div>
  );
}

function QuickLink({ href, icon: Icon, label }: { href: string; icon: any; label: string }) {
  return (
    <Link href={href} className="flex h-20 flex-col items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 text-xs font-black text-slate-700 hover:bg-purple-50 hover:text-purple-700">
      <Icon size={22} />
      {label}
    </Link>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
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

function MapButton({ icon: Icon, label }: { icon: any; label: string }) {
  return (
    <button type="button" className="flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200 bg-white/95 text-slate-700 shadow-lg backdrop-blur" title={label}>
      <Icon size={22} />
    </button>
  );
}
