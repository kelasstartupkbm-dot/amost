"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  RefreshCcw,
  ShieldCheck,
  Trash2,
  UserPlus,
  XCircle,
} from "lucide-react";
import AdminHeader from "../../components/AdminHeader";

type EventOfficial = {
  id: number;
  event_id: number;
  user_id: number;
  permission_level: string;
  status: string;
  notes?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  user_name?: string | null;
  full_name?: string | null;
  email?: string | null;
  event_title?: string | null;
  title?: string | null;
};

type ApiResponse = {
  ok?: boolean;
  message?: string;
  error?: string;
  data?: EventOfficial[];
  items?: EventOfficial[];
  officialEvents?: EventOfficial[];
  eventOfficials?: EventOfficial[];
};

const permissionOptions = [
  { value: "operator", label: "Operator Event" },
  { value: "result", label: "Operator Result" },
  { value: "doorprize", label: "Operator Doorprize" },
  { value: "viewer", label: "Viewer" },
];

export default function EventOfficialsPage() {
  const [eventId, setEventId] = useState("");
  const [userId, setUserId] = useState("");
  const [permissionLevel, setPermissionLevel] = useState("operator");
  const [notes, setNotes] = useState("");
  const [filterEventId, setFilterEventId] = useState("");

  const [items, setItems] = useState<EventOfficial[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const filteredItems = useMemo(() => {
    if (!filterEventId.trim()) return items;
    return items.filter((item) => String(item.event_id) === filterEventId.trim());
  }, [items, filterEventId]);

  async function loadOfficials() {
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const query = filterEventId.trim()
        ? `?eventId=${encodeURIComponent(filterEventId.trim())}`
        : "";

      const response = await fetch(`/api/admin/event-officials${query}`, {
        method: "GET",
        cache: "no-store",
        credentials: "include",
      });

      const data: ApiResponse | EventOfficial[] = await response.json().catch(() => ({}));

      if (!response.ok) {
        const apiError = !Array.isArray(data) ? data.error || data.message : "";
        throw new Error(apiError || "Gagal memuat daftar Official Event.");
      }

      const list = normalizeOfficialList(data);
      setItems(list);
    } catch (err) {
      const text = err instanceof Error ? err.message : "Gagal memuat data.";
      setError(text);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOfficials();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    const parsedEventId = Number(eventId);
    const parsedUserId = Number(userId);

    if (!Number.isFinite(parsedEventId) || parsedEventId <= 0) {
      setError("Event ID wajib berupa angka yang valid.");
      setSaving(false);
      return;
    }

    if (!Number.isFinite(parsedUserId) || parsedUserId <= 0) {
      setError("User ID wajib berupa angka yang valid.");
      setSaving(false);
      return;
    }

    try {
      const response = await fetch("/api/admin/event-officials", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          eventId: parsedEventId,
          userId: parsedUserId,
          permissionLevel,
          notes: notes.trim() || null,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || data?.ok === false) {
        throw new Error(data?.error || data?.message || "Gagal menambahkan Official Event.");
      }

      setMessage("Official Event berhasil ditambahkan.");
      setEventId("");
      setUserId("");
      setPermissionLevel("operator");
      setNotes("");
      await loadOfficials();
    } catch (err) {
      const text = err instanceof Error ? err.message : "Gagal menyimpan data.";
      setError(text);
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(id: number, status: "active" | "inactive") {
    setError("");
    setMessage("");

    try {
      const response = await fetch(`/api/admin/event-officials/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || data?.ok === false) {
        throw new Error(data?.error || data?.message || "Gagal mengubah status.");
      }

      setMessage(`Status Official Event berhasil diubah menjadi ${status}.`);
      await loadOfficials();
    } catch (err) {
      const text = err instanceof Error ? err.message : "Gagal mengubah status.";
      setError(text);
    }
  }

  async function deleteOfficial(id: number) {
    const confirmed = window.confirm("Hapus akses Official Event ini?");
    if (!confirmed) return;

    setError("");
    setMessage("");

    try {
      const response = await fetch(`/api/admin/event-officials/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || data?.ok === false) {
        throw new Error(data?.error || data?.message || "Gagal menghapus Official Event.");
      }

      setMessage("Official Event berhasil dihapus.");
      await loadOfficials();
    } catch (err) {
      const text = err instanceof Error ? err.message : "Gagal menghapus data.";
      setError(text);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <AdminHeader
  active="event-officials"
  title="Official Event"
  subtitle="Atur panitia/operator yang hanya punya akses pada event tertentu."
/>

      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-4 px-4 py-8 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-[88px]">
          <div className="flex items-start gap-4">
            <Link
              href="/admin"
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50"
            >
              <ArrowLeft size={22} />
            </Link>

            <div>
              <p className="text-sm font-black uppercase tracking-[0.18em] text-purple-700">
                Admin AMOST
              </p>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 md:text-4xl">
                Official Event
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                Atur panitia/operator yang hanya punya akses pada event tertentu.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={loadOfficials}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-black text-slate-700 transition hover:bg-slate-50"
          >
            <RefreshCcw size={18} />
            Refresh
          </button>
        </div>
      </section>

      <section className="mx-auto grid max-w-[1440px] grid-cols-1 gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[380px_1fr] lg:px-[88px]">
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div className="mb-6 flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
              <UserPlus size={23} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-950">Tambah Official Event</h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                Masukkan ID event dan ID user yang akan diberi akses.
              </p>
            </div>
          </div>

          <div className="space-y-5">
            <label className="block">
              <span className="text-sm font-black text-slate-900">Event ID</span>
              <input
                value={eventId}
                onChange={(event) => setEventId(event.target.value)}
                inputMode="numeric"
                placeholder="Contoh: 1781301672732"
                className="mt-2 h-12 w-full rounded-xl border border-slate-200 px-4 text-sm font-semibold outline-none transition focus:border-purple-500 focus:ring-4 focus:ring-purple-100"
              />
            </label>

            <label className="block">
              <span className="text-sm font-black text-slate-900">User ID</span>
              <input
                value={userId}
                onChange={(event) => setUserId(event.target.value)}
                inputMode="numeric"
                placeholder="Contoh: 2"
                className="mt-2 h-12 w-full rounded-xl border border-slate-200 px-4 text-sm font-semibold outline-none transition focus:border-purple-500 focus:ring-4 focus:ring-purple-100"
              />
            </label>

            <label className="block">
              <span className="text-sm font-black text-slate-900">Level Akses</span>
              <select
                value={permissionLevel}
                onChange={(event) => setPermissionLevel(event.target.value)}
                className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold outline-none transition focus:border-purple-500 focus:ring-4 focus:ring-purple-100"
              >
                {permissionOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-sm font-black text-slate-900">Catatan</span>
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Opsional. Contoh: PIC doorprize / operator result."
                rows={4}
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none transition focus:border-purple-500 focus:ring-4 focus:ring-purple-100"
              />
            </label>

            <button
              type="submit"
              disabled={saving}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-purple-700 px-5 text-sm font-black text-white shadow-md shadow-purple-100 transition hover:bg-purple-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? <Loader2 size={18} className="animate-spin" /> : <ShieldCheck size={18} />}
              {saving ? "Menyimpan..." : "Tambah Official Event"}
            </button>
          </div>
        </form>

        <div className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <h2 className="text-xl font-black text-slate-950">Daftar Official Event</h2>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Filter berdasarkan Event ID untuk melihat panitia pada event tertentu.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  value={filterEventId}
                  onChange={(event) => setFilterEventId(event.target.value)}
                  inputMode="numeric"
                  placeholder="Filter Event ID"
                  className="h-12 rounded-xl border border-slate-200 px-4 text-sm font-semibold outline-none transition focus:border-purple-500 focus:ring-4 focus:ring-purple-100"
                />
                <button
                  type="button"
                  onClick={loadOfficials}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-black text-white transition hover:bg-slate-800"
                >
                  <RefreshCcw size={18} />
                  Terapkan
                </button>
              </div>
            </div>

            {message && (
              <div className="mt-5 flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-sm font-bold text-green-700">
                <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
                {message}
              </div>
            )}

            {error && (
              <div className="mt-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
                <XCircle size={18} className="mt-0.5 shrink-0" />
                {error}
              </div>
            )}
          </section>

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {loading ? (
              <div className="flex min-h-[320px] items-center justify-center text-slate-500">
                <Loader2 className="mr-2 animate-spin" size={22} />
                Memuat Official Event...
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="flex min-h-[320px] flex-col items-center justify-center px-6 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-purple-100 text-purple-700">
                  <UserPlus size={28} />
                </div>
                <h3 className="mt-5 text-2xl font-black text-slate-950">Belum ada Official Event</h3>
                <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                  Tambahkan user sebagai Official Event menggunakan form di sebelah kiri.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <thead className="bg-slate-50 text-left text-xs font-black uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-5 py-4">ID</th>
                      <th className="px-5 py-4">Event</th>
                      <th className="px-5 py-4">User</th>
                      <th className="px-5 py-4">Akses</th>
                      <th className="px-5 py-4">Status</th>
                      <th className="px-5 py-4">Catatan</th>
                      <th className="px-5 py-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {filteredItems.map((item) => (
                      <tr key={item.id} className="align-top">
                        <td className="px-5 py-4 font-black text-slate-950">#{item.id}</td>
                        <td className="px-5 py-4">
                          <p className="font-black text-slate-950">Event ID {item.event_id}</p>
                          <p className="mt-1 text-xs text-slate-500">
                            {item.event_title || item.title || "Nama event belum tersedia"}
                          </p>
                        </td>
                        <td className="px-5 py-4">
                          <p className="font-black text-slate-950">
                            {item.user_name || item.full_name || `User ID ${item.user_id}`}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">{item.email || `User ID ${item.user_id}`}</p>
                        </td>
                        <td className="px-5 py-4">
                          <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-black text-purple-700">
                            {formatPermission(item.permission_level)}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-black ${
                              item.status === "active"
                                ? "bg-green-50 text-green-700"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>
                        <td className="max-w-[240px] px-5 py-4 text-slate-600">
                          {item.notes || "-"}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex justify-end gap-2">
                            {item.status === "active" ? (
                              <button
                                type="button"
                                onClick={() => updateStatus(item.id, "inactive")}
                                className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-black text-slate-700 hover:bg-slate-50"
                              >
                                Nonaktifkan
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => updateStatus(item.id, "active")}
                                className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs font-black text-green-700 hover:bg-green-100"
                              >
                                Aktifkan
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => deleteOfficial(item.id)}
                              className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-black text-red-700 hover:bg-red-100"
                              aria-label="Hapus Official Event"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}

function normalizeOfficialList(data: ApiResponse | EventOfficial[]): EventOfficial[] {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.items)) return data.items;
  if (Array.isArray(data.data)) return data.data;
  if (Array.isArray(data.officialEvents)) return data.officialEvents;
  if (Array.isArray(data.eventOfficials)) return data.eventOfficials;
  return [];
}

function formatPermission(value: string) {
  const match = permissionOptions.find((option) => option.value === value);
  return match?.label || value || "Operator Event";
}
