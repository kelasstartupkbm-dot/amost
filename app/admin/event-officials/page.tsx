"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Plus,
  RefreshCcw,
  ShieldCheck,
  Trash2,
  UserCog,
  XCircle,
} from "lucide-react";

type ApiPayload = Record<string, unknown> | unknown[];

type EventOfficial = {
  id: number;
  event_id: number;
  user_id: number;
  permission_level: string;
  status: string;
  notes?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  event_title?: string | null;
  event_name?: string | null;
  user_full_name?: string | null;
  full_name?: string | null;
  user_email?: string | null;
  email?: string | null;
};

type FormState = {
  eventId: string;
  userId: string;
  permissionLevel: string;
  notes: string;
};

const permissionOptions = [
  {
    value: "operator",
    label: "Operator Event",
    description: "Akses standar untuk membantu operasional event.",
  },
  {
    value: "viewer",
    label: "Viewer",
    description: "Akses lihat data event tanpa perubahan besar.",
  },
  {
    value: "result_admin",
    label: "Admin Result",
    description: "Fokus input dan validasi hasil event.",
  },
  {
    value: "doorprize_admin",
    label: "Admin Doorprize",
    description: "Fokus undian nomor peserta dan doorprize.",
  },
];

const statusOptions = [
  { value: "active", label: "Aktif" },
  { value: "inactive", label: "Nonaktif" },
];

export default function EventOfficialsAdminPage() {
  const [items, setItems] = useState<EventOfficial[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [filterEventId, setFilterEventId] = useState("");
  const [form, setForm] = useState<FormState>({
    eventId: "",
    userId: "",
    permissionLevel: "operator",
    notes: "",
  });

  const normalizedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      if (a.event_id !== b.event_id) return a.event_id - b.event_id;
      return a.user_id - b.user_id;
    });
  }, [items]);

  const loadOfficials = useCallback(async () => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const query = filterEventId.trim()
        ? `?eventId=${encodeURIComponent(filterEventId.trim())}`
        : "";

      const response = await fetch(`/api/admin/event-officials${query}`, {
        method: "GET",
        cache: "no-store",
      });

      const data = await safeReadJson(response);

      if (!response.ok) {
        throw new Error(getApiMessage(data) || "Gagal memuat Official Event.");
      }

      setItems(extractOfficials(data));
    } catch (err) {
      setItems([]);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [filterEventId]);

  useEffect(() => {
    loadOfficials();
  }, [loadOfficials]);

  async function handleCreateOfficial(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    const eventId = Number(form.eventId);
    const userId = Number(form.userId);

    if (!Number.isFinite(eventId) || eventId <= 0) {
      setSaving(false);
      setError("Event ID wajib diisi dengan angka yang valid.");
      return;
    }

    if (!Number.isFinite(userId) || userId <= 0) {
      setSaving(false);
      setError("User ID wajib diisi dengan angka yang valid.");
      return;
    }

    try {
      const response = await fetch("/api/admin/event-officials", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          eventId,
          event_id: eventId,
          userId,
          user_id: userId,
          permissionLevel: form.permissionLevel,
          permission_level: form.permissionLevel,
          status: "active",
          notes: form.notes.trim() || null,
        }),
      });

      const data = await safeReadJson(response);

      if (!response.ok) {
        throw new Error(getApiMessage(data) || "Gagal menambahkan Official Event.");
      }

      setSuccess("Official Event berhasil ditambahkan.");
      setForm({
        eventId: "",
        userId: "",
        permissionLevel: "operator",
        notes: "",
      });
      await loadOfficials();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdateStatus(item: EventOfficial, status: string) {
    setUpdatingId(item.id);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`/api/admin/event-officials/${item.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      const data = await safeReadJson(response);

      if (!response.ok) {
        throw new Error(getApiMessage(data) || "Gagal mengubah status Official Event.");
      }

      setSuccess("Status Official Event berhasil diperbarui.");
      await loadOfficials();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleDeleteOfficial(item: EventOfficial) {
    const userLabel = item.user_full_name || item.full_name || item.user_email || item.email || `User #${item.user_id}`;
    const confirmed = window.confirm(
      `Hapus ${userLabel} dari Official Event untuk Event ID ${item.event_id}?`,
    );

    if (!confirmed) return;

    setDeletingId(item.id);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`/api/admin/event-officials/${item.id}`, {
        method: "DELETE",
      });

      const data = await safeReadJson(response);

      if (!response.ok) {
        throw new Error(getApiMessage(data) || "Gagal menghapus Official Event.");
      }

      setSuccess("Official Event berhasil dihapus.");
      await loadOfficials();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex min-h-20 max-w-[1280px] flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="flex items-center gap-4">
            <Link
              href="/admin"
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 text-slate-700 transition hover:bg-slate-100"
              aria-label="Kembali ke admin"
            >
              <ArrowLeft size={20} />
            </Link>

            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-purple-700">
                Admin AMOST
              </p>
              <h1 className="text-2xl font-black tracking-tight text-slate-950 md:text-3xl">
                Official Event
              </h1>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                Atur panitia/operator yang hanya punya akses pada event tertentu.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={loadOfficials}
            disabled={loading}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? <Loader2 className="animate-spin" size={17} /> : <RefreshCcw size={17} />}
            Refresh
          </button>
        </div>
      </header>

      <section className="mx-auto grid max-w-[1280px] grid-cols-1 gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[380px_1fr] lg:px-8">
        <aside className="space-y-6">
          <form
            onSubmit={handleCreateOfficial}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
                <UserCog size={22} />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-950">
                  Tambah Official Event
                </h2>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Masukkan ID event dan ID user yang akan diberi akses.
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              <label className="block">
                <span className="text-sm font-black text-slate-800">Event ID</span>
                <input
                  value={form.eventId}
                  onChange={(event) => setForm((prev) => ({ ...prev, eventId: event.target.value }))}
                  inputMode="numeric"
                  placeholder="Contoh: 1781301672732"
                  className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold outline-none transition focus:border-purple-600 focus:ring-4 focus:ring-purple-100"
                />
              </label>

              <label className="block">
                <span className="text-sm font-black text-slate-800">User ID</span>
                <input
                  value={form.userId}
                  onChange={(event) => setForm((prev) => ({ ...prev, userId: event.target.value }))}
                  inputMode="numeric"
                  placeholder="Contoh: 2"
                  className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold outline-none transition focus:border-purple-600 focus:ring-4 focus:ring-purple-100"
                />
              </label>

              <label className="block">
                <span className="text-sm font-black text-slate-800">Level Akses</span>
                <select
                  value={form.permissionLevel}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, permissionLevel: event.target.value }))
                  }
                  className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold outline-none transition focus:border-purple-600 focus:ring-4 focus:ring-purple-100"
                >
                  {permissionOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-sm font-black text-slate-800">Catatan</span>
                <textarea
                  value={form.notes}
                  onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
                  placeholder="Opsional. Contoh: PIC doorprize / operator result."
                  rows={4}
                  className="mt-2 w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold outline-none transition focus:border-purple-600 focus:ring-4 focus:ring-purple-100"
                />
              </label>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-purple-700 px-5 text-sm font-black text-white shadow-lg shadow-purple-200 transition hover:bg-purple-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
              {saving ? "Menyimpan..." : "Tambahkan Official"}
            </button>
          </form>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                <ShieldCheck size={22} />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-950">Aturan Akses</h2>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Official Event bukan role global. Akses ini hanya berlaku pada event yang ditugaskan.
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {permissionOptions.map((option) => (
                <div key={option.value} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                  <p className="text-sm font-black text-slate-900">{option.label}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">{option.description}</p>
                </div>
              ))}
            </div>
          </div>
        </aside>

        <section className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h2 className="text-xl font-black text-slate-950">Daftar Official Event</h2>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Filter berdasarkan Event ID untuk melihat panitia pada event tertentu.
                </p>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  value={filterEventId}
                  onChange={(event) => setFilterEventId(event.target.value)}
                  inputMode="numeric"
                  placeholder="Filter Event ID"
                  className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold outline-none transition focus:border-purple-600 focus:ring-4 focus:ring-purple-100"
                />

                <button
                  type="button"
                  onClick={loadOfficials}
                  disabled={loading}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-black text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? <Loader2 className="animate-spin" size={17} /> : <RefreshCcw size={17} />}
                  Terapkan
                </button>
              </div>
            </div>

            {(error || success) && (
              <div className="mt-5 space-y-3">
                {error && (
                  <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
                    <XCircle className="mt-0.5 shrink-0" size={20} />
                    <p className="text-sm font-bold leading-6">{error}</p>
                  </div>
                )}

                {success && (
                  <div className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-green-700">
                    <CheckCircle2 className="mt-0.5 shrink-0" size={20} />
                    <p className="text-sm font-bold leading-6">{success}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {loading ? (
              <div className="flex min-h-[360px] flex-col items-center justify-center p-8 text-center">
                <Loader2 className="animate-spin text-purple-700" size={34} />
                <p className="mt-4 text-sm font-black text-slate-700">Memuat Official Event...</p>
              </div>
            ) : normalizedItems.length === 0 ? (
              <div className="flex min-h-[360px] flex-col items-center justify-center p-8 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-purple-100 text-purple-700">
                  <UserCog size={30} />
                </div>
                <h3 className="mt-5 text-xl font-black text-slate-950">Belum ada Official Event</h3>
                <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                  Tambahkan user sebagai Official Event menggunakan form di sebelah kiri.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[860px] text-left text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50 text-xs font-black uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-5 py-4">Official</th>
                      <th className="px-5 py-4">Event</th>
                      <th className="px-5 py-4">Permission</th>
                      <th className="px-5 py-4">Status</th>
                      <th className="px-5 py-4">Catatan</th>
                      <th className="px-5 py-4 text-right">Aksi</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {normalizedItems.map((item) => {
                      const userName = item.user_full_name || item.full_name || `User #${item.user_id}`;
                      const userEmail = item.user_email || item.email || "Email tidak tersedia";
                      const eventTitle = item.event_title || item.event_name || `Event ID ${item.event_id}`;
                      const isBusy = deletingId === item.id || updatingId === item.id;

                      return (
                        <tr key={item.id} className="align-top transition hover:bg-slate-50/80">
                          <td className="px-5 py-4">
                            <p className="font-black text-slate-950">{userName}</p>
                            <p className="mt-1 text-xs font-semibold text-slate-500">{userEmail}</p>
                            <p className="mt-1 text-xs font-bold text-slate-400">User ID: {item.user_id}</p>
                          </td>

                          <td className="px-5 py-4">
                            <p className="font-black text-slate-950">{eventTitle}</p>
                            <p className="mt-1 text-xs font-bold text-slate-400">Event ID: {item.event_id}</p>
                          </td>

                          <td className="px-5 py-4">
                            <span className="inline-flex rounded-full bg-purple-50 px-3 py-1 text-xs font-black text-purple-700">
                              {formatPermission(item.permission_level)}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <select
                              value={item.status || "active"}
                              onChange={(event) => handleUpdateStatus(item, event.target.value)}
                              disabled={isBusy}
                              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-black text-slate-700 outline-none transition focus:border-purple-600 focus:ring-4 focus:ring-purple-100 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {statusOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </td>

                          <td className="max-w-[240px] px-5 py-4">
                            <p className="text-sm leading-6 text-slate-600">
                              {item.notes || "-"}
                            </p>
                            {item.created_at && (
                              <p className="mt-2 text-xs font-semibold text-slate-400">
                                Dibuat: {formatDate(item.created_at)}
                              </p>
                            )}
                          </td>

                          <td className="px-5 py-4 text-right">
                            <button
                              type="button"
                              onClick={() => handleDeleteOfficial(item)}
                              disabled={isBusy}
                              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 text-xs font-black text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {deletingId === item.id ? (
                                <Loader2 className="animate-spin" size={15} />
                              ) : (
                                <Trash2 size={15} />
                              )}
                              Hapus
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </section>
    </main>
  );
}

async function safeReadJson(response: Response): Promise<ApiPayload> {
  try {
    return (await response.json()) as ApiPayload;
  } catch {
    return {};
  }
}

function extractOfficials(data: ApiPayload): EventOfficial[] {
  if (Array.isArray(data)) return data.filter(isEventOfficialLike);

  const record = data as Record<string, unknown>;
  const candidates = [record.items, record.officials, record.data, record.results, record.rows];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate.filter(isEventOfficialLike);
    }
  }

  return [];
}

function isEventOfficialLike(value: unknown): value is EventOfficial {
  if (!value || typeof value !== "object") return false;

  const record = value as Record<string, unknown>;
  return Number.isFinite(Number(record.id));
}

function getApiMessage(data: ApiPayload): string {
  if (!data || Array.isArray(data) || typeof data !== "object") return "";

  const record = data as Record<string, unknown>;
  const message = record.message || record.error || record.detail;

  return typeof message === "string" ? message : "";
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return "Terjadi kesalahan. Silakan coba lagi.";
}

function formatPermission(value: string) {
  const option = permissionOptions.find((item) => item.value === value);
  return option?.label || value || "Operator Event";
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
