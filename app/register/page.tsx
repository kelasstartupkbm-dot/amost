"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Eye, EyeOff, Lock, Mail, Phone, User } from "lucide-react";
import { FormEvent, useState } from "react";

type RegisterForm = {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
};

const initialForm: RegisterForm = {
  fullName: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
};

export default function RegisterPage() {
  const router = useRouter();

  const [form, setForm] = useState<RegisterForm>(initialForm);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  function updateField(field: keyof RegisterForm, value: string) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    if (errorMessage) setErrorMessage("");
    if (successMessage) setSuccessMessage("");
  }

  function validateForm() {
    const fullName = form.fullName.trim();
    const email = form.email.trim().toLowerCase();
    const phone = form.phone.trim();
    const password = form.password;
    const confirmPassword = form.confirmPassword;

    if (!fullName || !email || !phone || !password || !confirmPassword) {
      return "Data wajib belum lengkap.";
    }

    if (!email.includes("@") || !email.includes(".")) {
      return "Format email belum valid.";
    }

    const phoneDigits = phone.replace(/[^\d+]/g, "");
    if (phoneDigits.length < 8) {
      return "Nomor HP belum valid.";
    }

    if (password.length < 6) {
      return "Password minimal 6 karakter.";
    }

    if (password !== confirmPassword) {
      return "Konfirmasi password tidak sama.";
    }

    return "";
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationError = validateForm();

    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    const fullName = form.fullName.trim();
    const email = form.email.trim().toLowerCase();
    const phone = form.phone.trim();
    const password = form.password;
    const confirmPassword = form.confirmPassword;

    /*
      Payload sengaja mengirim beberapa alias field.
      Tujuannya supaya cocok dengan backend lama maupun backend baru AMOST.
      Beberapa route lama biasanya membaca full_name / phone_number,
      sedangkan form baru membaca fullName / phone.
    */
    const payload = {
      fullName,
      full_name: fullName,
      name: fullName,

      email,

      phone,
      phone_number: phone,
      phoneNumber: phone,
      nomor_hp: phone,

      password,

      confirmPassword,
      confirm_password: confirmPassword,
      passwordConfirm: confirmPassword,
      password_confirmation: confirmPassword,
    };

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || data?.ok === false) {
        setErrorMessage(
          data?.message ||
            data?.error ||
            "Registrasi gagal. Periksa kembali data yang diisi."
        );
        return;
      }

      setSuccessMessage("Registrasi berhasil. Mengarahkan ke halaman login...");

      setTimeout(() => {
        router.replace("/login");
        router.refresh();
      }, 900);
    } catch (error) {
      console.error(error);
      setErrorMessage("Registrasi gagal. Koneksi ke server bermasalah.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-white text-slate-950">
      <section className="grid min-h-screen grid-cols-1 lg:grid-cols-[1fr_760px]">
        <aside className="hidden border-r border-slate-100 bg-white px-10 py-12 lg:flex lg:flex-col lg:justify-center xl:px-20">
          <div className="max-w-[560px]">
            <Link href="/" className="inline-flex items-center">
              <img
                src="/amost_logo_wide_.png"
                alt="AMOST"
                className="h-[70px] w-auto object-contain lg:h-[86px]"
              />
            </Link>

            <h1 className="mt-20 text-[56px] font-black leading-[1.08] tracking-tight text-slate-950 xl:text-[68px]">
              Buat Akun
              <br />
              dan Mulai
              <br />
              <span className="text-purple-700">Tracking Aktivitas</span>
            </h1>

            <p className="mt-8 max-w-[520px] text-xl font-medium leading-9 text-slate-600">
              Akun baru otomatis terdaftar sebagai pengguna Umum. Role Staff
              AMOST hanya dapat ditentukan oleh Super Admin.
            </p>

            <div className="mt-14 rounded-2xl border border-purple-100 bg-white p-6 shadow-sm">
              <p className="text-sm font-black uppercase tracking-wide text-purple-700">
                Aturan Register
              </p>
              <ul className="mt-4 space-y-3 text-sm font-semibold leading-6 text-slate-600">
                <li>• User baru otomatis menjadi Umum.</li>
                <li>• Gunakan email aktif untuk login.</li>
                <li>• Nomor HP digunakan untuk kebutuhan event dan tiket.</li>
              </ul>
            </div>
          </div>
        </aside>

        <section className="flex min-h-screen items-center justify-center bg-slate-50/40 px-4 py-10 sm:px-6">
          <div className="w-full max-w-[560px] rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 lg:p-10">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm font-black text-slate-600 transition hover:text-purple-700"
            >
              <ArrowLeft size={18} />
              Kembali ke Beranda
            </Link>

            <div className="mt-8 lg:hidden">
              <Link href="/" className="inline-flex items-center">
                <img
                  src="/amost_logo_wide_.png"
                  alt="AMOST"
                  className="h-[62px] w-auto object-contain"
                />
              </Link>
            </div>

            <div className="mt-8">
              <h2 className="text-3xl font-black leading-tight text-slate-950 sm:text-4xl">
                Daftar Akun
              </h2>
              <p className="mt-3 max-w-md text-base font-medium leading-7 text-slate-500">
                Buat akun AMOST. Setelah register, akun otomatis menjadi
                pengguna Umum.
              </p>
            </div>

            {errorMessage && (
              <div className="mt-7 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                {errorMessage}
              </div>
            )}

            {successMessage && (
              <div className="mt-7 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-bold text-green-700">
                {successMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <div>
                <label className="text-sm font-black text-slate-950">
                  Nama Lengkap
                </label>
                <div className="mt-2 flex h-14 overflow-hidden rounded-xl border border-slate-200 bg-white transition-within focus-within:border-purple-300 focus-within:ring-4 focus-within:ring-purple-100">
                  <div className="flex w-16 items-center justify-center bg-slate-50 text-slate-400">
                    <User size={21} />
                  </div>
                  <input
                    value={form.fullName}
                    onChange={(event) => updateField("fullName", event.target.value)}
                    autoComplete="name"
                    placeholder="Nama lengkap"
                    className="h-full min-w-0 flex-1 bg-transparent px-4 text-sm font-bold text-slate-950 outline-none placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-black text-slate-950">
                  Email
                </label>
                <div className="mt-2 flex h-14 overflow-hidden rounded-xl border border-slate-200 bg-white transition-within focus-within:border-purple-300 focus-within:ring-4 focus-within:ring-purple-100">
                  <div className="flex w-16 items-center justify-center bg-slate-50 text-slate-400">
                    <Mail size={21} />
                  </div>
                  <input
                    value={form.email}
                    onChange={(event) => updateField("email", event.target.value)}
                    type="email"
                    autoComplete="email"
                    placeholder="email@contoh.com"
                    className="h-full min-w-0 flex-1 bg-transparent px-4 text-sm font-bold text-slate-950 outline-none placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-black text-slate-950">
                  Nomor HP
                </label>
                <div className="mt-2 flex h-14 overflow-hidden rounded-xl border border-slate-200 bg-white transition-within focus-within:border-purple-300 focus-within:ring-4 focus-within:ring-purple-100">
                  <div className="flex w-16 items-center justify-center bg-slate-50 text-slate-400">
                    <Phone size={21} />
                  </div>
                  <input
                    value={form.phone}
                    onChange={(event) => updateField("phone", event.target.value)}
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="08xxxxxxxxxx"
                    className="h-full min-w-0 flex-1 bg-transparent px-4 text-sm font-bold text-slate-950 outline-none placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-black text-slate-950">
                  Password
                </label>
                <div className="mt-2 flex h-14 overflow-hidden rounded-xl border border-slate-200 bg-white transition-within focus-within:border-purple-300 focus-within:ring-4 focus-within:ring-purple-100">
                  <div className="flex w-16 items-center justify-center bg-slate-50 text-slate-400">
                    <Lock size={21} />
                  </div>
                  <input
                    value={form.password}
                    onChange={(event) => updateField("password", event.target.value)}
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Minimal 6 karakter"
                    className="h-full min-w-0 flex-1 bg-transparent px-4 text-sm font-bold text-slate-950 outline-none placeholder:text-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    className="flex w-14 items-center justify-center text-slate-400 transition hover:text-purple-700"
                    aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-sm font-black text-slate-950">
                  Konfirmasi Password
                </label>
                <div className="mt-2 flex h-14 overflow-hidden rounded-xl border border-slate-200 bg-white transition-within focus-within:border-purple-300 focus-within:ring-4 focus-within:ring-purple-100">
                  <div className="flex w-16 items-center justify-center bg-slate-50 text-slate-400">
                    <Lock size={21} />
                  </div>
                  <input
                    value={form.confirmPassword}
                    onChange={(event) =>
                      updateField("confirmPassword", event.target.value)
                    }
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Ulangi password"
                    className="h-full min-w-0 flex-1 bg-transparent px-4 text-sm font-bold text-slate-950 outline-none placeholder:text-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((current) => !current)}
                    className="flex w-14 items-center justify-center text-slate-400 transition hover:text-purple-700"
                    aria-label={
                      showConfirmPassword
                        ? "Sembunyikan konfirmasi password"
                        : "Tampilkan konfirmasi password"
                    }
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={20} />
                    ) : (
                      <Eye size={20} />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex h-14 w-full items-center justify-center rounded-xl bg-purple-700 text-base font-black text-white shadow-lg shadow-purple-200 transition hover:bg-purple-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Mendaftarkan..." : "Daftar"}
              </button>
            </form>

            <p className="mt-7 text-center text-sm font-semibold text-slate-500">
              Sudah punya akun?{" "}
              <Link
                href="/login"
                className="font-black text-purple-700 hover:text-purple-900"
              >
                Login sekarang
              </Link>
            </p>
          </div>
        </section>
      </section>
    </main>
  );
}
