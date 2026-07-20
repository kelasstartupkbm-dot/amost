export type EventStatusInput = {
  status?: unknown;
  registrationStatus?: unknown;
  eventDate?: unknown;
  startAt?: unknown;
  endAt?: unknown;
};

function normalize(value: unknown): string {
  return String(value ?? "").trim().toLowerCase().replace(/\s+/g, "_");
}

function toDate(value: unknown): Date | null {
  if (!value) return null;
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

export function isEventFinishedStatus(value: unknown): boolean {
  const status = normalize(value);

  return [
    "selesai",
    "finish",
    "finished",
    "complete",
    "completed",
    "ended",
    "closed",
    "ditutup",
    "batal",
    "cancelled",
    "canceled",
    "archived",
  ].includes(status);
}

export function isRegistrationClosedStatus(value: unknown): boolean {
  const status = normalize(value);

  return [
    "closed",
    "ditutup",
    "selesai",
    "finished",
    "completed",
    "ended",
    "batal",
    "cancelled",
    "canceled",
  ].includes(status);
}

export function isEventRegistrationClosed(event: EventStatusInput): boolean {
  if (isEventFinishedStatus(event.status)) return true;
  if (isRegistrationClosedStatus(event.registrationStatus)) return true;

  const endAt = toDate(event.endAt);
  if (endAt && endAt.getTime() < Date.now()) return true;

  return false;
}

export function getRegistrationClosedLabel(event: EventStatusInput): string {
  if (isEventFinishedStatus(event.status)) return "Event Sudah Selesai";
  if (isRegistrationClosedStatus(event.registrationStatus)) return "Pendaftaran Ditutup";

  const endAt = toDate(event.endAt);
  if (endAt && endAt.getTime() < Date.now()) return "Event Sudah Selesai";

  return "Pendaftaran Ditutup";
}
