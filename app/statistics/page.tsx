"use client";

import AccountAppShellPage from "../components/AccountAppShellPage";
import { Activity, BarChart3, Gauge, HeartPulse, Route, Timer } from "lucide-react";

const stats = [
  { label: "Total Distance", value: "41.17 KM", icon: Route },
  { label: "Moving Time", value: "3j 14m", icon: Timer },
  { label: "Avg Speed", value: "16.7 km/jam", icon: Gauge },
  { label: "Training Load", value: "Standby", icon: HeartPulse },
];

export default function StatisticsPage() {
  return (
    <AccountAppShellPage
      active="statistics"
      title="Statistics"
      eyebrow="AMOST ANALYTICS"
      description="Ringkasan statistik latihan dan event. Nanti halaman ini bisa membaca data dari personal training, event results, HR, cadence, dan power."
      icon={BarChart3}
    >
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => (
          <div
            key={item.label}
            className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50 text-purple-700">
              <item.icon size={22} />
            </div>
            <p className="mt-4 text-xs font-black uppercase tracking-wide text-slate-500">
              {item.label}
            </p>
            <p className="mt-2 text-2xl font-black text-slate-950">
              {item.value}
            </p>
          </div>
        ))}
      </section>

      <section className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-black text-slate-950">Grafik Aktivitas</h2>
        <div className="mt-6 flex h-[260px] items-end gap-3 rounded-2xl bg-slate-50 p-5">
          {[35, 52, 38, 72, 46, 88, 64, 55, 76, 92, 58, 70].map((height, index) => (
            <div
              key={index}
              className="flex flex-1 items-end rounded-xl bg-purple-100"
              style={{ height: `${height}%` }}
            >
              <div className="h-full w-full rounded-xl bg-purple-700/70" />
            </div>
          ))}
        </div>
      </section>
    </AccountAppShellPage>
  );
}
