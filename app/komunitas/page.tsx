import Link from "next/link";

export default function KomunitasPage() {
  return (
    <main className="min-h-screen bg-[#f7f8fb] text-[#0f172a]">
      <section className="mx-auto max-w-6xl px-6 py-12">
        <Link href="/" className="text-sm font-bold text-purple-700">← Kembali ke Beranda</Link>
        <div className="mt-8 rounded-[32px] bg-white p-8 shadow-sm ring-1 ring-slate-200">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-purple-700">AMOST Community</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-black tracking-tight md:text-6xl">Ruang komunitas olahraga outdoor.</h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">Halaman komunitas disiapkan untuk menampilkan komunitas, event, aktivitas, dan kolaborasi olahraga outdoor yang terhubung dengan AMOST.</p>
        </div>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          <div className="rounded-[28px] bg-white p-7 shadow-sm ring-1 ring-slate-200"><h2 className="text-xl font-black">Komunitas Sepeda</h2><p className="mt-3 leading-7 text-slate-600">Mendukung event gowes, latihan, challenge, dan live tracking.</p></div>
          <div className="rounded-[28px] bg-white p-7 shadow-sm ring-1 ring-slate-200"><h2 className="text-xl font-black">Penyelenggara Event</h2><p className="mt-3 leading-7 text-slate-600">Membantu panitia mengelola peserta, official, hasil, dan doorprize.</p></div>
          <div className="rounded-[28px] bg-white p-7 shadow-sm ring-1 ring-slate-200"><h2 className="text-xl font-black">Peserta</h2><p className="mt-3 leading-7 text-slate-600">Mendukung pengalaman event yang lebih aman, rapi, dan terdokumentasi.</p></div>
        </div>
      </section>
    </main>
  );
}
