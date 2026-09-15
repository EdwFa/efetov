import { useMemo, useState } from "react";
import { useRuntime } from "@/api/useRuntime";
import { EMPTY_AUDIT_FILTERS, type AuditFilters } from "@/entities/audit/types";
import { AuditFiltersBar } from "@/features/audit/AuditFilters";
import { AuditTable } from "@/features/audit/AuditTable";
import { useAuth } from "@/features/auth/useAuth";
import { PageHeader } from "@/shared/ui";

export function AuditPage() {
  const { pwr } = useAuth();
  const { audit } = useRuntime();
  const [filters, setFilters] = useState<AuditFilters>(EMPTY_AUDIT_FILTERS);

  const rows = useMemo(
    () =>
      audit.filter(
        (item) =>
          (!filters.time ||
            item.time.toLowerCase().includes(filters.time.toLowerCase())) &&
          (!filters.userId ||
            item.userId.toLowerCase().includes(filters.userId.toLowerCase())) &&
          (filters.role === "all" || item.role === filters.role) &&
          (!filters.action ||
            item.action.toLowerCase().includes(filters.action.toLowerCase())) &&
          (!filters.details ||
            item.details.toLowerCase().includes(filters.details.toLowerCase()))
      ),
    [audit, filters]
  );
  const roles = useMemo(
    () => Array.from(new Set(audit.map((item) => item.role))),
    [audit]
  );

  if (!pwr.canAudit) {
    return (
      <PageHeader
        title="Модуль аудита"
        description="Недоступно для текущей роли."
      />
    );
  }

  return (
    <>
      <PageHeader
        title="Модуль аудита"
        description="Неизменяемый журнал действий. Просмотр доступен только руководителю; записи нельзя удалить или отредактировать через интерфейс."
      />
      <AuditFiltersBar
        filters={filters}
        roles={roles}
        onChange={setFilters}
        onReset={() => setFilters(EMPTY_AUDIT_FILTERS)}
      />
      <AuditTable rows={rows} />
    </>
  );
}
