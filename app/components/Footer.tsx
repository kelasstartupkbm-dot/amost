import Link from "next/link";
import { Facebook, Instagram, Youtube } from "lucide-react";

export default function Footer() {
  return (
    <footer className="w-full border-t border-slate-200 bg-white">
      <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-10 px-4 pb-9 pt-12 sm:px-6 md:grid-cols-2 md:px-8 lg:grid-cols-[280px_180px_210px_220px_1fr] lg:px-[88px]">
        <div>
          <Link href="/" className="flex items-center gap-4">
            <div className="logo-symbol small">A</div>

            <div>
              <div className="text-[27px] font-black leading-none tracking-wide text-purple-700">
                AMOST
              </div>
              <div className="mt-1 text-[9px] font-black uppercase leading-[1.05] tracking-wide text-purple-700">
                Amikom Mobile Outdoor
                <br />
                Sport Tracking
              </div>
            </div>
          </Link>

          <p className="mt-8 text-[13px] text-slate-500 lg:mt-12">
            © 2024 AMOST. All rights reserved.
          </p>
        </div>

        <FooterColumn
          title="Platform"
          links={["Beranda", "Events", "Fitur", "Komunitas", "Cara Kerja"]}
        />

        <FooterColumn
          title="Bantuan"
          links={[
            "FAQ",
            "Panduan",
            "Kebijakan Privasi",
            "Syarat & Ketentuan",
            "Kontak Kami",
          ]}
        />

        <div>
          <h4 className="text-[14px] font-black text-black">Ikuti Kami</h4>

          <div className="mt-6 flex items-center gap-4">
            <Link href="#" className="social-icon">
              <Facebook size={18} fill="currentColor" />
            </Link>
            <Link href="#" className="social-icon">
              <Instagram size={18} />
            </Link>
            <Link href="#" className="social-icon">
              <Youtube size={19} fill="currentColor" />
            </Link>
            <Link href="#" className="social-icon text-[18px] font-black">
              ♪
            </Link>
          </div>
        </div>

        <div>
          <h4 className="text-[14px] font-black text-black">Download App</h4>

          <div className="mt-5 flex flex-col gap-3">
            <Link href="/download" className="store-button footer-store">
              <span>GET IT ON</span>
              <strong>Google Play</strong>
            </Link>

            <Link href="/download" className="store-button footer-store">
              <span>Download on the</span>
              <strong>App Store</strong>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: string[] }) {
  return (
    <div>
      <h4 className="text-[14px] font-black text-black">{title}</h4>

      <div className="mt-5 flex flex-col gap-2">
        {links.map((link) => (
          <Link
            href="#"
            key={link}
            className="text-[14px] font-medium text-slate-700 hover:text-purple-700"
          >
            {link}
          </Link>
        ))}
      </div>
    </div>
  );
}
