import Link from "next/link";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto grid max-w-[1440px] gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.2fr_0.8fr_0.8fr] lg:px-[88px]">
        <div>
          <Link href="/" className="inline-flex items-center" aria-label="AMOST Beranda">
            <img
              src="/amost_logo_wide_.png"
              alt=""
              className="block h-[42px] w-auto object-contain"
            />
          </Link>

          <p className="mt-4 max-w-md text-sm leading-6 text-slate-600">
            AMOST adalah platform tracking olahraga outdoor untuk event, latihan,
            komunitas, dan pemantauan aktivitas secara realtime.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-black uppercase tracking-wide text-slate-950">
            Navigasi
          </h3>
          <div className="mt-4 flex flex-col gap-3 text-sm font-semibold text-slate-600">
            <Link href="/events" className="hover:text-purple-700">Events</Link>
            <Link href="/fitur" className="hover:text-purple-700">Fitur</Link>
            <Link href="/komunitas" className="hover:text-purple-700">Komunitas</Link>
            <Link href="/tentang" className="hover:text-purple-700">Tentang</Link>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-black uppercase tracking-wide text-slate-950">
            Akses
          </h3>
          <div className="mt-4 flex flex-col gap-3 text-sm font-semibold text-slate-600">
            <Link href="/login" className="hover:text-purple-700">Login</Link>
            <Link href="/register" className="hover:text-purple-700">Register</Link>
            <Link href="/kontak" className="hover:text-purple-700">Kontak</Link>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-200 px-4 py-5 text-center text-xs font-semibold text-slate-500 sm:px-6 lg:px-[88px]">
        © {year} AMOST. All rights reserved.
      </div>
    </footer>
  );
}
