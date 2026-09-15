export function now(): string {
  return new Date()
    .toLocaleString("ru-RU", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
    .replace(",", "");
}

export function normalizeDate(value: string): string {
  const match = String(value || "").match(/(\d{2})\.(\d{2})\.(\d{4})/);
  return match ? `${match[3]}-${match[2]}-${match[1]}` : String(value || "");
}

export function normalizeDateTime(value: string): string {
  const match = String(value || "").match(
    /(\d{2})\.(\d{2})\.(\d{4})\s+(\d{2}):(\d{2})/
  );
  return match
    ? `${match[3]}-${match[2]}-${match[1]} ${match[4]}:${match[5]}`
    : String(value || "");
}
