"use client";

import AccountAppShell from "../components/AccountAppShell";
import AccountPageLoader from "../components/AccountPageLoader";
import Link from "next/link";
import { useEffect, useMemo, useState, type ElementType } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  CalendarDays,
  CheckCircle2,
  Download,
  Home,
  ShieldCheck,
  Trophy,
  UserRound,
} from "lucide-react";

type CurrentUser = {
  id: number;
  fullName?: string | null;
  name?: string | null;
  username?: string | null;
  email?: string | null;
  phone?: string | null;
  status?: string | null;
  role?: string | null;
};

type OfficialAccess = {
  id: number;
  event_id: number | string;
  user_id: number | string;
  permission_level?: string | null;
  status?: string | null;
  notes?: string | null;
  event_title?: string | null;
  event_name?: string | null;
};

function getDisplayName(user: CurrentUser | null) {
  const clean = String(user?.fullName || user?.name || user?.username || "").trim();

  if (clean) return clean;

  const emailName = user?.email?.split("@")[0]?.trim();

  if (emailName) return emailName;

  return "AMOST User";
}

function formatRole(role: string | null | undefined) {
  const clean = String(role || "umum").toLowerCase().replace(/[\s-]+/g, "_");

  if (clean === "super_admin") return "Super Admin";
  if (clean === "staff_amost") return "Staff AMOST";
  if (clean === "umum") return "Umum";

  return clean
    .split("_")
    .filter(Boolean)
    .map((word) => word[0]?.toUpperCase() + word.slice(1))
    .join(" ");
}

export default function AccountProfilePage() {
  const router = useRouter();

  const [user, setUser] = useState<CurrentUser | null>(null);
  const [officialAccess, setOfficialAccess] = useState<OfficialAccess[]>([]);
  const [loading, setLoading] = useState(true);

  const displayName = getDisplayName(user);
  const roleLabel = formatRole(user?.role);
  const hasOfficialAccess = officialAccess.length > 0;

  async function loadAccount() {
    setLoading(true);

    try {
      const response = await fetch("/api/auth/me", {
        method: "GET",
        cache: "no-store",
        credentials: "include",
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.ok || !data?.user) {
        router.replace("/login?next=/account");
        return;
      }

      setUser(data.user);

      try {
        const officialResponse = await fetch("/api/account/event-officials", {
          method: "GET",
          cache: "no-store",
          credentials: "include",
        });

        const officialData = await officialResponse.json().catch(() => null);

        if (officialResponse.ok && officialData?.ok) {
          const rows = Array.isArray(officialData.data)
            ? officialData.data
            : Array.isArray(officialData.items)
              ? officialData.items
              : [];

          setOfficialAccess(rows);
        } else {
          setOfficialAccess([]);
        }
      } catch (officialError) {
        console.error(officialError);
        setOfficialAccess([]);
      }
    } catch (error) {
      console.error(error);
      router.replace("/login?next=/account");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAccount();
  }, []);

  const accountStats = useMemo(
    () => [
      { label: "Role", value: roleLabel, icon: ShieldCheck },
      { label: "Status", value: user?.status || "Aktif", icon: CheckCircle2 },
      {
        label: "Official",
        value: hasOfficialAccess ? `${officialAccess.length} Event` : "-",
        icon: Trophy,
      },
    ],
    [roleLabel, user?.status, hasOfficialAccess, officialAccess.length],
  );

  return (
    <AccountAppShell
      active="profile"
      title="Profile"
      eyebrow="Account Settings"
      description="Halaman ini khusus untuk data akun, role, dan akses official. Dashboard utama berada di /home."
      icon={UserRound}
    >
      {loading ? (
        <AccountPageLoader
          title="Memuat profile..."
          description="Mengambil data akun dan akses official."
        />
      ) : !user ? null : (
        <section className="space-y-5">
          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-purple-700">
                  Profile & Biodata
                </p>
                <h1 className="mt-2 text-3xl font-black text-slate-950">
                  {displayName}
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                  Kelola identitas akun AMOST, role, status akun, dan akses official event.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/home"
                  className="flex h-11 items-center justify-center rounded-xl bg-purple-700 px-5 text-sm font-black text-white hover:bg-purple-800"
                >
                  Buka Home
                </Link>
                <Link
                  href="/account/tracking"
                  className="flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-black text-slate-700 hover:bg-slate-50"
                >
                  Tracking
                </Link>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {accountStats.map((item) => (
              <StatCard
                key={item.label}
                icon={item.icon}
                label={item.label}
                value={item.value}
              />
            ))}
          </section>

          <section className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black text-slate-950">
              Informasi Akun
            </h2>

            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
              <InfoRow label="Nama" value={user.fullName || user.name || user.username || "-"} />
              <InfoRow label="Email" value={user.email || "-"} />
              <InfoRow label="No. HP" value={user.phone || "-"} />
              <InfoRow label="Role" value={roleLabel} />
              <InfoRow label="Status Akun" value={user.status || "-"} />
              <InfoRow
                label="Official Event"
                value={hasOfficialAccess ? `${officialAccess.length} event` : "-"}
              />
            </div>
          </section>

          <section className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-black text-slate-950">
                  Official Access
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Event yang dapat dikelola oleh akun ini.
                </p>
              </div>

              {hasOfficialAccess ? (
                <Link
                  href="/official"
                  className="inline-flex h-10 items-center justify-center rounded-xl bg-green-700 px-4 text-xs font-black text-white hover:bg-green-800"
                >
                  Panel Official
                </Link>
              ) : null}
            </div>

            {hasOfficialAccess ? (
              <div className="mt-5 space-y-3">
                {officialAccess.map((item) => (
                  <Link
                    key={String(item.id)}
                    href={`/official/events/${item.event_id}`}
                    className="block rounded-2xl bg-green-50 p-4 hover:bg-green-100"
                  >
                    <p className="font-black text-slate-950">
                      {item.event_title ||
                        item.event_name ||
                        `Event #${item.event_id}`}
                    </p>
                    <p className="mt-1 text-xs font-black uppercase text-green-700">
                      {item.permission_level || "Official"} •{" "}
                      {item.status || "active"}
                    </p>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="mt-5 rounded-2xl bg-slate-50 p-5 text-sm font-semibold text-slate-500">
                Belum ada akses Official Event.
              </div>
            )}
          </section>
        </section>
      )}
    </AccountAppShell>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50 text-purple-700">
        <Icon size={22} />
      </div>
      <p className="mt-5 text-xs font-black uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-2xl font-black text-slate-950">{value}</p>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="text-xs font-black uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-2 break-words text-sm font-black text-slate-950">
        {value}
      </p>
    </div>
  );
}
