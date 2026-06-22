"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Eye, EyeOff, Lock, Mail, Phone, User } from "lucide-react";

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
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleRegister(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setMessage("");
    setSuccess(false);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName,
          email,
          phone,
          password,
          confirmPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        setSuccess(false);
        setMessage(data.message || "Register gagal.");
        return;
      }

      setSuccess(true);
      setMessage(data.message || "Register berhasil.");

      setTimeout(() => {
        router.push("/login");
      }, 1200);
    } catch (error) {
      console.error(error);
      setSuccess(false);
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
              Buat Akun
              <br />
              dan Mulai
              <br />
              <span className="text-purple-700">Tracking Aktivitas</span>
            </h1>

            <p className="mt-6 max-w-md text-lg leading-8 text-slate-600">
              Akun baru otomatis terdaftar sebagai pengguna Umum. Role Staff
              AMOST hanya dapat ditentukan oleh Super Admin.
            </p>

            <div className="mt-10 rounded-2xl border border-purple-100 bg-white/70 p-6 shadow-xl shadow-purple-100">
              <p className="text-sm font-bold uppercase tracking-wide text-purple-700">
                Aturan Register
              </p>

              <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
                <li>• User baru otomatis menjadi Umum.</li>
                <li>• Tidak ada pilihan role saat registrasi.</li>
                <li>• Staff AMOST hanya ditentukan oleh Super Admin.</li>
                <li>• Super Admin tidak dibuat dari halaman register.</li>
              </ul>
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
              Daftar Akun
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Buat akun AMOST. Setelah register, akun otomatis menjadi pengguna
              Umum.
            </p>

            {message && (
              <div
                className={`mt-5 rounded-xl border p-4 text-sm font-bold leading-6 ${
                  success
                    ? "border-green-200 bg-green-50 text-green-700"
                    : "border-red-200 bg-red-50 text-red-700"
                }`}
              >
                {message}
              </div>
            )}

            <form onSubmit={handleRegister} className="mt-8 space-y-5">
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-800">
                  Nama Lengkap
                </label>
                <div className="flex h-13 items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 focus-within:border-purple-600">
                  <User size={19} className="text-slate-400" />
                  <input
                    type="text"
                    placeholder="Nama lengkap"
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    className="h-13 w-full border-0 bg-transparent text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400"
                    required
                  />
                </div>
              </div>

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
                  Nomor HP
                </label>
                <div className="flex h-13 items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 focus-within:border-purple-600">
                  <Phone size={19} className="text-slate-400" />
                  <input
                    type="tel"
                    placeholder="08xxxxxxxxxx"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    className="h-13 w-full border-0 bg-transparent text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400"
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
                    placeholder="Minimal 8 karakter"
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

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-800">
                  Konfirmasi Password
                </label>
                <div className="flex h-13 items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 focus-within:border-purple-600">
                  <Lock size={19} className="text-slate-400" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Ulangi password"
                    value={confirmPassword}
                    onChange={(event) =>
                      setConfirmPassword(event.target.value)
                    }
                    className="h-13 w-full border-0 bg-transparent text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400"
                    required
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword(!showConfirmPassword)
                    }
                    className="text-slate-400"
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={19} />
                    ) : (
                      <Eye size={19} />
                    )}
                  </button>
                </div>
              </div>

              <div className="rounded-xl border border-purple-100 bg-purple-50 p-4">
                <p className="text-sm leading-6 text-purple-900">
                  Dengan mendaftar, akun kamu otomatis dibuat sebagai{" "}
                  <strong>Umum</strong>.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="h-13 w-full rounded-xl bg-purple-700 text-sm font-black text-white shadow-lg shadow-purple-200 transition hover:bg-purple-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Memproses..." : "Daftar"}
              </button>
            </form>

            <p className="mt-7 text-center text-sm text-slate-600">
              Sudah punya akun?{" "}
              <Link href="/login" className="font-black text-purple-700">
                Login
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
