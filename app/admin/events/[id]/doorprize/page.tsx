import Link from "next/link";
import {
  ArrowLeft,
  Download,
  Gift,
  History,
  Play,
  RotateCcw,
  Trophy,
  Users,
} from "lucide-react";

const prizes = [
  {
    name: "Sepeda Gunung",
    qty: 1,
    status: "Belum Diundi",
  },
  {
    name: "Helm Sepeda",
    qty: 3,
    status: "Belum Diundi",
  },
  {
    name: "Jersey AMOST",
    qty: 5,
    status: "Sudah Diundi",
  },
  {
    name: "Botol Minum",
    qty: 10,
    status: "Belum Diundi",
  },
];

const winners = [
  {
    number: "A-1008",
    name: "Raka Wijaya",
    prize: "Jersey AMOST",
    time: "18 Mei 2026, 10:30",
  },
  {
    number: "A-1021",
    name: "Nina Kartika",
    prize: "Jersey AMOST",
    time: "18 Mei 2026, 10:31",
  },
  {
    number: "A-1045",
    name: "Fajar Maulana",
    prize: "Jersey AMOST",
    time: "18 Mei 2026, 10:32",
  },
];

export default function EventDoorprizePage() {
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
                Doorprize Draw
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
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-wide text-purple-700">
                Gowes Banyumas Challenge
              </p>
              <h1 className="mt-2 text-3xl font-black text-slate-950">
                Undian Nomor Peserta / Doorprize
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                Doorprize diundi berdasarkan nomor peserta valid. Pemenang akan
                disimpan ke riwayat undian.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button className="flex h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 px-5 text-sm font-black text-slate-700 hover:bg-slate-50">
                <RotateCcw size={18} />
                Reset Undian
              </button>
              <button className="flex h-11 items-center justify-center gap-2 rounded-lg bg-purple-700 px-5 text-sm font-black text-white hover:bg-purple-800">
                <Play size={18} />
                Mulai Undian
              </button>
            </div>
          </div>

          <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-4">
            <SummaryCard icon={Users} label="Peserta Valid" value="1.180" />
            <SummaryCard icon={Gift} label="Total Hadiah" value="19" />
            <SummaryCard icon={Trophy} label="Pemenang" value="3" />
            <SummaryCard icon={History} label="Riwayat Undian" value="3" />
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[1fr_420px]">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="rounded-3xl bg-gradient-to-br from-purple-800 to-purple-600 p-8 text-center text-white shadow-xl shadow-purple-200">
              <p className="text-sm font-black uppercase tracking-wide text-purple-100">
                Nomor Peserta Terpilih
              </p>

              <div className="mx-auto mt-7 flex h-40 max-w-[420px] items-center justify-center rounded-3xl bg-white text-purple-700 shadow-2xl">
                <span className="text-6xl font-black tracking-wide">
                  A-1024
                </span>
              </div>

              <p className="mt-6 text-lg font-black">Budi Santoso</p>
              <p className="mt-1 text-sm text-purple-100">
                Hadiah: Sepeda Gunung
              </p>

              <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
                <button className="h-12 rounded-xl bg-white px-7 text-sm font-black text-purple-700">
                  Simpan Pemenang
                </button>
                <button className="h-12 rounded-xl border border-white/40 px-7 text-sm font-black text-white">
                  Undi Ulang
                </button>
              </div>
            </div>

            <div className="mt-6 rounded-xl border border-purple-100 bg-purple-50 p-4">
              <p className="text-sm font-black text-purple-900">
                Mode Layar Besar
              </p>
              <p className="mt-1 text-sm leading-6 text-purple-800">
                Bagian nomor peserta dapat digunakan untuk tampilan proyektor saat
                acara doorprize berlangsung.
              </p>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black text-slate-950">
              Daftar Hadiah
            </h2>

            <div className="mt-5 space-y-3">
              {prizes.map((prize) => (
                <div
                  key={prize.name}
                  className="rounded-xl border border-slate-100 bg-slate-50 p-4"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-black text-slate-950">{prize.name}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        Jumlah: {prize.qty}
                      </p>
                    </div>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-black ${
                        prize.status === "Sudah Diundi"
                          ? "bg-green-100 text-green-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {prize.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-xl font-black text-slate-950">
              Riwayat Pemenang
            </h2>

            <button className="flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 text-sm font-black text-slate-700 hover:bg-slate-50">
              <Download size={17} />
              Export Pemenang
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs font-black uppercase tracking-wide text-slate-500">
                  <th className="py-4 pr-4">Nomor Peserta</th>
                  <th className="py-4 pr-4">Nama</th>
                  <th className="py-4 pr-4">Hadiah</th>
                  <th className="py-4 pr-4">Waktu Undian</th>
                </tr>
              </thead>

              <tbody>
                {winners.map((winner) => (
                  <tr
                    key={`${winner.number}-${winner.prize}`}
                    className="border-b border-slate-100 text-sm"
                  >
                    <td className="py-4 pr-4">
                      <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-black text-purple-700">
                        {winner.number}
                      </span>
                    </td>
                    <td className="py-4 pr-4 font-black text-slate-950">
                      {winner.name}
                    </td>
                    <td className="py-4 pr-4 text-slate-600">
                      {winner.prize}
                    </td>
                    <td className="py-4 pr-4 text-slate-500">
                      {winner.time}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
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
