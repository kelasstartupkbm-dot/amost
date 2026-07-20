import Link from "next/link";

export default function TentangPage() {
  return (
    <main className="min-h-screen bg-[#f7f8fb] text-[#0f172a]">
      <section className="mx-auto max-w-6xl px-6 py-12">
        <Link href="/" className="text-sm font-bold text-purple-700">← Kembali ke Beranda</Link>
        <div className="mt-8 rounded-[32px] bg-white p-8 shadow-sm ring-1 ring-slate-200">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-purple-700">About AMOST</p>
          <h1 className="mt-4 max-w-4xl text-4xl font-black tracking-tight md:text-6xl">AMOST adalah platform independen untuk tracking dan manajemen event olahraga.</h1>
          <p className="mt-5 max-w-4xl text-lg leading-8 text-slate-600">AMOST dikembangkan secara independen untuk kebutuhan event olahraga outdoor, pelatihan, live tracking, replay, hasil aktivitas, dan pengelolaan peserta di Indonesia.</p>
        </div>
        <div className="mt-8 rounded-[28px] bg-white p-7 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-2xl font-black">Posisi AMOST</h2>
          <p className="mt-3 leading-8 text-slate-600">AMOST dapat terinspirasi dari perkembangan platform olahraga global, tetapi dikembangkan dengan basis kode, UI, branding, database, dan workflow sendiri. AMOST tidak menggunakan logo, merek, atau identitas pihak ketiga yang dapat menimbulkan kebingungan.</p>
        </div>
      </section>
    </main>
  );
}
