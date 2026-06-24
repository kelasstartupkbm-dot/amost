"use client";

import AccountAppShellPage from "../components/AccountAppShellPage";
import { Bell, Lock, Settings, ShieldCheck, Smartphone, UserRound } from "lucide-react";

const settings = [
  {
    title: "Profile",
    description: "Kelola nama, email, dan informasi akun.",
    icon: UserRound,
    href: "/account",
  },
  {
    title: "Notification",
    description: "Pengaturan notifikasi event dan komunitas.",
    icon: Bell,
    href: "/notification",
  },
  {
    title: "Privacy",
    description: "Atur visibilitas postingan dan aktivitas.",
    icon: Lock,
    href: "/settings",
  },
  {
    title: "Device",
    description: "Informasi perangkat tracking dan aplikasi Android.",
    icon: Smartphone,
    href: "/download",
  },
  {
    title: "Security",
    description: "Status akun, session, dan akses official.",
    icon: ShieldCheck,
    href: "/account",
  },
];

export default function SettingsPage() {
  return (
    <AccountAppShellPage
      active="settings"
      title="Settings"
      eyebrow="AMOST SETTINGS"
      description="Pusat pengaturan akun AMOST. Tahap ini masih UI dasar sebelum edit profile dan preferensi disambungkan ke database."
      icon={Settings}
    >
      <section className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {settings.map((item) => (
          <a
            key={item.title}
            href={item.href}
            className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm hover:bg-purple-50"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-50 text-purple-700">
              <item.icon size={24} />
            </div>

            <h2 className="mt-5 text-xl font-black text-slate-950">
              {item.title}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              {item.description}
            </p>
          </a>
        ))}
      </section>
    </AccountAppShellPage>
  );
}
