"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, Eye, EyeOff, Lock, Mail, Phone, User } from "lucide-react";

type RegisterResponse = {
  ok?: boolean;
  message?: string;
  user?: {
    id: number;
    fullName?: string;
    email?: string;
    role?: string;
  };
};

export default function RegisterPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const cleanedFullName = fullName.trim();
    const cleanedEmail = email.trim().toLowerCase();
    const cleanedPhone = phone.trim();

    if (!cleanedFullName || !cleanedEmail || !password || !confirmPassword) {
      setError("Nama lengkap, email, password, dan konfirmasi password wajib diisi.");
      return;
    }

    if (password.length < 6) {
      setError("Password minimal 6 karakter.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Konfirmasi password tidak sama.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName: cleanedFullName,
          email: cleanedEmail,
          phone: cleanedPhone || null,
          password,
        }),
      });

      const data = (await response.json()) as RegisterResponse;

      if (!response.ok || !data.ok) {
        setError(data.message || "Registrasi gagal. Coba lagi.");
        return;
      }

      router.replace("/login?registered=1");
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
              Buat Akun
              <br />
              dan Mulai
              <br />
              <span className="text-purple-700">Tracking Aktivitas</span>
            </h1>

            <p className="mt-8 max-w-[520px] text-[20px] leading-9 text-slate-600">
              Akun baru otomatis terdaftar sebagai pengguna Umum. Role Staff
              AMOST hanya dapat ditentukan oleh Super Admin.
            </p>

            <div className="mt-14 rounded-2xl border border-purple-100 bg-white/80 p-6 shadow-sm backdrop-blur">
              <p className="text-sm font-black uppercase tracking-wide text-purple-700">
                Aturan Register
              </p>

              <ul className="mt-5 space-y-3 text-sm font-semibold leading-7 text-slate-600">
                <li>• User baru otomatis menjadi Umum.</li>
                <li>• Staff AMOST ditetapkan oleh Super Admin.</li>
                <li>• Gunakan email aktif untuk login ke akun.</li>
                <li>• Nomor HP dapat dilengkapi untuk kebutuhan event.</li>
              </ul>
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
                Daftar Akun
              </h2>
              <p className="mt-4 max-w-[390px] text-sm leading-7 text-slate-500 sm:text-base">
                Buat akun AMOST. Setelah register, akun otomatis menjadi
                pengguna Umum.
              </p>
            </div>

            {error && (
              <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <div>
                <label
                  htmlFor="fullName"
                  className="mb-2 block text-sm font-black text-slate-950"
                >
                  Nama Lengkap
                </label>
                <InputShell icon={<User size={20} />}>
                  <input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    autoComplete="name"
                    placeholder="Nama lengkap"
                    className="h-full min-w-0 flex-1 bg-transparent px-4 text-sm font-bold text-slate-950 outline-none placeholder:text-slate-400"
                  />
                </InputShell>
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-black text-slate-950"
                >
                  Email
                </label>
                <InputShell icon={<Mail size={20} />}>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    autoComplete="email"
                    placeholder="email@example.com"
                    className="h-full min-w-0 flex-1 bg-transparent px-4 text-sm font-bold text-slate-950 outline-none placeholder:text-slate-400"
                  />
                </InputShell>
              </div>

              <div>
                <label
                  htmlFor="phone"
                  className="mb-2 block text-sm font-black text-slate-950"
                >
                  Nomor HP
                </label>
                <InputShell icon={<Phone size={20} />}>
                  <input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    autoComplete="tel"
                    placeholder="08xxxxxxxxxx"
                    className="h-full min-w-0 flex-1 bg-transparent px-4 text-sm font-bold text-slate-950 outline-none placeholder:text-slate-400"
                  />
                </InputShell>
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-black text-slate-950"
                >
                  Password
                </label>
                <InputShell icon={<Lock size={20} />}>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete="new-password"
                    placeholder="Minimal 6 karakter"
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
                </InputShell>
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="mb-2 block text-sm font-black text-slate-950"
                >
                  Konfirmasi Password
                </label>
                <InputShell icon={<Lock size={20} />}>
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    autoComplete="new-password"
                    placeholder="Ulangi password"
                    className="h-full min-w-0 flex-1 bg-transparent px-4 text-sm font-bold text-slate-950 outline-none placeholder:text-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((value) => !value)}
                    className="flex w-14 items-center justify-center text-slate-400 transition hover:text-purple-700"
                    aria-label={
                      showConfirmPassword
                        ? "Sembunyikan konfirmasi password"
                        : "Tampilkan konfirmasi password"
                    }
                  >
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </InputShell>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex h-14 w-full items-center justify-center rounded-xl bg-purple-700 px-6 text-base font-black text-white shadow-lg shadow-purple-200 transition hover:bg-purple-800 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? "Memproses..." : "Daftar"}
              </button>
            </form>

            <p className="mt-8 text-center text-sm font-semibold text-slate-500">
              Sudah punya akun?{" "}
              <Link
                href="/login"
                className="font-black text-purple-700 hover:text-purple-900"
              >
                Login sekarang
              </Link>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

function InputShell({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-14 overflow-hidden rounded-xl border border-slate-200 bg-white focus-within:border-purple-500 focus-within:ring-4 focus-within:ring-purple-100">
      <div className="flex w-14 items-center justify-center bg-slate-50 text-slate-400">
        {icon}
      </div>
      {children}
    </div>
  );
}
