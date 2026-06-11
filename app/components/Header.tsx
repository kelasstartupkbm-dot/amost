import Link from "next/link";

export default function Header() {
  return (
    <header className="relative z-20 flex h-20 items-center justify-between border-b border-slate-100 bg-white px-6 md:px-8">
      <Link href="/" className="flex items-center gap-2">
        <div className="amost-mark" />
        <div className="text-xl font-black tracking-wide text-purple-700">
          AMOST
        </div>
      </Link>

      <nav className="hidden items-center gap-10 text-sm font-semibold text-slate-800 md:flex">
        <Link href="/">Beranda</Link>
        <Link href="/events">Event</Link>
        <Link href="/fitur">Fitur</Link>
        <Link href="/komunitas">Komunitas</Link>
        <Link href="/tentang">Tentang</Link>
      </nav>

      <div className="flex items-center gap-3">
        <Link
          href="/login"
          className="hidden text-sm font-bold text-slate-900 sm:block"
        >
          Masuk
        </Link>

        <Link
          href="/register"
          className="rounded-lg bg-purple-700 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-purple-200 transition hover:bg-purple-800"
        >
          Daftar
        </Link>
      </div>
    </header>
  );
}
