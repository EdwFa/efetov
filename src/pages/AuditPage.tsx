import { useState } from "react";
import { useRuntime } from "@/api/useRuntime";
import { EMPTY_AUDIT_FILTERS, type AuditFilters } from "@/entities/audit/types";
import { useAuth } from "@/features/auth/useAuth";
import { Button, Card, Label, PageHeader, Select, TextInput } from "@/shared/ui";

export function AuditPage() {
  const { pwr } = useAuth();
  const { audit } = useRuntime();
  const [filters, setFilters] = useState<AuditFilters>(EMPTY_AUDIT_FILTERS);

  if (!pwr.canAudit) {
    return (
      <PageHeader
        title="Модуль аудита"
        description="Недоступно для текущей роли."
      />
    );
  }

  const rows = audit.filter(
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
  );
  const roles = Array.from(new Set(audit.map((item) => item.role)));

  return (
    <>
      <PageHeader
        title="Модуль аудита"
        description="Неизменяемый журнал действий. Просмотр доступен только руководителю; записи нельзя удалить или отредактировать через интерфейс."
      />
      <Card className="mb-5 p-4">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4">
          <div>
            <Label>Дата и время</Label>
            <TextInput
              value={filters.time}
              placeholder="09.06.2026"
              onChange={(event) =>
                setFilters({ ...filters, time: event.target.value })
              }
            />
          </div>
          <div>
            <Label>ID пользователя</Label>
            <TextInput
              value={filters.userId}
              placeholder="U-STA-001"
              onChange={(event) =>
                setFilters({ ...filters, userId: event.target.value })
              }
            />
          </div>
          <div>
            <Label>Роль</Label>
            <Select
              value={filters.role}
              onChange={(event) =>
                setFilters({ ...filters, role: event.target.value })
              }
            >
              <option value="all">Все</option>
              {roles.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Тип действия</Label>
            <TextInput
              value={filters.action}
              placeholder="Сохранение формы"
              onChange={(event) =>
                setFilters({ ...filters, action: event.target.value })
              }
            />
          </div>
          <div>
            <Label>Детали изменения</Label>
            <TextInput
              value={filters.details}
              placeholder="С-2026-001"
              onChange={(event) =>
                setFilters({ ...filters, details: event.target.value })
              }
            />
          </div>
        </div>
        <Button
          variant="secondary"
          className="mt-4"
          onClick={() => setFilters(EMPTY_AUDIT_FILTERS)}
        >
          Сбросить фильтры
        </Button>
      </Card>
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                {[
                  "Дата и время",
                  "ID пользователя",
                  "Роль",
                  "Тип действия",
                  "Детали изменения",
                ].map((label) => (
                  <th
                    key={label}
                    className="whitespace-nowrap border-b border-slate-200 bg-slate-50 px-3 py-3 text-left font-extrabold text-slate-600"
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((item, index) => (
                <tr key={`${item.time}-${index}`} className="hover:bg-slate-50">
                  <td className="border-b border-slate-200 px-3 py-3">{item.time}</td>
                  <td className="border-b border-slate-200 px-3 py-3 font-bold">
                    {item.userId}
                  </td>
                  <td className="border-b border-slate-200 px-3 py-3">{item.role}</td>
                  <td className="border-b border-slate-200 px-3 py-3">{item.action}</td>
                  <td className="border-b border-slate-200 px-3 py-3">
                    {item.details}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
