import type { Patient } from "@/entities/patient/types";
import { SEED } from "@/api/mock/seed";
import { downloadBlob, escapeHtml } from "@/shared/lib/download";

function getBlockValue(
  patient: Patient,
  block: string,
  fieldNames: string | string[]
): string {
  const items = patient.blocks?.[block] || [];
  const names = Array.isArray(fieldNames) ? fieldNames : [fieldNames];
  for (const name of names) {
    const found = items.find(
      (field) =>
        String(field.name).toLowerCase().trim() ===
          String(name).toLowerCase().trim() ||
        String(field.name).toLowerCase().includes(String(name).toLowerCase())
    );
    if (found && found.value !== undefined) return found.value;
  }
  return "";
}

export function valueForExportHeader(patient: Patient, header: string): string {
  const label = String(header || "").trim();
  if (!label) return "";
  const low = label.toLowerCase();
  if (low === "фио" || low.includes("телефон") || low.includes("адрес")) return "";
  if (low.includes("кто заполнял")) {
    return patient.createdByLogin || patient.createdBy || "";
  }
  if (low.includes("комментарий")) {
    return `Шифр: ${patient.code}; создано: ${patient.createdAt}`;
  }
  if (low.includes("пол (м")) return getBlockValue(patient, "Общие данные", "Пол");
  if (low.includes("возраст")) return getBlockValue(patient, "Общие данные", "Возраст");
  if (low === "рост") return getBlockValue(patient, "Общие данные", "Рост");
  if (low === "вес") return getBlockValue(patient, "Общие данные", "Вес");
  if (low.includes("имт")) return getBlockValue(patient, "Общие данные", "ИМТ");
  if (low.includes("основное заболевание") || low === "диагноз") {
    return getBlockValue(patient, "Общие данные", "Диагноз");
  }
  if (low === "стадия" || low.includes("стадия")) {
    return getBlockValue(patient, "Общие данные", "Стадия");
  }
  if (low.includes("сопутствующие заболевания")) {
    return getBlockValue(patient, "Анамнез", "Сопутствующие заболевания");
  }
  if (low.includes("чарлсона")) {
    return getBlockValue(patient, "Анамнез", "Индекс коморбидности Чарлсона");
  }
  if (low === "ecog") return getBlockValue(patient, "Анамнез", "ECOG");
  if (low.includes("карновского")) return getBlockValue(patient, "Анамнез", "Карновского");
  if (low.includes("asa")) return getBlockValue(patient, "Анамнез", "ASA");
  if (low.includes("колоноскопия")) {
    return getBlockValue(patient, "Предоперационные исследования", "Колоноскопия");
  }
  if (low.includes("кт органов брюшной")) {
    return getBlockValue(patient, "Предоперационные исследования", "КТ органов брюшной");
  }
  if (low.includes("кт органов грудной")) {
    return getBlockValue(patient, "Предоперационные исследования", "КТ органов грудной");
  }
  if (low.includes("рэа")) {
    return getBlockValue(patient, "Предоперационные исследования", "РЭА");
  }
  if (low.includes("са 19")) {
    return getBlockValue(patient, "Предоперационные исследования", "СА 19");
  }
  if (low.includes("гемоглобин")) {
    return getBlockValue(patient, "Предоперационные исследования", "Гемоглобин");
  }
  if (low.includes("лейкоциты")) {
    return getBlockValue(patient, "Предоперационные исследования", "Лейкоциты");
  }
  if (low.includes("креатинин")) {
    return getBlockValue(patient, "Предоперационные исследования", "Креатинин");
  }
  if (low.includes("дата госпитализации")) {
    return getBlockValue(patient, "Операционные данные", "Дата госпитализации");
  }
  if (low === "лечащий врач") {
    return getBlockValue(patient, "Операционные данные", "Лечащий врач");
  }
  if (low.replace(/\s+/g, " ") === "дата операции") {
    return (
      patient.operationDate ||
      getBlockValue(patient, "Операционные данные", "Дата операции")
    );
  }
  if (low === "хирург") return getBlockValue(patient, "Операционные данные", "Хирург");
  if (low === "ассистенты") {
    return getBlockValue(patient, "Операционные данные", "Ассистенты");
  }
  if (low.includes("название операции")) {
    return getBlockValue(patient, "Операционные данные", "Название операции");
  }
  if (low.includes("доступ")) {
    return getBlockValue(patient, "Операционные данные", "Доступ");
  }
  if (low.includes("кровопотеря")) {
    return getBlockValue(patient, "Операционные данные", "Кровопотеря");
  }
  if (low.includes("описание опухоли")) {
    return (
      getBlockValue(patient, "Операционные данные", "Описание опухоли") ||
      getBlockValue(patient, "Предоперационные исследования", "описание опухоли")
    );
  }
  if (low.includes("интраоперационные осложнения")) {
    return getBlockValue(patient, "Операционные данные", "Интраоперационные осложнения");
  }
  if (low.includes("количество суток в орит")) {
    return getBlockValue(patient, "Послеоперационные наблюдения", "Количество суток в ОРИТ");
  }
  if (low.includes("осложнения в послеоперационном")) {
    return getBlockValue(patient, "Послеоперационные наблюдения", "Осложнения");
  }
  if (low.includes("clavien")) {
    return getBlockValue(patient, "Послеоперационные наблюдения", "Clavien");
  }
  if (low.includes("дата выписки")) {
    return getBlockValue(patient, "Послеоперационные наблюдения", "Дата выписки");
  }
  if (low.includes("отслежен")) {
    return getBlockValue(patient, "Послеоперационные наблюдения", "Отслежен");
  }
  if (low.includes("дата последнего")) {
    return getBlockValue(patient, "Послеоперационные наблюдения", "Дата последнего");
  }
  if (low.includes("прогрессия")) {
    return getBlockValue(patient, "Послеоперационные наблюдения", "Прогрессия");
  }
  if (low.includes("местный рецидив")) {
    return getBlockValue(patient, "Послеоперационные наблюдения", "Местный рецидив");
  }
  return "";
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
