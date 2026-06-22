import Link from "next/link";
import {
  ArrowLeft,
  Download,
  Search,
  ShieldCheck,
  Ticket,
  Users,
} from "lucide-react";

const participants = [
  {
    number: "A-1001",
    name: "Budi Santoso",
    email: "budi@email.com",
    status: "Valid",
    ticket: "Regular",
  },
  {
    number: "A-1002",
    name: "Siti Aminah",
    email: "siti@email.com",
    status: "Valid",
    ticket: "Regular",
  },
  {
    number: "A-1003",
    name: "Agus Pratama",
    email: "agus@email.com",
    status: "Valid",
    ticket: "VIP",
  },
  {
    number: "A-1004",
    name: "Dewi Lestari",
    email: "dewi@email.com",
    status: "Pending",
    ticket: "Regular",
  },
  {
    number: "A-1005",
    name: "Rian Saputra",
    email: "rian@email.com",
    status: "Valid",
    ticket: "Community",
  },
];

export default function EventParticipantsPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-[1440px] items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/admin/events/demo-event" className="flex items-center gap-3">
            <div className="logo-symbol responsive-logo">A</div>
            <div>
              <div className="text-[26px] font-black leading-none tracking-wide text-purple-700">
                AMOST
              </div>
              <div className="mt-1 text-[8px] font-black uppercase leading-[1.05] tracking-wide text-purple-700">
                Event Participants
              </div>
            </div>
          </Link>

          <Link
            href="/admin/events/demo-event"
            className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
          >
            <ArrowLeft size={17} />
            Detail Event
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-wide text-purple-700">
                Gowes Banyumas Challenge
              </p>
              <h1 className="mt-2 text-3xl font-black text-slate-950">
                Daftar Peserta & Nomor Peserta
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                Nomor peserta dibuat per event dan tidak boleh dobel. Peserta
                valid dapat masuk ke undian doorprize.
              </p>
            </div>

            <button className="flex h-11 items-center justify-center gap-2 rounded-lg bg-purple-700 px-5 text-sm font-black text-white hover:bg-purple-800">
              <Download size={18} />
              Export Peserta
            </button>
          </div>

          <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <SummaryCard icon={Users} label="Total Peserta" value="1.245" />
            <SummaryCard icon={ShieldCheck} label="Peserta Valid" value="1.180" />
            <SummaryCard icon={Ticket} label="Nomor Terbit" value="1.245" />
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <h2 className="text-xl font-black text-slate-950">
              Tabel Peserta
            </h2>

            <div className="flex h-11 w-full items-center gap-3 rounded-xl border border-slate-200 px-4 md:w-[360px]">
              <Search size={18} className="text-slate-400" />
              <input
                type="text"
                placeholder="Cari peserta..."
                className="w-full border-0 bg-transparent text-sm font-medium outline-none"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs font-black uppercase tracking-wide text-slate-500">
                  <th className="py-4 pr-4">Nomor Peserta</th>
                  <th className="py-4 pr-4">Nama</th>
                  <th className="py-4 pr-4">Email</th>
                  <th className="py-4 pr-4">Tiket</th>
                  <th className="py-4 pr-4">Status</th>
                  <th className="py-4 text-right">Doorprize</th>
                </tr>
              </thead>

              <tbody>
                {participants.map((p) => (
                  <tr key={p.number} className="border-b border-slate-100 text-sm">
                    <td className="py-4 pr-4">
                      <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-black text-purple-700">
                        {p.number}
                      </span>
                    </td>
                    <td className="py-4 pr-4 font-black text-slate-950">
                      {p.name}
                    </td>
                    <td className="py-4 pr-4 text-slate-600">{p.email}</td>
                    <td className="py-4 pr-4">{p.ticket}</td>
                    <td className="py-4 pr-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-black ${
                          p.status === "Valid"
                            ? "bg-green-100 text-green-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="py-4 text-right">
                      {p.status === "Valid" ? (
                        <span className="text-xs font-bold text-green-600">
                          Eligible
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-slate-400">
                          Belum eligible
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-5 rounded-xl border border-purple-100 bg-purple-50 p-4">
            <p className="text-sm font-black text-purple-900">
              Aturan Nomor Peserta
            </p>
            <p className="mt-1 text-sm leading-6 text-purple-800">
              Nomor peserta unik untuk setiap event. Peserta valid otomatis dapat
              masuk ke sistem undian doorprize.
            </p>
          </div>
        </div>
      </section>
    </main>
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
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
        <Icon size={22} />
      </div>
      <p className="mt-4 text-3xl font-black text-slate-950">{value}</p>
      <p className="mt-1 text-sm font-semibold text-slate-500">{label}</p>
    </div>
  );
}
