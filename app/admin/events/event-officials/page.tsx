import { redirect } from "next/navigation";

export default function WrongOfficialEventRouteRedirectPage() {
  redirect("/admin/event-officials");
}
