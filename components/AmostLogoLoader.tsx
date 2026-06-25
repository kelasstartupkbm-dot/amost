type AmostLogoLoaderProps = {
  title?: string;
  description?: string;
  showTimeout?: boolean;
  timeoutSeconds?: number;
};

export default function AmostLogoLoader({
  title = "Memuat AMOST...",
  description = "Menyiapkan halaman dan mengambil data terbaru.",
  showTimeout = true,
  timeoutSeconds = 8,
}: AmostLogoLoaderProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 text-slate-950">
      <div className="w-full max-w-md rounded-[2rem] border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex justify-center">
          <img
            src="/amost_logo_wide_.png"
            alt="AMOST"
            className="h-20 w-auto object-contain"
          />
        </div>

        <p className="mt-6 text-xl font-black text-slate-950">
          {title}
        </p>
        <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
          {description}
        </p>

        <div className="mx-auto mt-6 h-3 w-full max-w-xs overflow-hidden rounded-full bg-slate-100">
          <div className="amost-progress-bar h-full w-1/2 rounded-full bg-gradient-to-r from-purple-500 via-purple-700 to-fuchsia-500 shadow-sm" />
        </div>

        <div className="mt-4 flex items-center justify-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-purple-700">
          <span className="h-2 w-2 animate-pulse rounded-full bg-purple-700" />
          Loading
        </div>

        {showTimeout ? (
          <p className="mt-3 text-xs font-bold text-slate-400">
            Maksimal menunggu {timeoutSeconds} detik.
          </p>
        ) : null}
      </div>

      <style>{`
        @keyframes amostProgress {
          0% {
            transform: translateX(-110%);
          }
          55% {
            transform: translateX(75%);
          }
          100% {
            transform: translateX(220%);
          }
        }

        .amost-progress-bar {
          animation: amostProgress 1.45s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
