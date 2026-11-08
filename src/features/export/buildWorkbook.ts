import type { Patient } from "@/entities/patient/types";
import { resolveFieldValue } from "@/entities/crf/merge";
import { CRF_SCHEMA, normalizeHeader } from "@/entities/crf/schema";
import { SEED } from "@/api/mock/seed";
import { downloadBlob, escapeHtml } from "@/shared/lib/download";

const HEADER_FIELDS = (() => {
  const map = new Map<string, string[]>();
  CRF_SCHEMA.forEach((field) => {
    const seen = new Set<string>();
    field.excelHeaders.forEach((header) => {
      const key = normalizeHeader(header);
      if (!key || seen.has(key)) return;
      seen.add(key);
      const queue = map.get(key) ?? [];
      queue.push(field.key);
      map.set(key, queue);
    });
  });
  return map;
})();

export function exportRow(patient: Patient, headers: string[]): string[] {
  const cursor = new Map<string, number>();
  return headers.map((header) => {
    const normalized = normalizeHeader(header);
    if (!normalized) return "";
    const queue = HEADER_FIELDS.get(normalized) ?? [];
    const index = cursor.get(normalized) ?? 0;
    cursor.set(normalized, index + 1);
    const fieldKey = queue[index];
    if (!fieldKey) return "";
    const value = resolveFieldValue(patient.blocks, fieldKey);
    if (fieldKey === "opDate") return value || patient.operationDate || "";
    return value;
  });
}

function downloadCsv(matrix: string[][], filename: string) {
  const csv =
    "\ufeff" +
    matrix
      .map((row) =>
        row.map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`).join(";")
      )
      .join("\n");
  downloadBlob(csv, filename, "text/csv;charset=utf-8");
}

function downloadExcelLike(matrix: string[][], filename: string) {
  const html = `<html><head><meta charset="utf-8"><style>td,th{border:1px solid #999;padding:4px;vertical-align:top;mso-number-format:'\\@';}th{font-weight:bold;background:#f2f2f2;}</style></head><body><table>${matrix
    .map(
      (row, index) =>
        `<tr>${row
          .map((value) =>
            index === 0
              ? `<th>${escapeHtml(value)}</th>`
              : `<td>${escapeHtml(value)}</td>`
          )
          .join("")}</tr>`
    )
    .join("")}</table></body></html>`;
  downloadBlob(html, filename, "application/vnd.ms-excel;charset=utf-8");
}

export function downloadExport(
  patients: Patient[],
  type: "final" | "slice",
  format: "excel" | "csv"
) {
  const headers =
    SEED.exportHeaders && SEED.exportHeaders.length
      ? SEED.exportHeaders
      : ["ID", "Шифр", "Группа/центр", "Дата операции", "Дата и время создания"];
  const matrix = [
    headers,
    ...patients.map((patient) => exportRow(patient, headers)),
  ];
  const name = `${type === "slice" ? "stat_slice" : "final_export"}_${
    format === "excel" ? "excel" : "csv"
  }`;
  if (format === "excel") downloadExcelLike(matrix, `${name}.xls`);
  else downloadCsv(matrix, `${name}.csv`);
}
