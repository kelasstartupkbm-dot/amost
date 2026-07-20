import Link from "next/link";

export default function AccountDeletionPage() {
  return (
    <main className="min-h-screen bg-[#f7f8fb] text-[#0f172a]">
      <section className="mx-auto max-w-4xl px-6 py-12">
        <Link href="/" className="text-sm font-bold text-purple-700">← Kembali ke Beranda</Link>
        <article className="mt-8 rounded-[32px] bg-white p-8 leading-8 shadow-sm ring-1 ring-slate-200">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-purple-700">Account Deletion</p>
          <h1 className="mt-4 text-4xl font-black tracking-tight">Permintaan Penghapusan Akun AMOST</h1>
          <p className="mt-5 text-slate-600">Pengguna AMOST dapat meminta penghapusan akun dan data terkait akun melalui prosedur di halaman ini.</p>
          <h2 className="mt-8 text-2xl font-black">Cara meminta penghapusan akun</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-6 text-slate-600">
            <li>Kirim permintaan penghapusan akun melalui kanal resmi penyelenggara event atau tim AMOST.</li>
            <li>Sertakan nama akun dan alamat email yang digunakan untuk login.</li>
            <li>Tim AMOST akan melakukan verifikasi sebelum penghapusan akun diproses.</li>
          </ol>
          <h2 className="mt-8 text-2xl font-black">Data yang dihapus</h2>
          <p className="mt-3 text-slate-600">Data akun seperti nama, email, ID pengguna, dan data yang terkait langsung dengan akun dapat dihapus sesuai proses verifikasi.</p>
          <h2 className="mt-8 text-2xl font-black">Data yang mungkin disimpan sementara</h2>
          <p className="mt-3 text-slate-600">Beberapa data dapat disimpan sementara untuk kebutuhan keamanan, audit sistem, penyelesaian event, atau kewajiban administratif.</p>
        </article>
      </section>
    </main>
  );
}
