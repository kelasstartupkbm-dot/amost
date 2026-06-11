import Link from "next/link";
import { ArrowRight, Users } from "lucide-react";

export default function CtaSection() {
  return (
    <section className="bg-white px-4 py-4 sm:px-6 md:px-8 lg:px-[70px]">
      <div className="flex flex-col gap-6 rounded-lg bg-gradient-to-r from-purple-800 to-purple-600 px-6 py-7 text-white shadow-lg shadow-purple-200 md:flex-row md:items-center md:justify-between md:px-9">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-7">
          <Users size={52} strokeWidth={1.7} />

          <div>
            <h2 className="text-[18px] font-black sm:text-[20px]">
              Bergabung bersama ribuan pengguna AMOST sekarang!
            </h2>
            <p className="mt-2 text-[14px] leading-6 text-purple-50 sm:text-[15px]">
              Track aktivitasmu, ikuti event seru, dan raih pencapaian terbaikmu.
            </p>
          </div>
        </div>

        <Link
          href="/register"
          className="flex h-[50px] w-full items-center justify-center gap-3 rounded-md bg-white text-[15px] font-bold text-black sm:w-auto sm:min-w-[230px]"
        >
          Buat Akun Gratis
          <ArrowRight size={17} />
        </Link>
      </div>
    </section>
  );
}
