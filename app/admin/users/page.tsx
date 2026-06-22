import Link from "next/link";
import {
  ArrowLeft,
  MoreHorizontal,
  Search,
  ShieldCheck,
  UserCog,
  Users,
} from "lucide-react";

const users = [
  {
    name: "Admin AMOST",
    email: "admin@amostsports.com",
    role: "Super Admin",
    status: "Aktif",
    joined: "10 Juni 2026",
  },
  {
    name: "Staff Event",
    email: "staff@amostsports.com",
    role: "Staff AMOST",
    status: "Aktif",
    joined: "12 Juni 2026",
  },
  {
    name: "Budi Santoso",
    email: "budi@email.com",
    role: "Umum",
    status: "Aktif",
    joined: "20 Juni 2026",
  },
  {
    name: "Siti Aminah",
    email: "siti@email.com",
    role: "Umum",
    status: "Aktif",
    joined: "21 Juni 2026",
  },
];

export default function AdminUsersPage() {
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

<div className="flex items-center gap-3">
  <Link
    href="/admin"
    className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
  >
    <ArrowLeft size={17} />
    Dashboard
  </Link>

  <button
    type="button"
    onClick={async () => {
      await fetch("/api/auth/logout", { method: "POST" });
      router.replace("/login");
      router.refresh();
    }}
    className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-bold text-red-700 hover:bg-red-100"
  >
    Keluar
  </button>
</div>
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

          <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <RoleCard title="Super Admin" count="1" desc="Akses penuh sistem." />
            <RoleCard title="Staff AMOST" count="1" desc="Akses admin terbatas." />
            <RoleCard title="Umum" count="2" desc="Pengguna reguler." />
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <h2 className="text-xl font-black text-slate-950">Daftar User</h2>

            <div className="flex h-11 w-full items-center gap-3 rounded-xl border border-slate-200 px-4 md:w-[360px]">
              <Search size={18} className="text-slate-400" />
              <input
                type="text"
                placeholder="Cari nama atau email..."
                className="w-full border-0 bg-transparent text-sm font-medium outline-none"
              />
            </div>
          </div>

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
                {users.map((user) => (
                  <tr
                    key={user.email}
                    className="border-b border-slate-100 text-sm"
                  >
                    <td className="py-4 pr-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-purple-100 text-purple-700">
                          <Users size={20} />
                        </div>
                        <div>
                          <p className="font-black text-slate-950">
                            {user.name}
                          </p>
                          <p className="text-slate-500">{user.email}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 pr-4">
                      <RoleBadge role={user.role} />
                    </td>

                    <td className="py-4 pr-4">
                      <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-black text-green-700">
                        {user.status}
                      </span>
                    </td>

                    <td className="py-4 pr-4 text-slate-600">{user.joined}</td>

                    <td className="py-4 pr-4">
                      {user.role === "Umum" && (
                        <button className="rounded-lg bg-purple-700 px-4 py-2 text-xs font-black text-white hover:bg-purple-800">
                          Jadikan Staff AMOST
                        </button>
                      )}

                      {user.role === "Staff AMOST" && (
                        <button className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-black text-slate-700 hover:bg-slate-50">
                          Jadikan Umum
                        </button>
                      )}

                      {user.role === "Super Admin" && (
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
              </tbody>
            </table>
          </div>

          <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <div className="flex gap-3">
              <UserCog className="mt-0.5 text-amber-700" size={20} />
              <div>
                <p className="text-sm font-black text-amber-900">
                  Catatan Hak Akses
                </p>
                <p className="mt-1 text-sm leading-6 text-amber-800">
                  Tombol ubah role hanya boleh aktif untuk Super Admin. Staff
                  AMOST tidak boleh mengubah role user.
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

function RoleBadge({ role }: { role: string }) {
  const className =
    role === "Super Admin"
      ? "bg-purple-100 text-purple-700"
      : role === "Staff AMOST"
        ? "bg-blue-100 text-blue-700"
        : "bg-slate-100 text-slate-700";

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-black ${className}`}>
      {role}
    </span>
  );
}
