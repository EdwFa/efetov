import type { JournalFilters } from "@/entities/patient/types";
import { Button, Card, Label, Select, TextInput } from "@/shared/ui";

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
  filters: JournalFilters;
  centers: string[];
  canCreate: boolean;
  canExport: boolean;
  onPatch: (patch: Partial<JournalFilters>) => void;
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
          <div>
            <Label>Дата операции</Label>
            <TextInput
              value={filters.operationDate}
              placeholder="05.10.2022"
              onChange={(event) => onPatch({ operationDate: event.target.value })}
            />
          </div>
          <div>
            <Label>Дата и время создания</Label>
            <TextInput
              value={filters.createdAt}
              placeholder="09.06.2026 10:18"
              onChange={(event) => onPatch({ createdAt: event.target.value })}
            />
          </div>
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
