import Link from "next/link";

type AdminBrandProps = {
  subtitle?: string;
  href?: string;
};

export default function AdminBrand({
  subtitle = "EVENT MANAGEMENT",
  href = "/admin",
}: AdminBrandProps) {
  return (
    <Link href={href} className="flex min-w-0 items-center gap-3">
      <img
        src="/logo.png"
        alt="AMOST"
        className="h-14 w-auto object-contain sm:h-16"
      />
      {subtitle ? (
        <span className="sr-only">AMOST {subtitle}</span>
      ) : (
        <span className="sr-only">AMOST</span>
      )}
    </Link>
  );
}
