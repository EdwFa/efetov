export const CRF_SECTIONS = [
  { id: 1, title: "Данные о пациенте" },
  { id: 2, title: "Антропометрические данные" },
  { id: 3, title: "Данные об онкологическом заболевании" },
  { id: 4, title: "Предоперационное инструментальное обследование" },
  { id: 5, title: "Предоперационное лабораторное обследование" },
  { id: 6, title: "Данные стационара" },
  { id: 7, title: "Интраоперационные данные" },
  { id: 8, title: "Течение послеоперационного периода" },
  { id: 9, title: "Послеоперационные анализы" },
  { id: 10, title: "Данные патоморфологического исследования" },
  { id: 11, title: "Отдаленные результаты" },
  { id: 12, title: "Ответственные" },
  { id: 13, title: "Исследование - цифровая детализация" },
  { id: 14, title: "Исследование - Забрюшинный доступ" },
  { id: 15, title: "Исследование - цифровая детализация+ ГИ" },
] as const;

export type CrfSectionId = (typeof CRF_SECTIONS)[number]["id"];

export function sectionById(id: number) {
  return CRF_SECTIONS.find((item) => item.id === id);
}

export function sectionLabel(id: number): string {
  const section = sectionById(id);
  return section ? `${section.id}. ${section.title}` : String(id);
}
