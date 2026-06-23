"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, Eye, EyeOff, Lock, Mail } from "lucide-react";

type LoginResponse = {
  ok?: boolean;
  message?: string;
  user?: {
    id: number;
    fullName?: string;
    email?: string;
    role?: string;
  };
};

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const cleanedEmail = email.trim().toLowerCase();

    if (!cleanedEmail || !password) {
      setError("Email dan password wajib diisi.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: cleanedEmail,
          password,
          rememberMe,
        }),
      });

      const data = (await response.json()) as LoginResponse;

      if (!response.ok || !data.ok) {
        setError(data.message || "Login gagal. Periksa email dan password.");
        return;
      }

      router.replace("/account");
      router.refresh();
    } catch (err) {
      console.error(err);
      setError("Terjadi gangguan koneksi. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen overflow-hidden bg-white text-slate-950">
      <section className="mx-auto grid min-h-screen max-w-[1440px] grid-cols-1 lg:grid-cols-2">
        <div className="relative hidden flex-col justify-center px-8 py-12 lg:flex lg:px-20 xl:px-24">
          <div className="absolute left-0 top-0 h-72 w-72 rounded-full bg-purple-100/60 blur-3xl" />
          <div className="absolute bottom-12 right-12 h-64 w-64 rounded-full bg-purple-50 blur-3xl" />

          <div className="relative z-10 max-w-[560px]">
            <Link href="/" className="inline-flex items-center">
              <img
                src="/amost_logo_wide_.png"
                alt="AMOST"
                className="h-[70px] w-auto object-contain lg:h-[82px]"
              />
            </Link>

            <h1 className="mt-16 text-[56px] font-black leading-[1.08] tracking-tight text-slate-950 xl:text-[66px]">
              Masuk ke
              <br />
              Platform Tracking
              <br />
              <span className="text-purple-700">Olahraga Outdoor</span>
            </h1>

            <p className="mt-8 max-w-[520px] text-[20px] leading-9 text-slate-600">
              Pantau event, aktivitas, tiket, dan pencapaian olahraga outdoor
              kamu melalui akun AMOST.
            </p>

            <div className="mt-14 rounded-2xl border border-purple-100 bg-white/80 p-6 shadow-sm backdrop-blur">
              <p className="text-sm font-black uppercase tracking-wide text-purple-700">
                Role AMOST
              </p>

              <div className="mt-5 space-y-3">
                <RoleCard
                  title="Super Admin"
                  description="Akses penuh pengelolaan sistem."
                />
                <RoleCard
                  title="Staff AMOST"
                  description="Mengelola event, peserta, dan doorprize."
                />
                <RoleCard
                  title="Umum"
                  description="Mengikuti event dan melihat aktivitas pribadi."
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10 sm:px-6 lg:bg-white lg:px-10">
          <div className="w-full max-w-[460px] rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8 lg:max-w-[520px] lg:p-10">
            <div className="mb-8 lg:hidden">
              <Link href="/" className="inline-flex items-center">
                <img
                  src="/amost_logo_wide_.png"
                  alt="AMOST"
                  className="h-[58px] w-auto object-contain"
                />
              </Link>
            </div>

            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm font-black text-slate-600 transition hover:text-purple-700"
            >
              <ArrowLeft size={18} />
              Kembali ke Beranda
            </Link>

            <div className="mt-10">
              <h2 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                Login Akun
              </h2>
              <p className="mt-4 max-w-[360px] text-sm leading-7 text-slate-500 sm:text-base">
                Masuk menggunakan email dan password akun AMOST kamu.
              </p>
            </div>

            {error && (
              <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-8 space-y-6">
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-black text-slate-950"
                >
                  Email
                </label>
                <div className="flex h-14 overflow-hidden rounded-xl border border-slate-200 bg-white focus-within:border-purple-500 focus-within:ring-4 focus-within:ring-purple-100">
                  <div className="flex w-14 items-center justify-center bg-slate-50 text-slate-400">
                    <Mail size={20} />
                  </div>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    autoComplete="email"
                    placeholder="email@example.com"
                    className="h-full min-w-0 flex-1 bg-transparent px-4 text-sm font-bold text-slate-950 outline-none placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-black text-slate-950"
                >
                  Password
                </label>
                <div className="flex h-14 overflow-hidden rounded-xl border border-slate-200 bg-white focus-within:border-purple-500 focus-within:ring-4 focus-within:ring-purple-100">
                  <div className="flex w-14 items-center justify-center bg-slate-50 text-slate-400">
                    <Lock size={20} />
                  </div>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete="current-password"
                    placeholder="Masukkan password"
                    className="h-full min-w-0 flex-1 bg-transparent px-4 text-sm font-bold text-slate-950 outline-none placeholder:text-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="flex w-14 items-center justify-center text-slate-400 transition hover:text-purple-700"
                    aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between gap-4">
                <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-slate-600">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(event) => setRememberMe(event.target.checked)}
                    className="h-5 w-5 rounded border-slate-300 text-purple-700 focus:ring-purple-500"
                  />
                  Ingat saya
                </label>

                <Link
                  href="#"
                  className="text-sm font-black text-purple-700 hover:text-purple-900"
                >
                  Lupa password?
                </Link>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex h-14 w-full items-center justify-center rounded-xl bg-purple-700 px-6 text-base font-black text-white shadow-lg shadow-purple-200 transition hover:bg-purple-800 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? "Memproses..." : "Masuk"}
              </button>
            </form>

            <p className="mt-8 text-center text-sm font-semibold text-slate-500">
              Belum punya akun?{" "}
              <Link
                href="/register"
                className="font-black text-purple-700 hover:text-purple-900"
              >
                Daftar sekarang
              </Link>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

function RoleCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-white px-5 py-4 shadow-sm">
      <p className="font-black text-slate-950">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
    </div>
  );
}
