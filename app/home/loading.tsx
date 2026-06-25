import AmostLogoLoader from "../components/AmostLogoLoader";

export default function HomeLoading() {
  return (
    <AmostLogoLoader
      title="Memuat AMOST Feed..."
      description="Mengambil timeline, event, dan data akun."
      timeoutSeconds={8}
    />
  );
}
