export const CENTERS = [
  "Сеченовский университет",
  "НМИЦ им. Н.Н. Блохина",
  "НМИЦ колопроктологии им. А.Н. Рыжих",
] as const;

export type Center = (typeof CENTERS)[number];

export function centerCode(center: string): string {
  if (center.includes("Блохина")) return "Б";
  if (center.includes("Рыжих")) return "Р";
  return "С";
}

export function nextPatientId(ids: string[]): string {
  const max = ids
    .map((id) => Number(id))
    .filter((n) => Number.isFinite(n))
    .sort((a, b) => b - a)[0];
  return String((max || 0) + 1);
}

export function nextCode(id: string, prefix = "С"): string {
  return `${prefix}-2026-${String(id).padStart(3, "0")}`;
}
