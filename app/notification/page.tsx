"use client";

import AccountAppShellPage from "../components/AccountAppShellPage";
import { Bell, CalendarDays, Gift, ShieldCheck, Trophy } from "lucide-react";

const notifications = [
  {
    title: "Event baru tersedia",
    body: "Cetekan Ride sudah tersedia di AMOST.",
    icon: CalendarDays,
    time: "Hari ini",
  },
  {
    title: "Results siap dilihat",
    body: "Hasil tracking event akan muncul setelah peserta finish.",
    icon: Trophy,
    time: "Hari ini",
  },
  {
    title: "Doorprize aktif",
    body: "Halaman doorprize dapat diakses peserta terdaftar.",
    icon: Gift,
    time: "Hari ini",
  },
  {
    title: "Akses official",
    body: "Official Event dapat mengelola peserta, results, dan doorprize.",
    icon: ShieldCheck,
    time: "Sistem",
  },
];

export default function NotificationPage() {
  return (
    <AccountAppShellPage
      active="notification"
      title="Notification"
      eyebrow="AMOST NOTIFICATION"
      description="Pusat notifikasi akun. Tahap berikutnya bisa disambungkan ke broadcast admin dan update event."
      icon={Bell}
    >
      <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="space-y-3">
          {notifications.map((item) => (
            <div
              key={item.title}
              className="flex gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-purple-50 text-purple-700">
                <item.icon size={22} />
              </div>

              <div className="min-w-0">
                <p className="font-black text-slate-950">{item.title}</p>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  {item.body}
                </p>
                <p className="mt-2 text-xs font-black uppercase text-purple-700">
                  {item.time}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </AccountAppShellPage>
  );
}
