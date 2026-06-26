"use client";

import AccountAppShell from "../../components/AccountAppShell";
import AccountTrackingData from "@/components/account/AccountTrackingData";
import Link from "next/link";
import {
  Activity,
  Navigation,
  Route,
  Satellite,
  Trophy,
} from "lucide-react";

export default function AccountTrackingPage() {
  const rightPanel = (
    <section className="space-y-5">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-lg font-black text-slate-950">Tracking</h3>
          <Satellite className="text-purple-700" size={22} />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <InfoBox label="Database" value="Real" />
          <InfoBox label="Event" value="Aktif" />
          <InfoBox label="Live" value="Ready" />
          <InfoBox label="Result" value="Ready" />
        </div>

        <p className="mt-4 text-sm font-semibold leading-6 text-slate-500">
          Data tracking diambil dari registrasi event, result event, live tracking, dan latihan mandiri.
        </p>
      </section>

      <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-lg font-black text-slate-950">Aksi Cepat</h3>

        <div className="mt-4 grid grid-cols-1 gap-3">
          <QuickLink href="/account/events" icon={Route} label="My Events" />
          <QuickLink href="/account/events/2/view" icon={Navigation} label="Contoh Live View" />
          <QuickLink href="/account/events/2/results" icon={Trophy} label="Contoh Results" />
        </div>
      </section>
    </section>
  );

  return (
    <AccountAppShell
      active="tracking"
      title="Data Tracking Saya"
      eyebrow="AMOST TRACKING"
      description="Pantau data tracking akun, event yang diikuti, live tracking, result, GPX, dan latihan mandiri."
      icon={Activity}
      rightPanel={rightPanel}
    >
      <AccountTrackingData />
    </AccountAppShell>
  );
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="text-xs font-black uppercase text-slate-400">{label}</p>
      <p className="mt-1 text-xl font-black text-slate-950">{value}</p>
    </div>
  );
}

function QuickLink({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: any;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex h-14 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-black text-slate-700 hover:bg-purple-50 hover:text-purple-700"
    >
      <Icon size={20} />
      {label}
    </Link>
  );
}
