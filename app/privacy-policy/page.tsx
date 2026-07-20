import Link from "next/link";

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-[#f7f8fb] text-[#0f172a]">
      <section className="mx-auto max-w-4xl px-6 py-12">
        <Link href="/" className="text-sm font-bold text-purple-700">← Kembali ke Beranda</Link>
        <article className="mt-8 rounded-[32px] bg-white p-8 leading-8 shadow-sm ring-1 ring-slate-200">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-purple-700">Privacy Policy</p>
          <h1 className="mt-4 text-4xl font-black tracking-tight">Kebijakan Privasi AMOST</h1>
          <p className="mt-5 text-slate-600">Kebijakan ini menjelaskan bagaimana AMOST mengumpulkan, menggunakan, menyimpan, dan melindungi data pengguna dalam layanan tracking dan manajemen event olahraga.</p>
          <h2 className="mt-8 text-2xl font-black">Data yang dikumpulkan</h2>
          <p className="mt-3 text-slate-600">AMOST dapat mengumpulkan data akun seperti nama, alamat email, ID pengguna, data lokasi untuk kebutuhan tracking, data aktivitas seperti jarak, durasi, kecepatan, dan data teknis seperti log error, diagnostik, serta ID perangkat.</p>
          <h2 className="mt-8 text-2xl font-black">Penggunaan data</h2>
          <p className="mt-3 text-slate-600">Data digunakan untuk menjalankan fitur aplikasi, termasuk login, pendaftaran event, tracking GPS, live tracking, hasil aktivitas, keamanan akun, dan peningkatan stabilitas aplikasi.</p>
          <h2 className="mt-8 text-2xl font-black">Keamanan data</h2>
          <p className="mt-3 text-slate-600">Data dikirim melalui koneksi yang aman dan digunakan sesuai kebutuhan operasional AMOST. Akses data dibatasi untuk kebutuhan layanan, pengelolaan event, dan dukungan teknis.</p>
          <h2 className="mt-8 text-2xl font-black">Penghapusan akun</h2>
          <p className="mt-3 text-slate-600">Pengguna dapat meminta penghapusan akun melalui halaman <Link className="font-bold text-purple-700" href="/account-deletion">Penghapusan Akun</Link>.</p>
        </article>
      </section>
    </main>
  );
}
