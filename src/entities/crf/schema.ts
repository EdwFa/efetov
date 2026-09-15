import { CRF_BLOCK_ORDER, type CrfBlock } from "./blocks";
import type { Field } from "@/entities/patient/types";

export type CrfFieldType = "text" | "number" | "date";

export interface CrfFieldSchema {
  key: string;
  block: CrfBlock;
  label: string;
  type?: CrfFieldType;
  hint?: string;
  excelHeaders?: string[];
  aliases?: string[];
  computedFrom?: string[];
}

export const CRF_SCHEMA: CrfFieldSchema[] = [
  {
    key: "age",
    block: "Общие данные",
    label: "Возраст",
    type: "number",
    hint: "из исходной таблицы: «Возраст (во время операции)»",
    excelHeaders: ["Возраст (во время операции)"],
  },
  {
    key: "diagnosis",
    block: "Общие данные",
    label: "Диагноз",
    excelHeaders: ["Основное заболевание"],
  },
  {
    key: "sex",
    block: "Общие данные",
    label: "Пол (М - 1, Ж - 0)",
    excelHeaders: ["Пол (М - 1, Ж -0)"],
  },
  {
    key: "stage",
    block: "Общие данные",
    label: "Стадия",
    excelHeaders: ["стадия"],
  },
  { key: "height", block: "Общие данные", label: "Рост", type: "number", excelHeaders: ["Рост"] },
  { key: "weight", block: "Общие данные", label: "Вес", type: "number", excelHeaders: ["Вес"] },
  {
    key: "bmi",
    block: "Общие данные",
    label: "ИМТ",
    type: "number",
    hint: "вычисляемый параметр",
    excelHeaders: ["ИМТ (вычисляемый параметр)"],
    computedFrom: ["height", "weight"],
  },
  {
    key: "comorbidities",
    block: "Анамнез",
    label: "Сопутствующие заболевания",
    excelHeaders: ["Сопутствующие заболевания"],
  },
  {
    key: "charlson",
    block: "Анамнез",
    label: "Индекс коморбидности Чарлсона",
    type: "number",
    excelHeaders: ["Индекс коморбидности Чарлсона "],
  },
  { key: "ecog", block: "Анамнез", label: "ECOG", type: "number", excelHeaders: ["ECOG"] },
  {
    key: "karnofsky",
    block: "Анамнез",
    label: "Шкала Карновского",
    type: "number",
    excelHeaders: ["шкала Карновского"],
  },
  {
    key: "asa",
    block: "Анамнез",
    label: "Риск ASA",
    type: "number",
    excelHeaders: ["Риск ASA"],
  },
  {
    key: "priorSurgery",
    block: "Анамнез",
    label: "Операции в анамнезе",
    excelHeaders: ["операции в анамнезе"],
  },
  {
    key: "colonoscopyTumor",
    block: "Предоперационные исследования",
    label: "Колоноскопия: описание опухоли, дата",
    excelHeaders: ["Колоноскопия (описание опухоли), дата"],
  },
  {
    key: "colonoscopyOther",
    block: "Предоперационные исследования",
    label: "Колоноскопия: другие изменения",
    excelHeaders: ["Колоноскопия (другие изменения)"],
  },
  {
    key: "ctAbdomen",
    block: "Предоперационные исследования",
    label: "КТ органов брюшной полости, дата",
    excelHeaders: ["КТ органов брюшной полости, дата"],
  },
  {
    key: "ctChest",
    block: "Предоперационные исследования",
    label: "КТ органов грудной клетки",
    excelHeaders: ["КТ органов грудной клетки"],
  },
  {
    key: "cea",
    block: "Предоперационные исследования",
    label: "РЭА, нг/мл",
    excelHeaders: ["РЭА,нг/мл "],
  },
  {
    key: "ca199",
    block: "Предоперационные исследования",
    label: "СА 19-9, МЕ/мл",
    excelHeaders: ["СА 19-9, МЕ/мл "],
  },
  {
    key: "hemoglobin",
    block: "Предоперационные исследования",
    label: "Гемоглобин, г/л",
    excelHeaders: ["Гемоглобин (г/л)"],
  },
  {
    key: "wbc",
    block: "Предоперационные исследования",
    label: "Лейкоциты, *10^9/л",
    excelHeaders: ["Лейкоциты (*10^9/л)"],
  },
  {
    key: "platelets",
    block: "Предоперационные исследования",
    label: "Тромбоциты, *10^9/л",
    excelHeaders: ["Тромбоциты (*10^9/л)"],
  },
  {
    key: "creatinine",
    block: "Предоперационные исследования",
    label: "Креатинин, мкмоль/л",
    excelHeaders: ["Креатинин (мкмоль/л)"],
  },
  {
    key: "hospDate",
    block: "Операционные данные",
    label: "Дата госпитализации",
    type: "date",
    excelHeaders: ["Дата госпитализации"],
  },
  {
    key: "attending",
    block: "Операционные данные",
    label: "Лечащий врач",
    excelHeaders: ["Лечащий врач"],
  },
  {
    key: "opDate",
    block: "Операционные данные",
    label: "Дата операции",
    type: "date",
    excelHeaders: ["Дата операции", "Дата операции\n"],
  },
  { key: "surgeon", block: "Операционные данные", label: "Хирург", excelHeaders: ["Хирург"] },
  {
    key: "assistants",
    block: "Операционные данные",
    label: "Ассистенты",
    excelHeaders: ["Ассистенты"],
  },
  {
    key: "operationName",
    block: "Операционные данные",
    label: "Название операции",
    excelHeaders: ["Название операции\n    "],
  },
  {
    key: "access",
    block: "Операционные данные",
    label: "Доступ (лапароскопия-1 / лапаротомия-0 / робот-2)",
    aliases: ["Доступ"],
    excelHeaders: ["доступ (лапароскопия-1\\лапаротомия-0\\робот-2)"],
  },
  {
    key: "bloodLoss",
    block: "Операционные данные",
    label: "Кровопотеря",
    type: "number",
    excelHeaders: ["Кровопотеря"],
  },
  {
    key: "tumorDesc",
    block: "Операционные данные",
    label: "Описание опухоли",
    excelHeaders: ["Описание опухоли"],
  },
  {
    key: "intraopComplications",
    block: "Операционные данные",
    label: "Интраоперационные осложнения",
    excelHeaders: ["Интраоперационные осложнения"],
  },
  {
    key: "icuDays",
    block: "Послеоперационные наблюдения",
    label: "Количество суток в ОРИТ",
    type: "number",
    excelHeaders: ["Количество суток в ОРИТ"],
  },
  {
    key: "postopComplications",
    block: "Послеоперационные наблюдения",
    label: "Осложнения в послеоперационном периоде",
    excelHeaders: ["Осложнения в послеоперационном периоде(да/нет)"],
  },
  {
    key: "woundComplications",
    block: "Послеоперационные наблюдения",
    label: "Раневые осложнения",
    excelHeaders: [
      "Раневые осложнения (серома, гематома, расхождение краев п/о раны, нагноение п/о раны и др)",
    ],
  },
  {
    key: "clavien",
    block: "Послеоперационные наблюдения",
    label: "Clavien-Dindo",
    excelHeaders: ["Clavien-Dindo"],
  },
  {
    key: "dischargeDate",
    block: "Послеоперационные наблюдения",
    label: "Дата выписки",
    type: "date",
    excelHeaders: ["Дата выписки"],
  },
  {
    key: "followed",
    block: "Послеоперационные наблюдения",
    label: "Отслежен (да-1, нет-0)",
    excelHeaders: ["отслежен (да-1, нет-0)"],
  },
  {
    key: "lastContact",
    block: "Послеоперационные наблюдения",
    label: "Дата последнего контакта",
    type: "date",
    excelHeaders: [
      "Дата последнего \nконтакта (для медианы отслеженности, общей выживаемости)",
    ],
  },
  {
    key: "progression",
    block: "Послеоперационные наблюдения",
    label: "Прогрессия (да-1, нет-0)",
    excelHeaders: ["Прогрессия (да -1, нет - 0)"],
  },
  {
    key: "localRecurrence",
    block: "Послеоперационные наблюдения",
    label: "Местный рецидив",
    excelHeaders: ["Местный рецидив"],
  },
];

export const CREATE_BLOCKS: Record<CrfBlock, string[]> = Object.fromEntries(
  CRF_BLOCK_ORDER.map((block) => [
    block,
    CRF_SCHEMA.filter((field) => field.block === block).map((field) => field.label),
  ])
) as Record<CrfBlock, string[]>;

export function fieldsOf(block: string): CrfFieldSchema[] {
  return CRF_SCHEMA.filter((field) => field.block === block);
}

export function fieldByKey(key: string): CrfFieldSchema | undefined {
  return CRF_SCHEMA.find((field) => field.key === key);
}

export function fieldKey(block: string, name: string): string {
  const found = CRF_SCHEMA.find(
    (field) => field.block === block && field.label === name
  );
  return found?.key ?? `${block}:::${name}`;
}

export function normalizeHeader(value: string): string {
  return String(value ?? "")
    .replace(/\r/g, "")
    .replace(/\n/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export function fieldNames(field: CrfFieldSchema): string[] {
  return [field.label, ...(field.aliases ?? [])];
}

export function emptyBlocks(): Record<string, Field[]> {
  const blocks: Record<string, Field[]> = {};
  CRF_BLOCK_ORDER.forEach((block) => {
    blocks[block] = fieldsOf(block).map((field) => ({
      name: field.label,
      value: "",
      hint: field.hint,
      key: field.key,
    }));
  });
  return blocks;
}
