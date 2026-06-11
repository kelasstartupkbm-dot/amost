import Link from "next/link";

export default function DownloadSection() {
  return (
    <section className="bg-white px-[88px] pb-4 pt-0">
      <div className="grid min-h-[260px] grid-cols-[560px_1fr] overflow-hidden rounded-xl border border-purple-200 bg-gradient-to-r from-purple-50 via-white to-purple-50">
        <div className="relative overflow-hidden">
          <div className="download-phone phone-left">
            <div className="download-notch" />
            <div className="px-6 pt-12">
              <p className="text-[11px] font-semibold text-slate-500">
                Aktivitas
              </p>
              <h3 className="mt-3 text-[28px] font-black text-black">28.62</h3>
              <p className="text-[12px] font-bold">km</p>

              <div className="mt-4 grid grid-cols-3 text-center text-[10px]">
                <div>
                  <p className="font-black">2:15:34</p>
                  <p className="text-slate-500">Durasi</p>
                </div>
                <div>
                  <p className="font-black">23.6</p>
                  <p className="text-slate-500">Avg Speed</p>
                </div>
                <div>
                  <p className="font-black">456</p>
                  <p className="text-slate-500">Elevasi</p>
                </div>
              </div>

              <div className="mt-4 h-[90px] rounded-lg bg-slate-100">
                <svg viewBox="0 0 180 90" className="h-full w-full">
                  <path
                    d="M18 66 C38 24 63 70 90 45 C118 17 140 58 166 24"
                    stroke="#7E22CE"
                    strokeWidth="4"
                    fill="none"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="download-phone phone-right">
            <div className="download-notch" />
            <div className="px-5 pt-12">
              <p className="text-[11px] font-semibold text-slate-500">
                Riwayat
              </p>

              <div className="mt-4 flex gap-1">
                <span className="rounded-full bg-purple-700 px-3 py-1 text-[8px] font-bold text-white">
                  Semua
                </span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-[8px] font-bold">
                  Sepeda
                </span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-[8px] font-bold">
                  Lari
                </span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-[8px] font-bold">
                  Trail
                </span>
              </div>

              <div className="mt-4 space-y-3">
                {[25.34, 18.75, 32.1].map((km, index) => (
                  <div
                    key={km}
                    className="grid grid-cols-[1fr_54px] items-center gap-2 rounded-lg bg-slate-100 p-2"
                  >
                    <div>
                      <p className="text-[11px] font-black">{km} km</p>
                      <p className="text-[9px] text-slate-500">
                        {12 + index} Mei 2024
                      </p>
                    </div>
                    <div className="h-9 rounded bg-white">
                      <svg viewBox="0 0 50 30" className="h-full w-full">
                        <path
                          d="M5 20 C15 8 24 22 34 12 C41 6 44 16 48 9"
                          stroke="#7E22CE"
                          strokeWidth="2"
                          fill="none"
                        />
                      </svg>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-center px-10">
          <p className="text-[15px] font-black text-purple-700">
            Track. Achieve. Share.
          </p>

          <h2 className="mt-4 text-[31px] font-black text-black">
            Download Aplikasi AMOST
          </h2>

          <p className="mt-4 max-w-[500px] text-[16px] leading-[1.6] text-slate-700">
            Dapatkan pengalaman tracking terbaik di mobile.
            <br />
            Tersedia di Android dan iOS.
          </p>

          <div className="mt-6 flex items-center gap-4">
            <Link href="/download" className="store-button">
              <span>GET IT ON</span>
              <strong>Google Play</strong>
            </Link>

            <Link href="/download" className="store-button">
              <span>Download on the</span>
              <strong>App Store</strong>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
