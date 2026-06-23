"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Loader2, RefreshCw, Trash2, UserCog } from "lucide-react";
import AdminHeader from "../../components/AdminHeader";

type OfficialEvent = {
  id: number;
  event_id: number | string;
  user_id: number | string;
  permission_level?: string | null;
  status?: string | null;
  notes?: string | null;
  full_name?: string | null;
  email?: string | null;
  event_name?: string | null;
  title?: string | null;
};

function pickItems(data: any): OfficialEvent[] {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.eventOfficials)) return data.eventOfficials;
  if (Array.isArray(data?.officials)) return data.officials;
  return [];
}

export default function EventOfficialsPage() {
  const [items, setItems] = useState<OfficialEvent[]>([]);
  const [eventId, setEventId] = useState("");
  const [userId, setUserId] = useState("");
  const [permissionLevel, setPermissionLevel] = useState("operator");
  const [notes, setNotes] = useState("");
  const [filterEventId, setFilterEventId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  async function loadOfficials() {
    setLoading(true);
    setMessage("");
    setErrorMessage("");

    try {
      const query = filterEventId.trim()
        ? `?eventId=${encodeURIComponent(filterEventId.trim())}`
        : "";

      const response = await fetch(`/api/admin/event-officials${query}`, {
        method: "GET",
        cache: "no-store",
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || data?.ok === false) {
        setItems([]);
        setErrorMessage(
          data?.message || data?.error || "Data Official Event belum bisa dimuat."
        );
        return;
      }

      setItems(pickItems(data));
    } catch (error) {
      console.error(error);
      setItems([]);
      setErrorMessage("Data Official Event belum bisa dimuat. Koneksi bermasalah.");
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

    if (!eventId.trim() || !userId.trim()) {
      setErrorMessage("Event ID dan User ID wajib diisi.");
      return;
    }

    setSaving(true);
    setMessage("");
    setErrorMessage("");

    try {
      const response = await fetch("/api/admin/event-officials", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
        body: JSON.stringify({
          eventId: Number(eventId),
          event_id: Number(eventId),
          userId: Number(userId),
          user_id: Number(userId),
          permissionLevel,
          permission_level: permissionLevel,
          notes: notes.trim() || null,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || data?.ok === false) {
        setErrorMessage(
          data?.message || data?.error || "Official Event gagal ditambahkan."
        );
        return;
      }

      setMessage("Official Event berhasil ditambahkan.");
      setEventId("");
      setUserId("");
      setPermissionLevel("operator");
      setNotes("");
      await loadOfficials();
    } catch (error) {
      console.error(error);
      setErrorMessage("Official Event gagal ditambahkan. Koneksi bermasalah.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteOfficial(item: OfficialEvent) {
    const confirmed = window.confirm(
      `Hapus Official Event user ${item.user_id} dari event ${item.event_id}?`
    );

    if (!confirmed) return;

    setMessage("");
    setErrorMessage("");

    try {
      const response = await fetch(`/api/admin/event-officials/${item.id}`, {
        method: "DELETE",
        cache: "no-store",
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || data?.ok === false) {
        setErrorMessage(data?.message || data?.error || "Official Event gagal dihapus.");
        return;
      }

      setMessage("Official Event berhasil dihapus.");
      await loadOfficials();
    } catch (error) {
      console.error(error);
      setErrorMessage("Official Event gagal dihapus.");
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <AdminHeader
        active="event-officials"
        title="Official Event"
        subtitle="Atur panitia/operator yang hanya punya akses pada event tertentu."
        showRefresh
        onRefresh={loadOfficials}
      />

      <section className="mx-auto grid max-w-[1440px] grid-cols-1 gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[360px_1fr] lg:px-[88px]">
        <form
          onSubmit={handleSubmit}
          className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
            <UserCog size={24} />
          </div>

          <h2 className="mt-5 text-2xl font-black text-slate-950">
            Tambah Official Event
          </h2>

          <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
            Masukkan ID event dan ID user yang akan diberi akses.
          </p>

          <div className="mt-6 space-y-4">
            <label className="block">
              <span className="text-sm font-black text-slate-950">Event ID</span>
              <input
                value={eventId}
                onChange={(event) => setEventId(event.target.value)}
                inputMode="numeric"
                placeholder="Contoh: 1781301672732"
                className="mt-2 h-12 w-full rounded-xl border border-slate-200 px-4 text-sm font-bold outline-none focus:border-purple-300 focus:ring-4 focus:ring-purple-100"
              />
            </label>

            <label className="block">
              <span className="text-sm font-black text-slate-950">User ID</span>
              <input
                value={userId}
                onChange={(event) => setUserId(event.target.value)}
                inputMode="numeric"
                placeholder="Contoh: 2"
                className="mt-2 h-12 w-full rounded-xl border border-slate-200 px-4 text-sm font-bold outline-none focus:border-purple-300 focus:ring-4 focus:ring-purple-100"
              />
            </label>

            <label className="block">
              <span className="text-sm font-black text-slate-950">Level Akses</span>
              <select
                value={permissionLevel}
                onChange={(event) => setPermissionLevel(event.target.value)}
                className="mt-2 h-12 w-full rounded-xl border border-slate-200 px-4 text-sm font-bold outline-none focus:border-purple-300 focus:ring-4 focus:ring-purple-100"
              >
                <option value="operator">Operator Event</option>
                <option value="result">Result Officer</option>
                <option value="doorprize">Doorprize Officer</option>
                <option value="viewer">Viewer</option>
              </select>
            </label>

            <label className="block">
              <span className="text-sm font-black text-slate-950">Catatan</span>
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Opsional. Contoh: PIC doorprize / operator result."
                className="mt-2 min-h-[110px] w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none focus:border-purple-300 focus:ring-4 focus:ring-purple-100"
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="mt-6 flex h-12 w-full items-center justify-center rounded-xl bg-purple-700 text-sm font-black text-white transition hover:bg-purple-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Menyimpan..." : "Tambah Official Event"}
          </button>
        </form>

        <div className="space-y-6">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <h2 className="text-2xl font-black text-slate-950">
                  Daftar Official Event
                </h2>
                <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-slate-500">
                  Filter berdasarkan Event ID untuk melihat panitia pada event tertentu.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  value={filterEventId}
                  onChange={(event) => setFilterEventId(event.target.value)}
                  inputMode="numeric"
                  placeholder="Filter Event ID"
                  className="h-12 rounded-xl border border-slate-200 px-4 text-sm font-bold outline-none focus:border-purple-300 focus:ring-4 focus:ring-purple-100"
                />

                <button
                  type="button"
                  onClick={loadOfficials}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-black text-white transition hover:bg-slate-800"
                >
                  <RefreshCw size={17} />
                  Terapkan
                </button>
              </div>
            </div>

            {message && (
              <div className="mt-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-bold text-green-700">
                {message}
              </div>
            )}

            {errorMessage && (
              <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                {errorMessage}
              </div>
            )}
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            {loading ? (
              <div className="flex min-h-[260px] flex-col items-center justify-center text-center">
                <Loader2 className="h-10 w-10 animate-spin text-purple-700" />
                <p className="mt-4 text-lg font-black text-slate-950">
                  Memuat Official Event...
                </p>
              </div>
            ) : items.length === 0 ? (
              <div className="flex min-h-[260px] flex-col items-center justify-center text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-purple-100 text-purple-700">
                  <UserCog size={30} />
                </div>
                <h3 className="mt-5 text-2xl font-black text-slate-950">
                  Belum ada Official Event
                </h3>
                <p className="mt-2 max-w-md text-sm font-medium leading-6 text-slate-500">
                  Tambahkan user sebagai Official Event menggunakan form di sebelah kiri.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs font-black uppercase tracking-wide text-slate-500">
                      <th className="px-3 py-3">Event</th>
                      <th className="px-3 py-3">User</th>
                      <th className="px-3 py-3">Akses</th>
                      <th className="px-3 py-3">Status</th>
                      <th className="px-3 py-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr key={item.id} className="border-b border-slate-100">
                        <td className="px-3 py-4 font-black text-slate-950">
                          {item.event_name || item.title || `Event #${item.event_id}`}
                        </td>
                        <td className="px-3 py-4">
                          <p className="font-black text-slate-950">
                            {item.full_name || item.email || `User #${item.user_id}`}
                          </p>
                          <p className="text-xs font-semibold text-slate-500">
                            User ID: {item.user_id}
                          </p>
                        </td>
                        <td className="px-3 py-4">
                          <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-black text-purple-700">
                            {item.permission_level || "operator"}
                          </span>
                        </td>
                        <td className="px-3 py-4 text-sm font-bold text-slate-600">
                          {item.status || "active"}
                        </td>
                        <td className="px-3 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => deleteOfficial(item)}
                            className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 text-xs font-black text-red-700 transition hover:bg-red-100"
                          >
                            <Trash2 size={15} />
                            Hapus
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <Link
            href="/admin"
            className="inline-flex text-sm font-black text-purple-700 hover:text-purple-900"
          >
            Kembali ke Dashboard Admin
          </Link>
        </div>
      </section>
    </main>
  );
}
