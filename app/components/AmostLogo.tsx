import Link from "next/link";

type AmostLogoProps = {
  href?: string;
  className?: string;
  imageClassName?: string;
};

export default function AmostLogo({
  href = "/",
  className = "",
  imageClassName = "h-[54px] w-auto object-contain",
}: AmostLogoProps) {
  return (
    <Link href={href} className={`inline-flex items-center ${className}`}>
      <img
        src="/amost_logo_wide_.png"
        alt="AMOST"
        className={imageClassName}
      />
    </Link>
  );
}
