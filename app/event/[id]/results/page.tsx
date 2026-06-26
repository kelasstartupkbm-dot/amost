import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function EventResultsRedirectPage(context: any) {
  const params = await Promise.resolve(context?.params);
  const eventId = String(params?.id || "").trim();

  if (!eventId) {
    redirect("/account/events");
  }

  redirect(`/account/events/${eventId}/results`);
}
