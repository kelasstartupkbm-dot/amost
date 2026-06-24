"use client";

import AccountAppShellPage from "../components/AccountAppShellPage";
import { CalendarDays, Gift, QrCode, Ticket, Trophy } from "lucide-react";

const tickets = [
  {
    event: "Cetekan Ride",
    number: "A-0002",
    date: "24 Jun 2026",
    status: "Aktif",
  },
  {
    event: "Gabud",
    number: "A-0001",
    date: "25 Jun 2026",
    status: "Aktif",
  },
];

export default function MyTicketsPage() {
  return (
    <AccountAppShellPage
      active="tickets"
      title="My Tickets"
      eyebrow="AMOST TICKETS"
      description="Kartu peserta event, nomor peserta, dan akses event. Nanti halaman ini bisa ditambah QR check-in."
      icon={Ticket}
    >
      <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        {tickets.map((ticket) => (
          <article
            key={`${ticket.event}-${ticket.number}`}
            className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm"
          >
            <div className="border-b border-slate-100 bg-gradient-to-br from-purple-700 to-purple-500 p-5 text-white">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-purple-100">
                AMOST Ticket
              </p>
              <h2 className="mt-3 text-2xl font-black">{ticket.event}</h2>
              <p className="mt-1 text-sm font-semibold text-purple-100">
                {ticket.date}
              </p>
            </div>

            <div className="p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase text-slate-500">
                    Nomor Peserta
                  </p>
                  <p className="mt-1 text-4xl font-black text-purple-700">
                    {ticket.number}
                  </p>
                </div>

                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-slate-50 text-slate-400">
                  <QrCode size={42} />
                </div>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-3">
                <SmallInfo icon={CalendarDays} label="Event" value="Aktif" />
                <SmallInfo icon={Trophy} label="Results" value="Ready" />
                <SmallInfo icon={Gift} label="Doorprize" value="Open" />
              </div>
            </div>
          </article>
        ))}
      </section>
    </AccountAppShellPage>
  );
}

function SmallInfo({
  icon: Icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <Icon className="text-purple-700" size={20} />
      <p className="mt-3 text-xs font-black uppercase text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-black text-slate-950">{value}</p>
    </div>
  );
}
