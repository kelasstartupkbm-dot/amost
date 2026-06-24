"use client";

import AccountAppShellPage from "../components/AccountAppShellPage";
import { Award, Bike, Medal, Star, Trophy } from "lucide-react";

const achievements = [
  {
    title: "First Ride",
    description: "Menyelesaikan aktivitas pertama di AMOST.",
    icon: Bike,
    status: "Unlocked",
  },
  {
    title: "Event Finisher",
    description: "Menyelesaikan event resmi AMOST.",
    icon: Trophy,
    status: "Progress",
  },
  {
    title: "Community Starter",
    description: "Aktif di timeline komunitas.",
    icon: Star,
    status: "Progress",
  },
];

export default function AchievementPage() {
  return (
    <AccountAppShellPage
      active="achievement"
      title="Achievement"
      eyebrow="AMOST BADGES"
      description="Badge dan pencapaian peserta. Tahap berikutnya bisa dihitung otomatis dari results, latihan, dan event."
      icon={Medal}
    >
      <section className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {achievements.map((item) => (
          <article
            key={item.title}
            className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-50 text-purple-700">
              <item.icon size={28} />
            </div>

            <h2 className="mt-5 text-xl font-black text-slate-950">
              {item.title}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              {item.description}
            </p>

            <span
              className={`mt-5 inline-flex rounded-full px-3 py-1 text-xs font-black uppercase ${
                item.status === "Unlocked"
                  ? "bg-green-50 text-green-700"
                  : "bg-yellow-50 text-yellow-700"
              }`}
            >
              {item.status}
            </span>
          </article>
        ))}
      </section>

      <section className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <Award className="text-purple-700" size={36} />
          <div>
            <h2 className="text-xl font-black text-slate-950">
              Roadmap Achievement
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              Badge bisa dibuat dari jarak kumulatif, jumlah event finish, ranking, dan konsistensi latihan.
            </p>
          </div>
        </div>
      </section>
    </AccountAppShellPage>
  );
}
