import type { JournalFilters, Patient } from "@/entities/patient/types";
import { normalizeDate, parseRuDate } from "@/shared/lib/dates";

export function dateRangeError(from: string, to: string, label: string): string | null {
  const startRaw = from.trim();
  const endRaw = to.trim();
  const start = startRaw ? parseRuDate(startRaw) : null;
  const end = endRaw ? parseRuDate(endRaw) : null;
  if (startRaw && !start) return `${label}: дата «С» должна быть в формате дд.мм.гггг`;
  if (endRaw && !end) return `${label}: дата «По» должна быть в формате дд.мм.гггг`;
  if (start && end && start > end) return `${label}: дата «С» позже даты «По»`;
  return null;
}

export function journalFilterErrors(filters: JournalFilters): string[] {
  return [
    dateRangeError(filters.operationDateFrom, filters.operationDateTo, "Дата операции"),
    dateRangeError(filters.createdAtFrom, filters.createdAtTo, "Дата создания"),
  ].filter((item): item is string => Boolean(item));
}

function inRange(value: string, from: string, to: string): boolean {
  const startRaw = from.trim();
  const endRaw = to.trim();
  const start = startRaw ? parseRuDate(startRaw) : null;
  const end = endRaw ? parseRuDate(endRaw) : null;
  if ((startRaw && !start) || (endRaw && !end) || (start && end && start > end)) {
    return true;
  }
  if (!start && !end) return true;
  const point = normalizeDate(value);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(point)) return false;
  if (start && point < start) return false;
  if (end && point > end) return false;
  return true;
}

export function matchesJournalFilters(patient: Patient, filters: JournalFilters): boolean {
  return (
    (!filters.id || patient.id.toLowerCase().includes(filters.id.toLowerCase())) &&
    (!filters.code || patient.code.toLowerCase().includes(filters.code.toLowerCase())) &&
    (filters.center === "all" || patient.center === filters.center) &&
    inRange(patient.operationDate, filters.operationDateFrom, filters.operationDateTo) &&
    inRange(patient.createdAt || "", filters.createdAtFrom, filters.createdAtTo)
  );
}
