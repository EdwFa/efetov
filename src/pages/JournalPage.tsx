import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/api/mock";
import { useAuth } from "@/features/auth/useAuth";
import { downloadExport } from "@/features/export/buildWorkbook";
import { useJournal } from "@/features/journal/useJournal";
import type { JournalFilters } from "@/entities/patient/types";
import { can } from "@/entities/user/roles";
import {
  Button,
  Card,
  Label,
  Modal,
  PageHeader,
  Select,
  TextInput,
} from "@/shared/ui";
import { useToast } from "@/shared/ui/toast";

const COLUMNS: Array<[string, string]> = [
  ["id", "ID"],
  ["code", "Шифр"],
  ["center", "Группа/центр"],
  ["operationDate", "Дата операции"],
  ["createdAt", "Дата и время создания"],
  ["createdBy", "Автор"],
  ["updatedAt", "Время последнего изменения"],
];

export function JournalPage() {
  const { user, pwr } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const {
    patients,
    filteredPatients,
    centers,
    filters,
    setFilters,
    sort,
    sortBy,
    resetFilters,
  } = useJournal();
  const [exportModal, setExportModal] = useState<"final" | "slice" | null>(null);

  const patchFilter = (patch: Partial<JournalFilters>) =>
    setFilters({ ...filters, ...patch });

  const deletePatient = (id: string) => {
    if (!user || !can(user.role, "patient.delete")) {
      showToast("Удаление пациента недоступно для текущей роли");
      return;
    }
    const target = patients.find((item) => item.id === id);
    if (!target) return;
    if (
      !window.confirm(
        `Удалить карточку пациента ${target.code}? Действие будет отражено в демо-аудите.`
      )
    ) {
      return;
    }
    api.deletePatient(user, id);
    showToast("Карточка удалена из демо-данных");
  };

  const performExport = (type: "final" | "slice", format: "excel" | "csv") => {
    if (!user) return;
    const rows = type === "slice" ? filteredPatients : patients;
    downloadExport(rows, type, format);
    api.addAudit(
      user,
      "Экспорт",
      `${type === "slice" ? "Статистический срез" : "Итоговая выгрузка"} ${format.toUpperCase()}, строк: ${rows.length}`
    );
    setExportModal(null);
    showToast("Выгрузка сформирована и сохранена браузером");
  };

  return (
    <>
      <PageHeader
        title="Общий журнал пациентов"
        description="Таблица с ключевыми полями: ID, шифр, группа/центр, дата операции, дата и время создания. Всем ролям доступен просмотр журнала; создание карты пациента — врачу стационара и руководителю."
      />
      <Card className="mb-5 p-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end">
          <div className="grid flex-1 grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4">
            <div>
              <Label>ID</Label>
              <TextInput
                value={filters.id}
                placeholder="1"
                onChange={(event) => patchFilter({ id: event.target.value })}
              />
            </div>
            <div>
              <Label>Шифр</Label>
              <TextInput
                value={filters.code}
                placeholder="С-2026-001"
                onChange={(event) => patchFilter({ code: event.target.value })}
              />
            </div>
            <div>
              <Label>Группа/центр</Label>
              <Select
                value={filters.center}
                onChange={(event) => patchFilter({ center: event.target.value })}
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
                onChange={(event) =>
                  patchFilter({ operationDate: event.target.value })
                }
              />
            </div>
            <div>
              <Label>Дата и время создания</Label>
              <TextInput
                value={filters.createdAt}
                placeholder="09.06.2026 10:18"
                onChange={(event) =>
                  patchFilter({ createdAt: event.target.value })
                }
              />
            </div>
          </div>
          {pwr.canExport ? (
            <div className="flex flex-wrap gap-2 xl:min-w-[230px] xl:flex-col xl:border-l xl:pl-4">
              <Button variant="exportFinal" onClick={() => setExportModal("final")}>
                Итоговая выгрузка
              </Button>
              <Button variant="exportSlice" onClick={() => setExportModal("slice")}>
                Статистические срезы
              </Button>
            </div>
          ) : null}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            disabled={!pwr.canCreate}
            onClick={() => navigate("/patients/new")}
          >
            + Создать карточку пациента
          </Button>
          <Button variant="secondary" onClick={resetFilters}>
            Сбросить фильтры
          </Button>
        </div>
        {!pwr.canCreate && !pwr.canExport ? (
          <div className="mt-3 text-sm text-slate-500">
            Для текущей роли создание карточки и выгрузки недоступны.
          </div>
        ) : null}
      </Card>
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                {COLUMNS.map(([key, label]) => (
                  <th
                    key={key}
                    className="whitespace-nowrap border-b border-slate-200 bg-slate-50 px-3 py-3 text-left font-extrabold text-slate-600"
                  >
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 bg-transparent p-0 font-black text-slate-700 hover:text-teal-700"
                      onClick={() => sortBy(key)}
                    >
                      {label}
                      <span>
                        {sort.key === key ? (sort.dir === "asc" ? "↑" : "↓") : "↕"}
                      </span>
                    </button>
                  </th>
                ))}
                <th className="whitespace-nowrap border-b border-slate-200 bg-slate-50 px-3 py-3 text-left font-extrabold text-slate-600">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredPatients.map((patient) => (
                <tr key={patient.id} className="hover:bg-slate-50">
                  <td className="max-w-[280px] border-b border-slate-200 px-3 py-3 font-black">
                    {patient.id}
                  </td>
                  <td className="max-w-[280px] border-b border-slate-200 px-3 py-3">
                    {patient.code}
                  </td>
                  <td className="max-w-[280px] border-b border-slate-200 px-3 py-3">
                    {patient.center}
                  </td>
                  <td className="max-w-[280px] border-b border-slate-200 px-3 py-3">
                    {patient.operationDate}
                  </td>
                  <td className="max-w-[280px] border-b border-slate-200 px-3 py-3">
                    {patient.createdAt || "—"}
                  </td>
                  <td className="max-w-[280px] border-b border-slate-200 px-3 py-3">
                    {patient.createdByLogin ||
                      patient.createdByName ||
                      patient.createdBy}
                  </td>
                  <td className="max-w-[280px] border-b border-slate-200 px-3 py-3">
                    {patient.updatedAt}
                  </td>
                  <td className="border-b border-slate-200 px-3 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="secondary"
                        onClick={() => navigate(`/patients/${patient.id}`)}
                      >
                        Открыть
                      </Button>
                      <Button
                        variant="danger"
                        disabled={!pwr.canDeletePatient}
                        onClick={() => deletePatient(patient.id)}
                      >
                        Удалить
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      {exportModal ? (
        <Modal onClose={() => setExportModal(null)}>
          <Card className="p-6">
            <h2 className="text-xl font-black">
              {exportModal === "final"
                ? "Итоговая выгрузка"
                : "Статистический срез"}
            </h2>
            <p className="mt-2 text-slate-500">
              {exportModal === "slice"
                ? `Выгрузка будет сформирована с учетом выбранных фильтров: ID=${filters.id || "все"}, шифр=${filters.code || "все"}, центр=${filters.center === "all" ? "все" : filters.center}, дата операции=${filters.operationDate || "все"}, дата/время создания=${filters.createdAt || "все"}.`
                : "Выгрузка включает все карточки пациентов без учета фильтров."}
            </p>
            <p className="mt-2 text-slate-500">
              Excel-выгрузка формируется в структуре, соответствующей
              приложенному шаблону Excel. CSV — дополнительная демо-опция.
            </p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <Button
                variant="exportFinal"
                onClick={() => performExport(exportModal, "excel")}
              >
                Excel
              </Button>
              <Button
                variant="exportSlice"
                onClick={() => performExport(exportModal, "csv")}
              >
                CSV
              </Button>
            </div>
            <Button
              variant="secondary"
              className="mt-3 w-full"
              onClick={() => setExportModal(null)}
            >
              Закрыть
            </Button>
          </Card>
        </Modal>
      ) : null}
    </>
  );
}
