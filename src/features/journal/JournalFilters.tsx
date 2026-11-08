import type { JournalFilters as JournalFilterValues } from "@/entities/patient/types";
import { dateRangeError } from "@/features/journal/filter";
import { Button, Card, Label, Select, TextInput } from "@/shared/ui";

function DateRange({
  label,
  from,
  to,
  onFrom,
  onTo,
}: {
  label: string;
  from: string;
  to: string;
  onFrom: (value: string) => void;
  onTo: (value: string) => void;
}) {
  const error = dateRangeError(from, to, label);
  return (
    <div>
      <Label>{label}</Label>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <span className="mb-1 block text-xs text-slate-500">С</span>
          <TextInput
            value={from}
            placeholder="дд.мм.гггг"
            aria-label={`${label}, с`}
            onChange={(event) => onFrom(event.target.value)}
          />
        </div>
        <div>
          <span className="mb-1 block text-xs text-slate-500">По</span>
          <TextInput
            value={to}
            placeholder="дд.мм.гггг"
            aria-label={`${label}, по`}
            onChange={(event) => onTo(event.target.value)}
          />
        </div>
      </div>
      {error ? <p className="mt-1 text-xs font-semibold text-red-700">{error}</p> : null}
    </div>
  );
}

export function JournalFilters({
  filters,
  centers,
  canCreate,
  canExport,
  onPatch,
  onReset,
  onCreate,
  onExportFinal,
  onExportSlice,
}: {
  filters: JournalFilterValues;
  centers: string[];
  canCreate: boolean;
  canExport: boolean;
  onPatch: (patch: Partial<JournalFilterValues>) => void;
  onReset: () => void;
  onCreate: () => void;
  onExportFinal: () => void;
  onExportSlice: () => void;
}) {
  return (
    <Card className="mb-5 p-4">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end">
        <div className="grid flex-1 grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4">
          <div>
            <Label>ID</Label>
            <TextInput
              value={filters.id}
              placeholder="1"
              onChange={(event) => onPatch({ id: event.target.value })}
            />
          </div>
          <div>
            <Label>Шифр</Label>
            <TextInput
              value={filters.code}
              placeholder="С-2026-001"
              onChange={(event) => onPatch({ code: event.target.value })}
            />
          </div>
          <div>
            <Label>Группа/центр</Label>
            <Select
              value={filters.center}
              onChange={(event) => onPatch({ center: event.target.value })}
            >
              <option value="all">Все центры</option>
              {centers.map((center) => (
                <option key={center} value={center}>
                  {center}
                </option>
              ))}
            </Select>
          </div>
          <DateRange
            label="Дата операции"
            from={filters.operationDateFrom}
            to={filters.operationDateTo}
            onFrom={(operationDateFrom) => onPatch({ operationDateFrom })}
            onTo={(operationDateTo) => onPatch({ operationDateTo })}
          />
          <DateRange
            label="Дата и время создания"
            from={filters.createdAtFrom}
            to={filters.createdAtTo}
            onFrom={(createdAtFrom) => onPatch({ createdAtFrom })}
            onTo={(createdAtTo) => onPatch({ createdAtTo })}
          />
        </div>
        {canExport ? (
          <div className="flex flex-wrap gap-2 xl:min-w-[230px] xl:flex-col xl:border-l xl:pl-4">
            <Button variant="exportFinal" onClick={onExportFinal}>
              Итоговая выгрузка
            </Button>
            <Button variant="exportSlice" onClick={onExportSlice}>
              Статистические срезы
            </Button>
          </div>
        ) : null}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button disabled={!canCreate} onClick={onCreate}>
          + Создать карточку пациента
        </Button>
        <Button variant="secondary" onClick={onReset}>
          Сбросить фильтры
        </Button>
      </div>
      {!canCreate && !canExport ? (
        <div className="mt-3 text-sm text-slate-500">
          Для текущей роли создание карточки и выгрузки недоступны.
        </div>
      ) : null}
    </Card>
  );
}
