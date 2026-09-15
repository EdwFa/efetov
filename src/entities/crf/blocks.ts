export const CRF_BLOCK_ORDER = [
  "Общие данные",
  "Анамнез",
  "Предоперационные исследования",
  "Операционные данные",
  "Послеоперационные наблюдения",
] as const;

export type CrfBlock = (typeof CRF_BLOCK_ORDER)[number];
