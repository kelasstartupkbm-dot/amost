"use client";

import AccountAppShellPage from "../components/AccountAppShellPage";
import { Activity, Bike, CalendarDays, Clock3, MapPin, Route } from "lucide-react";

const activities = [
  {
    title: "Gowes Pagi Purwokerto",
    meta: "Sepeda • 22 Juni 2026",
    distance: "28.62 KM",
    duration: "1 jam 34 menit",
    status: "Selesai",
  },
  {
    title: "Jalan Sehat AMOST",
    meta: "Jalan Sehat • 18 Juni 2026",
    distance: "5.10 KM",
    duration: "58 menit",
    status: "Selesai",
  },
  {
    title: "Latihan Sore",
    meta: "Latihan Mandiri • 15 Juni 2026",
    distance: "7.45 KM",
    duration: "42 menit",
    status: "Selesai",
  },
];

export default function MyActivitiesPage() {
  return (
    <AccountAppShellPage
      active="activities"
      title="My Activities"
      eyebrow="AMOST ACTIVITY"
      description="Riwayat aktivitas dan latihan pribadi. Tahap berikutnya halaman ini akan disambungkan ke personal_trainings dari Android."
      icon={Activity}
    >
      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <SummaryCard icon={Bike} label="Aktivitas" value={String(activities.length)} />
        <SummaryCard icon={Route} label="Total Jarak" value="41.17 KM" />
        <SummaryCard icon={Clock3} label="Total Durasi" value="3j 14m" />
      </section>

      <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-xl font-black text-slate-950">Riwayat Aktivitas</h2>

        <div className="mt-5 space-y-3">
          {activities.map((item) => (
            <div
              key={item.title}
              className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:flex-row md:items-center md:justify-between"
            >
              <div>
                <p className="font-black text-slate-950">{item.title}</p>
                <p className="mt-1 text-sm font-semibold text-slate-500">
                  {item.meta}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge>{item.distance}</Badge>
                <Badge>{item.duration}</Badge>
                <Badge tone="green">{item.status}</Badge>
              </div>
            </div>
          ))}
        </div>
      </section>
    </AccountAppShellPage>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50 text-purple-700">
        <Icon size={22} />
      </div>
      <p className="mt-4 text-xs font-black uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-2xl font-black text-slate-950">{value}</p>
    </div>
  );
}

function Badge({
  children,
  tone = "purple",
}: {
  children: string;
  tone?: "purple" | "green";
}) {
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-black uppercase ${
        tone === "green"
          ? "bg-green-50 text-green-700"
          : "bg-purple-50 text-purple-700"
      }`}
    >
      {children}
    </span>
  );
}
