import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function MyEventsRedirectPage() {
  redirect("/account/events");
}
