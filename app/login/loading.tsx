import AmostLogoLoader from "../components/AmostLogoLoader";

export default function LoginLoading() {
  return (
    <AmostLogoLoader
      title="Memuat Login AMOST..."
      description="Menyiapkan halaman login akun."
      timeoutSeconds={8}
    />
  );
}
