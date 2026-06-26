"use client";

import { useEffect, useMemo, useState } from "react";

type TrackingSummary = {
  joined_events: number;
  completed_events: number;
  personal_trainings: number;
  live_sessions: number;
  total_distance_km: number;
  total_moving_time_seconds: number;
  last_activity_at: string | null;
};

type EventTracking = {
  event_id: string;
  event_name: string;
  event_status: string;
  event_date: string | null;
  bib_number: string | null;
  join_status: string;
  joined_at: string | null;
  distance_km: number | null;
  moving_time_seconds: number | null;
  avg_speed_kmh: number | null;
  result_status: string | null;
  result_at: string | null;
};

type PersonalTracking = {
  id: string;
  title: string;
  distance_km: number | null;
  moving_time_seconds: number | null;
  avg_speed_kmh: number | null;
  elevation_gain_m: number | null;
  started_at: string | null;
  finished_at: string | null;
  status: string;
};

type LiveTracking = {
  event_id: string | null;
  lat: number;
  lng: number;
  speed_kmh: number | null;
  distance_km: number | null;
  updated_at: string | null;
  status: string;
};

type TrackingResponse = {
  ok: boolean;
  message?: string;
  debug?: unknown;
  user?: {
    id: string;
    email: string;
    username?: string;
    name: string;
    role: string;
    athlete_type?: string | null;
    photo_url?: string | null;
  };
  summary?: TrackingSummary;
  live_tracking?: LiveTracking[];
  event_tracking?: EventTracking[];
  personal_tracking?: PersonalTracking[];
};

function getStorageValue(storage: Storage | null, key: string) {
  try {
    return storage?.getItem(key) || "";
  } catch {
    return "";
  }
}

function tryJsonParse(value: string): any | null {
  try {
    const parsed = JSON.parse(value);
    if (parsed && typeof parsed === "object") return parsed;
  } catch {
    // ignore
  }
  return null;
}

function encodeBase64Utf8(value: string) {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

function readNestedUser(obj: any) {
  if (!obj || typeof obj !== "object") return null;
  const nested = obj.user || obj.member || obj.account || obj.profile || null;
  if (nested && typeof nested === "object") return { ...nested, ...obj };
  return obj;
}

function pickFirst(...values: unknown[]) {
  for (const value of values) {
    const text = value === null || value === undefined ? "" : String(value).trim();
    if (text) return text;
  }
  return "";
}

function buildAmostAuthHeaders(): HeadersInit {
  if (typeof window === "undefined") return {};

  const storages = [window.localStorage, window.sessionStorage].filter(Boolean) as Storage[];
  const tokenKeys = [
    "amost_token",
    "amost_user_token",
    "amost_auth_token",
    "auth_token",
    "account_token",
    "session_token",
    "user_token",
    "access_token",
    "jwt",
    "token",
    "admin_token",
  ];
  const userKeys = [
    "amost_user",
    "amost_current_user",
    "amost_member",
    "current_user",
    "currentUser",
    "auth_user",
    "authUser",
    "account_user",
    "accountUser",
    "profile",
    "member",
    "user",
  ];

  let token = "";
  let user: any = null;

  for (const storage of storages) {
    for (const key of tokenKeys) {
      token = token || getStorageValue(storage, key);
    }
    for (const key of userKeys) {
      const raw = getStorageValue(storage, key);
      const parsed = raw ? tryJsonParse(raw) : null;
      if (!user && parsed) user = readNestedUser(parsed);
      if (!token && parsed) {
        token = pickFirst(
          parsed.token,
          parsed.access_token,
          parsed.accessToken,
          parsed.auth_token,
          parsed.authToken,
          parsed.jwt,
          parsed.session_token,
          parsed.sessionToken
        );
      }
    }

    for (let i = 0; i < storage.length; i += 1) {
      const key = storage.key(i) || "";
      const lower = key.toLowerCase();
      if (!lower.includes("amost") && !lower.includes("auth") && !lower.includes("user") && !lower.includes("member") && !lower.includes("account") && !lower.includes("token") && !lower.includes("session")) continue;
      const raw = getStorageValue(storage, key);
      if (!raw) continue;
      const parsed = tryJsonParse(raw);
      if (!user && parsed) user = readNestedUser(parsed);
      if (!token && lower.includes("token")) token = raw;
      if (!token && parsed) {
        token = pickFirst(parsed.token, parsed.access_token, parsed.accessToken, parsed.auth_token, parsed.authToken, parsed.jwt);
      }
    }
  }

  user = readNestedUser(user);

  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  const id = pickFirst(user?.id, user?.user_id, user?.userId, user?.uid, user?.member_id, user?.memberId, user?.athlete_id, user?.athleteId);
  const email = pickFirst(user?.email, user?.user_email, user?.userEmail, user?.mail);
  const username = pickFirst(user?.username, user?.user_name, user?.userName, user?.login, user?.phone, user?.no_hp);

  if (id) headers["X-AMOST-User-Id"] = id;
  if (email) headers["X-AMOST-Email"] = email;
  if (username) headers["X-AMOST-Username"] = username;

  if (user && (id || email || username || token)) {
    const safeUser = { id, email, username, token };
    headers["X-AMOST-Client-User"] = encodeBase64Utf8(JSON.stringify(safeUser));
  }

  return headers;
}

function formatKm(value?: number | null) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "-";
  return `${Number(value).toFixed(2)} km`;
}

function formatSpeed(value?: number | null) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "-";
  return `${Number(value).toFixed(1)} km/jam`;
}

function formatDuration(seconds?: number | null) {
  if (!seconds || seconds <= 0) return "-";
  const total = Math.floor(seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return `${h}j ${m}m`;
  if (m > 0) return `${m}m ${s}d`;
  return `${s}d`;
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

function statusLabel(value?: string | null) {
  if (!value) return "BELUM ADA RESULT";
  return value.replace(/_/g, " ").toUpperCase();
}

export default function AccountTrackingData() {
  const [data, setData] = useState<TrackingResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/account/tracking", {
        method: "GET",
        cache: "no-store",
        credentials: "include",
        headers: buildAmostAuthHeaders(),
      });
      const json = (await res.json()) as TrackingResponse;
      if (!res.ok || !json.ok) throw new Error(json.message || "Gagal mengambil data tracking.");
      setData(json);
    } catch (err: any) {
      setError(err?.message || "Gagal mengambil data tracking.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const summary = data?.summary;
  const eventTracking = useMemo(() => data?.event_tracking || [], [data]);
  const personalTracking = useMemo(() => data?.personal_tracking || [], [data]);
  const liveTracking = useMemo(() => data?.live_tracking || [], [data]);

  if (loading) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="h-5 w-48 animate-pulse rounded bg-slate-200" />
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="h-24 animate-pulse rounded-2xl bg-slate-100" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-red-800">
        <h2 className="text-lg font-bold">Tracking belum bisa dimuat</h2>
        <p className="mt-2 text-sm">{error}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={loadData}
            className="rounded-xl bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800"
          >
            Muat ulang
          </button>
          <a
            href="/login"
            className="rounded-xl border border-red-300 px-4 py-2 text-sm font-semibold text-red-800 hover:bg-red-100"
          >
            Login ulang
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-orange-600">AMOST Tracking</p>
            <h1 className="mt-1 text-2xl font-black text-slate-950">Data Tracking Saya</h1>
            <p className="mt-1 text-sm text-slate-500">
              Terhubung ke database real: event join, result event, live tracking, dan latihan mandiri.
            </p>
          </div>
          <button
            onClick={loadData}
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
          >
            Refresh
          </button>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-4">
          <div className="rounded-2xl bg-slate-950 p-4 text-white">
            <p className="text-xs uppercase tracking-wide text-slate-300">Total Jarak</p>
            <p className="mt-2 text-2xl font-black">{formatKm(summary?.total_distance_km)}</p>
          </div>
          <div className="rounded-2xl bg-slate-100 p-4 text-slate-950">
            <p className="text-xs uppercase tracking-wide text-slate-500">Total Durasi</p>
            <p className="mt-2 text-2xl font-black">{formatDuration(summary?.total_moving_time_seconds)}</p>
          </div>
          <div className="rounded-2xl bg-slate-100 p-4 text-slate-950">
            <p className="text-xs uppercase tracking-wide text-slate-500">Event Diikuti</p>
            <p className="mt-2 text-2xl font-black">{summary?.joined_events || 0}</p>
          </div>
          <div className="rounded-2xl bg-slate-100 p-4 text-slate-950">
            <p className="text-xs uppercase tracking-wide text-slate-500">Latihan Mandiri</p>
            <p className="mt-2 text-2xl font-black">{summary?.personal_trainings || 0}</p>
          </div>
        </div>

        <p className="mt-4 text-xs text-slate-500">Aktivitas terakhir: {formatDate(summary?.last_activity_at)}</p>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-slate-950">Status Live Terakhir</h2>
            <p className="text-sm text-slate-500">Posisi terakhir yang tersimpan di live_tracking_positions.</p>
          </div>
          <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-700">
            {liveTracking.length} data
          </span>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
                <th className="py-3 pr-3">Event</th>
                <th className="py-3 pr-3">Status</th>
                <th className="py-3 pr-3">Koordinat</th>
                <th className="py-3 pr-3">Jarak</th>
                <th className="py-3 pr-3">Speed</th>
                <th className="py-3 pr-3">Update</th>
              </tr>
            </thead>
            <tbody>
              {liveTracking.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-500">Belum ada data live tracking.</td>
                </tr>
              ) : (
                liveTracking.map((item, index) => (
                  <tr key={`${item.event_id || "live"}-${index}`} className="border-b border-slate-100">
                    <td className="py-3 pr-3 font-semibold text-slate-900">{item.event_id || "Latihan Mandiri"}</td>
                    <td className="py-3 pr-3">{statusLabel(item.status)}</td>
                    <td className="py-3 pr-3 text-slate-600">{item.lat.toFixed(6)}, {item.lng.toFixed(6)}</td>
                    <td className="py-3 pr-3">{formatKm(item.distance_km)}</td>
                    <td className="py-3 pr-3">{formatSpeed(item.speed_kmh)}</td>
                    <td className="py-3 pr-3 text-slate-500">{formatDate(item.updated_at)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-black text-slate-950">Tracking Event</h2>
        <p className="text-sm text-slate-500">Data berasal dari event_joins, events, dan training_results.</p>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
                <th className="py-3 pr-3">Event</th>
                <th className="py-3 pr-3">Nomor</th>
                <th className="py-3 pr-3">Join</th>
                <th className="py-3 pr-3">Result</th>
                <th className="py-3 pr-3">Jarak</th>
                <th className="py-3 pr-3">Durasi</th>
                <th className="py-3 pr-3">Avg Speed</th>
                <th className="py-3 pr-3">Tanggal</th>
              </tr>
            </thead>
            <tbody>
              {eventTracking.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-6 text-center text-slate-500">Belum ada event yang diikuti.</td>
                </tr>
              ) : (
                eventTracking.map((item) => (
                  <tr key={item.event_id} className="border-b border-slate-100">
                    <td className="py-3 pr-3 font-semibold text-slate-900">{item.event_name}</td>
                    <td className="py-3 pr-3">{item.bib_number || "-"}</td>
                    <td className="py-3 pr-3">{statusLabel(item.join_status)}</td>
                    <td className="py-3 pr-3">{statusLabel(item.result_status)}</td>
                    <td className="py-3 pr-3">{formatKm(item.distance_km)}</td>
                    <td className="py-3 pr-3">{formatDuration(item.moving_time_seconds)}</td>
                    <td className="py-3 pr-3">{formatSpeed(item.avg_speed_kmh)}</td>
                    <td className="py-3 pr-3 text-slate-500">{formatDate(item.result_at || item.event_date || item.joined_at)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-black text-slate-950">Latihan Mandiri</h2>
        <p className="text-sm text-slate-500">Data berasal dari personal_trainings.</p>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
                <th className="py-3 pr-3">Aktivitas</th>
                <th className="py-3 pr-3">Status</th>
                <th className="py-3 pr-3">Jarak</th>
                <th className="py-3 pr-3">Durasi</th>
                <th className="py-3 pr-3">Avg Speed</th>
                <th className="py-3 pr-3">Elevation</th>
                <th className="py-3 pr-3">Tanggal</th>
              </tr>
            </thead>
            <tbody>
              {personalTracking.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-slate-500">Belum ada latihan mandiri.</td>
                </tr>
              ) : (
                personalTracking.map((item) => (
                  <tr key={item.id} className="border-b border-slate-100">
                    <td className="py-3 pr-3 font-semibold text-slate-900">{item.title}</td>
                    <td className="py-3 pr-3">{statusLabel(item.status)}</td>
                    <td className="py-3 pr-3">{formatKm(item.distance_km)}</td>
                    <td className="py-3 pr-3">{formatDuration(item.moving_time_seconds)}</td>
                    <td className="py-3 pr-3">{formatSpeed(item.avg_speed_kmh)}</td>
                    <td className="py-3 pr-3">{item.elevation_gain_m === null ? "-" : `${item.elevation_gain_m.toFixed(0)} m`}</td>
                    <td className="py-3 pr-3 text-slate-500">{formatDate(item.finished_at || item.started_at)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
