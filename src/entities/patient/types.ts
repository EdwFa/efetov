export interface Field {
  name: string;
  value: string;
  hint?: string;
}

export interface Patient {
  id: string;
  code: string;
  center: string;
  group: string;
  centerCode: string;
  operationDate: string;
  createdBy: string;
  createdByLogin: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
  lock: string;
  blocks: Record<string, Field[]>;
}

export interface JournalFilters {
  id: string;
  code: string;
  center: string;
  operationDate: string;
  createdAt: string;
}

export const EMPTY_JOURNAL_FILTERS: JournalFilters = {
  id: "",
  code: "",
  center: "all",
  operationDate: "",
  createdAt: "",
};
