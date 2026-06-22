"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  MoreHorizontal,
  Search,
  ShieldCheck,
  UserCog,
  Users,
} from "lucide-react";

type AdminUser = {
  id: number;
  fullName: string;
  email: string;
  phone?: string | null;
  status: string;
  role: string;
  roleLabel: string;
  createdAt: string;
};

export default function AdminUsersPage() {
  const router = useRouter();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [query, setQuery] = useState("");
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  async function loadUsers() {
    try {
      setLoading(true);
      setMessage("");

      const response = await fetch("/api/admin/users", {
        method: "GET",
        cache: "no-store",
      });

      const data = await response.json();

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      if (response.status === 403) {
        router.replace("/admin");
        return;
      }

      if (!response.ok || !data.ok) {
        setMessage(data.message || "Gagal mengambil data user.");
        return;
      }

      setUsers(data.users || []);
    } catch (error) {
      console.error(error);
      setMessage("Terjadi kesalahan koneksi.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  async function updateRole(userId: number, role: "staff_amost" | "umum") {
    try {
      setUpdatingId(userId);
      setMessage("");

      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role }),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        setMessage(data.message || "Gagal mengubah role user.");
        return;
      }

      setMessage(data.message || "Role user berhasil diperbarui.");
      await loadUsers();
    } catch (error) {
      console.error(error);
      setMessage("Terjadi kesalahan koneksi.");
    } finally {
      setUpdatingId(null);
    }
  }

  const filteredUsers = useMemo(() => {
    const keyword = query.trim().toLowerCase();

    if (!keyword) return users;

    return users.filter((user) => {
      return (
        user.fullName.toLowerCase().includes(keyword) ||
        user.email.toLowerCase().includes(keyword) ||
        user.roleLabel.toLowerCase().includes(keyword)
      );
    });
  }, [query, users]);

  const roleCounts = useMemo(() => {
    return {
      superAdmin: users.filter((user) => user.role === "super_admin").length,
      staff: users.filter((user) => user.role === "staff_amost").length,
      umum: users.filter((user) => user.role === "umum").length,
    };
  }, [users]);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-[1440px] items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/admin" className="flex items-center gap-3">
            <div className="logo-symbol responsive-logo">A</div>
            <div>
              <div className="text-[26px] font-black leading-none tracking-wide text-purple-700">
                AMOST
              </div>
              <div className="mt-1 text-[8px] font-black uppercase leading-[1.05] tracking-wide text-purple-700">
                User Management
              </div>
            </div>
          </Link>

          <Link
            href="/admin"
            className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
          >
            <ArrowLeft size={17} />
            Dashboard
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-wide text-purple-700">
                Super Admin Only
              </p>
              <h1 className="mt-2 text-3xl font-black text-slate-950">
                Manajemen User
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                User baru otomatis menjadi <strong>Umum</strong>. Role{" "}
                <strong>Staff AMOST</strong> hanya dapat ditentukan oleh{" "}
                <strong>Super Admin</strong>.
              </p>
            </div>

            <div className="rounded-xl bg-purple-50 p-4 text-purple-900">
              <div className="flex items-center gap-3">
                <ShieldCheck size={24} />
                <div>
                  <p className="text-sm font-black">Role Policy</p>
                  <p className="text-xs font-semibold">
                    Register otomatis Umum
                  </p>
                </div>
              </div>
            </div>
          </div>

          {message && (
            <div className="mt-5 rounded-xl border border-purple-100 bg-purple-50 p-4 text-sm font-bold text-purple-800">
              {message}
            </div>
          )}

          <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <RoleCard
              title="Super Admin"
              count={String(roleCounts.superAdmin)}
              desc="Akses penuh sistem."
            />
            <RoleCard
              title="Staff AMOST"
              count={String(roleCounts.staff)}
              desc="Akses admin terbatas."
            />
            <RoleCard
              title="Umum"
              count={String(roleCounts.umum)}
              desc="Pengguna reguler."
            />
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <h2 className="text-xl font-black text-slate-950">Daftar User</h2>

            <div className="flex h-11 w-full items-center gap-3 rounded-xl border border-slate-200 px-4 md:w-[360px]">
              <Search size={18} className="text-slate-400" />
              <input
                type="text"
                placeholder="Cari nama, email, atau role..."
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="w-full border-0 bg-transparent text-sm font-medium outline-none"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex min-h-[260px] items-center justify-center rounded-2xl border border-slate-100 bg-slate-50">
              <div className="text-center">
                <Loader2 className="mx-auto animate-spin text-purple-700" />
                <p className="mt-3 text-sm font-bold text-slate-600">
                  Memuat data user...
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs font-black uppercase tracking-wide text-slate-500">
                    <th className="py-4 pr-4">User</th>
                    <th className="py-4 pr-4">Role</th>
                    <th className="py-4 pr-4">Status</th>
                    <th className="py-4 pr-4">Tanggal Daftar</th>
                    <th className="py-4 pr-4">Aksi Role</th>
                    <th className="py-4 text-right">Menu</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredUsers.map((user) => (
                    <tr
                      key={user.id}
                      className="border-b border-slate-100 text-sm"
                    >
                      <td className="py-4 pr-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-purple-100 text-purple-700">
                            <Users size={20} />
                          </div>
                          <div>
                            <p className="font-black text-slate-950">
                              {user.fullName}
                            </p>
                            <p className="text-slate-500">{user.email}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 pr-4">
                        <RoleBadge role={user.role} label={user.roleLabel} />
                      </td>

                      <td className="py-4 pr-4">
                        <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-black text-green-700">
                          {user.status}
                        </span>
                      </td>

                      <td className="py-4 pr-4 text-slate-600">
                        {formatDate(user.createdAt)}
                      </td>

                      <td className="py-4 pr-4">
                        {user.role === "umum" && (
                          <button
                            type="button"
                            disabled={updatingId === user.id}
                            onClick={() => updateRole(user.id, "staff_amost")}
                            className="rounded-lg bg-purple-700 px-4 py-2 text-xs font-black text-white hover:bg-purple-800 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {updatingId === user.id
                              ? "Memproses..."
                              : "Jadikan Staff AMOST"}
                          </button>
                        )}

                        {user.role === "staff_amost" && (
                          <button
                            type="button"
                            disabled={updatingId === user.id}
                            onClick={() => updateRole(user.id, "umum")}
                            className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-black text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {updatingId === user.id
                              ? "Memproses..."
                              : "Jadikan Umum"}
                          </button>
                        )}

                        {user.role === "super_admin" && (
                          <span className="text-xs font-bold text-slate-400">
                            Tidak dapat diubah
                          </span>
                        )}
                      </td>

                      <td className="py-4 text-right">
                        <button className="inline-flex h-9 w-9 items-center justify-center rounded-lg hover:bg-slate-100">
                          <MoreHorizontal size={19} />
                        </button>
                      </td>
                    </tr>
                  ))}

                  {filteredUsers.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="py-10 text-center text-sm font-bold text-slate-500"
                      >
                        Tidak ada user yang cocok.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <div className="flex gap-3">
              <UserCog className="mt-0.5 text-amber-700" size={20} />
              <div>
                <p className="text-sm font-black text-amber-900">
                  Catatan Hak Akses
                </p>
                <p className="mt-1 text-sm leading-6 text-amber-800">
                  Tombol ubah role hanya aktif untuk Super Admin. Staff AMOST
                  tidak boleh mengubah role user.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function RoleCard({
  title,
  count,
  desc,
}: {
  title: string;
  count: string;
  desc: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <p className="text-sm font-bold text-slate-500">{title}</p>
      <p className="mt-3 text-3xl font-black text-slate-950">{count}</p>
      <p className="mt-2 text-sm leading-6 text-slate-500">{desc}</p>
    </div>
  );
}

function RoleBadge({ role, label }: { role: string; label: string }) {
  const className =
    role === "super_admin"
      ? "bg-purple-100 text-purple-700"
      : role === "staff_amost"
        ? "bg-blue-100 text-blue-700"
        : "bg-slate-100 text-slate-700";

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-black ${className}`}>
      {label}
    </span>
  );
}

function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }).format(new Date(value));
  } catch {
    return "-";
  }
}
