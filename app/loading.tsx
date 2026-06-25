import AmostLogoLoader from "./components/AmostLogoLoader";

export default function Loading() {
  return (
    <AmostLogoLoader
      title="Memuat AMOST..."
      description="Menyiapkan halaman utama AMOST."
      timeoutSeconds={8}
    />
  );
}
