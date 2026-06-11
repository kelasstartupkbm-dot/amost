import Link from "next/link";
import { Search } from "lucide-react";

export default function Header() {
  return (
    <header className="fixed left-0 top-0 z-[9999] w-full border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur-xl">
      <div className="mx-auto flex h-[96px] max-w-[1440px] items-center justify-between px-8 lg:px-[88px]">
        <Link href="/" className="flex items-center gap-4">
          <div className="logo-symbol">A</div>

          <div>
            <div className="text-[34px] font-black leading-none tracking-wide text-purple-700">
              AMOST
            </div>
            <div className="mt-1 text-[9px] font-black uppercase leading-[1.05] tracking-wide text-purple-700">
              Amikom Mobile Outdoor Tracking
              <br />
              Sport Tracking
            </div>
          </div>
        </Link>

        <nav className="hidden items-center gap-10 text-[15px] font-medium text-slate-800 lg:flex">
          <Link className="font-bold text-purple-700" href="/">
            Beranda
          </Link>
          <Link href="/events">Events</Link>
          <Link href="#cara-kerja">Cara Kerja</Link>
          <Link href="/fitur">Fitur</Link>
          <Link href="/komunitas">Komunitas</Link>
          <Link href="/tentang">Tentang</Link>
          <Link href="/kontak">Kontak</Link>
        </nav>

        <div className="flex items-center gap-4">
          <button className="hidden h-11 w-11 items-center justify-center rounded-full text-slate-950 transition hover:bg-slate-100 md:flex">
            <Search size={25} strokeWidth={2.3} />
          </button>

          <Link
            href="/login"
            className="hidden h-12 items-center justify-center rounded-md border border-purple-700 px-7 text-[15px] font-bold text-purple-700 transition hover:bg-purple-50 sm:flex"
          >
            Login
          </Link>

          <Link
            href="/register"
            className="flex h-12 items-center justify-center rounded-md bg-purple-700 px-7 text-[15px] font-bold text-white shadow-md shadow-purple-200 transition hover:bg-purple-800"
          >
            Register
          </Link>
        </div>
      </div>
    </header>
  );
}
