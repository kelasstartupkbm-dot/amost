import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-slate-100 bg-white px-6 py-8 md:px-10">
      <div className="grid gap-8 md:grid-cols-4">
        <div>
          <Link href="/" className="flex items-center gap-2">
            <div className="amost-mark" />
            <div className="text-xl font-black tracking-wide text-purple-700">
              AMOST
            </div>
          </Link>

          <p className="mt-4 max-w-xs text-sm leading-6 text-slate-500">
            Platform tracking olahraga outdoor dan monitoring event secara
            realtime.
          </p>
        </div>

        <div>
          <h4 className="text-sm font-black text-slate-950">Platform</h4>
          <div className="mt-4 flex flex-col gap-2 text-sm text-slate-600">
            <Link href="/">Beranda</Link>
            <Link href="/events">Event</Link>
            <Link href="/fitur">Fitur</Link>
            <Link href="/komunitas">Komunitas</Link>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-black text-slate-950">Bantuan</h4>
          <div className="mt-4 flex flex-col gap-2 text-sm text-slate-600">
            <Link href="/panduan">Panduan</Link>
            <Link href="/faq">FAQ</Link>
            <Link href="/kontak">Kontak</Link>
            <Link href="/privacy">Kebijakan Privasi</Link>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-black text-slate-950">Download App</h4>
          <p className="mt-4 text-sm leading-6 text-slate-500">
            Aplikasi AMOST tersedia untuk Android dan iOS.
          </p>

          <Link
            href="/download"
            className="mt-4 inline-flex rounded-lg bg-purple-700 px-5 py-3 text-sm font-bold text-white hover:bg-purple-800"
          >
            Download Aplikasi
          </Link>
        </div>
      </div>

      <div className="mt-8 border-t border-slate-100 pt-5 text-sm text-slate-500">
        © 2026 AMOST. All rights reserved.
      </div>
    </footer>
  );
}
