import Link from "next/link";

const features = [
  ["Live Tracking", "Pantau posisi peserta, status GPS, jarak, checkpoint, dan progres event secara real-time."],
  ["Event Management", "Kelola event, peserta, official event, kuota, rute, checkpoint, dan informasi event."],
  ["Results Event", "Tampilkan hasil peserta, jarak, durasi, kecepatan rata-rata, status finish, dan riwayat aktivitas."],
  ["Doorprize", "Undian nomor peserta per event dengan layar publik dan riwayat pemenang."],
];

export default function FiturPage() {
  return (
    <main className="min-h-screen bg-[#f7f8fb] text-[#0f172a]">
      <section className="mx-auto max-w-6xl px-6 py-12">
        <Link href="/" className="text-sm font-bold text-purple-700">← Kembali ke Beranda</Link>
        <div className="mt-8 rounded-[32px] bg-white p-8 shadow-sm ring-1 ring-slate-200">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-purple-700">AMOST Features</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-black tracking-tight md:text-6xl">Fitur untuk event olahraga outdoor.</h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">AMOST membantu penyelenggara, official, peserta, dan komunitas dalam mengelola event, tracking, hasil aktivitas, dan pengalaman event.</p>
        </div>
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {features.map(([title, description]) => (
            <article key={title} className="rounded-[28px] bg-white p-7 shadow-sm ring-1 ring-slate-200">
              <h2 className="text-2xl font-black">{title}</h2>
              <p className="mt-3 leading-7 text-slate-600">{description}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
