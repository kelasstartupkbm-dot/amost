"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Eye, EyeOff, Lock, Mail } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        setMessage(data.message || "Login gagal.");
        return;
      }

      router.push(data.redirectTo || "/account");
      router.refresh();
    } catch (error) {
      console.error(error);
      setMessage("Terjadi kesalahan koneksi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-slate-50">
      <div className="mx-auto grid min-h-screen max-w-[1280px] grid-cols-1 lg:grid-cols-2">
        <section className="hidden items-center justify-center px-10 lg:flex">
          <div className="max-w-xl">
            <Link href="/" className="mb-10 flex items-center gap-4">
              <div className="logo-symbol">A</div>

              <div>
                <div className="text-[36px] font-black leading-none tracking-wide text-purple-700">
                  AMOST
                </div>
                <div className="mt-1 text-[10px] font-black uppercase leading-[1.05] tracking-wide text-purple-700">
                  Amikom Mobile Outdoor
                  <br />
                  Sport Tracking
                </div>
              </div>
            </Link>

            <h1 className="text-[54px] font-black leading-tight tracking-[-1.6px] text-slate-950">
              Masuk ke
              <br />
              Platform Tracking
              <br />
              <span className="text-purple-700">Olahraga Outdoor</span>
            </h1>

            <p className="mt-6 max-w-md text-lg leading-8 text-slate-600">
              Pantau event, aktivitas, tiket, dan pencapaian olahraga outdoor
              kamu melalui akun AMOST.
            </p>

            <div className="mt-10 rounded-2xl border border-purple-100 bg-white/70 p-6 shadow-xl shadow-purple-100">
              <p className="text-sm font-bold uppercase tracking-wide text-purple-700">
                Role AMOST
              </p>

              <div className="mt-4 grid gap-3">
                <RoleInfo
                  title="Super Admin"
                  desc="Akses penuh pengelolaan sistem."
                />
                <RoleInfo
                  title="Staff AMOST"
                  desc="Mengelola event, peserta, dan doorprize."
                />
                <RoleInfo
                  title="Umum"
                  desc="Mengikuti event dan melihat aktivitas pribadi."
                />
              </div>
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center px-5 py-10 sm:px-8">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-7 shadow-2xl shadow-slate-200 sm:p-9">
            <Link
              href="/"
              className="mb-8 inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-purple-700"
            >
              <ArrowLeft size={17} />
              Kembali ke Beranda
            </Link>

            <div className="mb-8 lg:hidden">
              <Link href="/" className="flex items-center gap-3">
                <div className="logo-symbol responsive-logo">A</div>
                <div>
                  <div className="text-[28px] font-black leading-none tracking-wide text-purple-700">
                    AMOST
                  </div>
                  <div className="mt-1 text-[8px] font-black uppercase leading-[1.05] tracking-wide text-purple-700">
                    Amikom Mobile Outdoor
                    <br />
                    Sport Tracking
                  </div>
                </div>
              </Link>
            </div>

            <h2 className="text-3xl font-black text-slate-950">
              Login Akun
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Masuk menggunakan email dan password akun AMOST kamu.
            </p>

            {message && (
              <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-bold leading-6 text-red-700">
                {message}
              </div>
            )}

            <form onSubmit={handleLogin} className="mt-8 space-y-5">
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-800">
                  Email
                </label>
                <div className="flex h-13 items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 focus-within:border-purple-600">
                  <Mail size={19} className="text-slate-400" />
                  <input
                    type="email"
                    placeholder="nama@email.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="h-13 w-full border-0 bg-transparent text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-800">
                  Password
                </label>
                <div className="flex h-13 items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 focus-within:border-purple-600">
                  <Lock size={19} className="text-slate-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Masukkan password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="h-13 w-full border-0 bg-transparent text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-slate-400"
                  >
                    {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-600">
                  <input type="checkbox" className="h-4 w-4 accent-purple-700" />
                  Ingat saya
                </label>

                <Link href="#" className="text-sm font-bold text-purple-700">
                  Lupa password?
                </Link>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="h-13 w-full rounded-xl bg-purple-700 text-sm font-black text-white shadow-lg shadow-purple-200 transition hover:bg-purple-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Memproses..." : "Masuk"}
              </button>
            </form>

            <p className="mt-7 text-center text-sm text-slate-600">
              Belum punya akun?{" "}
              <Link href="/register" className="font-black text-purple-700">
                Daftar sekarang
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

function RoleInfo({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-white p-4">
      <p className="text-sm font-black text-slate-950">{title}</p>
      <p className="mt-1 text-sm leading-6 text-slate-500">{desc}</p>
    </div>
  );
}
