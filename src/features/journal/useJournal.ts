import { useMemo, useState } from "react";
import { useRuntime } from "@/api/useRuntime";
import {
  EMPTY_JOURNAL_FILTERS,
  type JournalFilters,
  type Patient,
} from "@/entities/patient/types";
import { matchesJournalFilters } from "./filter";
import { compareValues, valueForSort, type SortState } from "./sort";

export function useJournal() {
  const runtime = useRuntime();
  const [filters, setFilters] = useState<JournalFilters>(EMPTY_JOURNAL_FILTERS);
  const [sort, setSort] = useState<SortState>({ key: "id", dir: "asc" });

  const filteredPatients = useMemo(() => {
    const rows = runtime.patients.filter((patient) =>
      matchesJournalFilters(patient, filters)
    );
    const factor = sort.dir === "desc" ? -1 : 1;
    return [...rows].sort(
      (a, b) =>
        compareValues(valueForSort(a, sort.key), valueForSort(b, sort.key)) *
        factor
    );
  }, [runtime.patients, filters, sort]);

  const centers = useMemo(
    () => Array.from(new Set(runtime.patients.map((item) => item.center))),
    [runtime.patients]
  );

  const sortBy = (key: string) => {
    setSort((current) =>
      current.key === key
        ? { key, dir: current.dir === "asc" ? "desc" : "asc" }
        : { key, dir: "asc" }
    );
  };

  const resetFilters = () => setFilters(EMPTY_JOURNAL_FILTERS);

  return {
    patients: runtime.patients as Patient[],
    filteredPatients,
    centers,
    filters,
    setFilters,
    sort,
    sortBy,
    resetFilters,
  };
}
