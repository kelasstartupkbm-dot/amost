"use client";

import { Loader2 } from "lucide-react";

export default function AccountPageLoader({
  title = "Memuat AMOST...",
  description = "Mengambil data akun dan aktivitas terbaru.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f8fb] px-4 text-slate-950">
      <div className="w-full max-w-[360px] rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <Loader2 className="mx-auto h-12 w-12 animate-spin text-purple-700" />
        <p className="mt-4 text-xl font-black">{title}</p>
        <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
          {description}
        </p>
      </div>
    </main>
  );
}
