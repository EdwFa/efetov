import type { AuditFilters } from "@/entities/audit/types";
import { dateRangeError } from "@/features/journal/filter";
import { Button, Card, Label, Select, TextInput } from "@/shared/ui";

export function AuditFiltersBar({
  filters,
  roles,
  onChange,
  onReset,
}: {
  filters: AuditFilters;
  roles: string[];
  onChange: (filters: AuditFilters) => void;
  onReset: () => void;
}) {
  const timeError = dateRangeError(filters.timeFrom, filters.timeTo, "Дата и время");
  return (
    <Card className="mb-5 p-4">
      <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4">
        <div>
          <Label>Дата и время</Label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="mb-1 block text-xs text-slate-500">С</span>
              <TextInput
                value={filters.timeFrom}
                placeholder="дд.мм.гггг"
                aria-label="Дата и время, с"
                onChange={(event) =>
                  onChange({ ...filters, timeFrom: event.target.value })
                }
              />
            </div>
            <div>
              <span className="mb-1 block text-xs text-slate-500">По</span>
              <TextInput
                value={filters.timeTo}
                placeholder="дд.мм.гггг"
                aria-label="Дата и время, по"
                onChange={(event) =>
                  onChange({ ...filters, timeTo: event.target.value })
                }
              />
            </div>
          </div>
          {timeError ? (
            <p className="mt-1 text-xs font-semibold text-red-700">{timeError}</p>
          ) : null}
        </div>
        <div>
          <Label>ID пользователя</Label>
          <TextInput
            value={filters.userId}
            placeholder="U-STA-001"
            onChange={(event) =>
              onChange({ ...filters, userId: event.target.value })
            }
          />
        </div>
        <div>
          <Label>Роль</Label>
          <Select
            value={filters.role}
            onChange={(event) => onChange({ ...filters, role: event.target.value })}
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
              onChange({ ...filters, action: event.target.value })
            }
          />
        </div>
        <div>
          <Label>Детали изменения</Label>
          <TextInput
            value={filters.details}
            placeholder="С-2026-001"
            onChange={(event) =>
              onChange({ ...filters, details: event.target.value })
            }
          />
        </div>
      </div>
      <Button variant="secondary" className="mt-4" onClick={onReset}>
        Сбросить фильтры
      </Button>
    </Card>
  );
}
