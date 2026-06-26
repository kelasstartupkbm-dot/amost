import AccountTrackingData from "@/components/account/AccountTrackingData";

export const dynamic = "force-dynamic";

export default function AccountTrackingPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 md:px-8">
      <div className="mx-auto max-w-7xl">
        <AccountTrackingData />
      </div>
    </main>
  );
}
