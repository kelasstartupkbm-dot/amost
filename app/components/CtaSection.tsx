import Link from "next/link";
import { ArrowRight, Users } from "lucide-react";

export default function CtaSection() {
  return (
    <section className="bg-white px-[88px] py-4">
      <div className="flex min-h-[92px] items-center justify-between rounded-lg bg-gradient-to-r from-purple-800 to-purple-600 px-9 text-white shadow-lg shadow-purple-200">
        <div className="flex items-center gap-7">
          <Users size={55} strokeWidth={1.7} />

          <div>
            <h2 className="text-[20px] font-black">
              Bergabung bersama ribuan pengguna AMOST sekarang!
            </h2>
            <p className="mt-2 text-[15px] text-purple-50">
              Track aktivitasmu, ikuti event seru, dan raih pencapaian terbaikmu.
            </p>
          </div>
        </div>

        <Link
          href="/register"
          className="flex h-[50px] min-w-[230px] items-center justify-center gap-3 rounded-md bg-white text-[15px] font-bold text-black"
        >
          Buat Akun Gratis
          <ArrowRight size={17} />
        </Link>
      </div>
    </section>
  );
}
