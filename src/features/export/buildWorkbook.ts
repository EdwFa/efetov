import type { Patient } from "@/entities/patient/types";
import { resolveFieldValue } from "@/entities/crf/merge";
import { CRF_SCHEMA, normalizeHeader } from "@/entities/crf/schema";
import { SEED } from "@/api/mock/seed";
import { downloadBlob, escapeHtml } from "@/shared/lib/download";

const PII_HEADERS = new Set(
  ["ФИО", "Телефон", "Телефон 2", "Адрес "].map(normalizeHeader)
);

const META_HEADERS: Record<string, (patient: Patient) => string> = {
  [normalizeHeader("Кто заполнял строку")]: (patient) =>
    patient.createdByLogin || patient.createdBy || "",
  [normalizeHeader("комментарий")]: (patient) =>
    `Шифр: ${patient.code}; создано: ${patient.createdAt}`,
};

const EXCEL_HEADER_TO_KEY = (() => {
  const map = new Map<string, string>();
  CRF_SCHEMA.forEach((field) => {
    (field.excelHeaders ?? []).forEach((header) => {
      const key = normalizeHeader(header);
      if (key && !map.has(key)) map.set(key, field.key);
    });
  });
  return map;
})();

export function valueForExportHeader(patient: Patient, header: string): string {
  const normalized = normalizeHeader(header);
  if (!normalized) return "";
  if (PII_HEADERS.has(normalized)) return "";
  const meta = META_HEADERS[normalized];
  if (meta) return meta(patient);
  const fieldKey = EXCEL_HEADER_TO_KEY.get(normalized);
  if (!fieldKey) return "";
  const value = resolveFieldValue(patient.blocks, fieldKey);
  if (fieldKey === "opDate") return value || patient.operationDate || "";
  return value;
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
    ...patients.map((patient) =>
      headers.map((header) => valueForExportHeader(patient, header))
    ),
  ];
  const name = `${type === "slice" ? "stat_slice" : "final_export"}_${
    format === "excel" ? "excel" : "csv"
  }`;
  if (format === "excel") downloadExcelLike(matrix, `${name}.xls`);
  else downloadCsv(matrix, `${name}.csv`);
}
