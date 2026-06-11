import Link from "next/link";

export default function Header() {
  return (
    <header className="relative z-30 flex h-20 items-center justify-between bg-white px-8 md:px-10">
      <Link href="/" className="flex items-center gap-2">
        <div className="amost-mark" />
        <div className="text-xl font-black tracking-wide text-purple-700">
          AMOST
        </div>
      </Link>

      <nav className="hidden items-center gap-10 text-sm font-bold text-slate-900 md:flex">
        <Link href="/">Beranda</Link>
        <Link href="/events">Event</Link>
        <Link href="/fitur">Fitur</Link>
        <Link href="/komunitas">Komunitas</Link>
        <Link href="/tentang">Tentang</Link>
      </nav>

      <div className="flex items-center gap-4">
        <Link href="/login" className="hidden text-sm font-black text-slate-950 sm:block">
          Masuk
        </Link>

        <Link
          href="/register"
          className="rounded-xl bg-purple-700 px-6 py-3 text-sm font-black text-white shadow-lg shadow-purple-200 transition hover:bg-purple-800"
        >
          Daftar
        </Link>
      </div>
    </header>
  );
}
