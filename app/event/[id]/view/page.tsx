import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

function buildQueryString(searchParams: Record<string, string | string[] | undefined>) {
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(searchParams || {})) {
    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item !== undefined) query.append(key, item);
      });
      continue;
    }

    if (value !== undefined) query.set(key, value);
  }

  const text = query.toString();
  return text ? `?${text}` : "";
}

export default async function EventLiveViewRedirectPage(context: any) {
  const params = await Promise.resolve(context?.params);
  const searchParams = await Promise.resolve(context?.searchParams || {});
  const eventId = String(params?.id || "").trim();

  if (!eventId) {
    redirect("/account/events");
  }

  const panel = String(searchParams?.panel || "").trim().toLowerCase();

  if (panel === "result" || panel === "results") {
    redirect(`/account/events/${eventId}/results`);
  }

  redirect(`/account/events/${eventId}/view${buildQueryString(searchParams)}`);
}
