import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/api/mock";
import { tryApi } from "@/api/errors";
import { useAuth } from "@/features/auth/useAuth";
import { downloadExport } from "@/features/export/buildWorkbook";
import { ExportDialog } from "@/features/export/ExportDialog";
import { JournalFilters } from "@/features/journal/JournalFilters";
import { PatientTable } from "@/features/journal/PatientTable";
import { useJournal } from "@/features/journal/useJournal";
import { PageHeader } from "@/shared/ui";
import { useToast } from "@/shared/ui/toast";

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

  const deletePatient = async (id: string) => {
    if (!user) return;
    const target = patients.find((item) => item.id === id);
    if (!target) return;
    if (
      !window.confirm(
        `Удалить карточку пациента ${target.code}? Действие будет отражено в демо-аудите.`
      )
    ) {
      return;
    }
    const deleted = await tryApi(
      () => api.deletePatient(user, id),
      (error) => showToast(error.message)
    );
    if (deleted.ok) showToast("Карточка удалена из демо-данных");
  };

  const performExport = async (format: "excel" | "csv") => {
    if (!user || !exportModal) return;
    const rows = exportModal === "slice" ? filteredPatients : patients;
    const recorded = await tryApi(
      () =>
        api.recordExport(
          user,
          `${exportModal === "slice" ? "Статистический срез" : "Итоговая выгрузка"} ${format.toUpperCase()}, строк: ${rows.length}`
        ),
      (error) => showToast(error.message)
    );
    if (!recorded.ok) return;
    downloadExport(rows, exportModal, format);
    setExportModal(null);
    showToast("Выгрузка сформирована и сохранена браузером");
  };

  return (
    <>
      <PageHeader
        title="Общий журнал пациентов"
        description="Таблица с ключевыми полями: ID, шифр, группа/центр, дата операции, дата и время создания. Всем ролям доступен просмотр журнала; создание карты пациента — врачу стационара и руководителю."
      />
      <JournalFilters
        filters={filters}
        centers={centers}
        canCreate={pwr.canCreate}
        canExport={pwr.canExport}
        onPatch={(patch) => setFilters({ ...filters, ...patch })}
        onReset={resetFilters}
        onCreate={() => navigate("/patients/new")}
        onExportFinal={() => setExportModal("final")}
        onExportSlice={() => setExportModal("slice")}
      />
      <PatientTable
        rows={filteredPatients}
        sort={sort}
        canDelete={pwr.canDeletePatient}
        onSort={sortBy}
        onOpen={(id) => navigate(`/patients/${id}`)}
        onDelete={deletePatient}
      />
      {exportModal ? (
        <ExportDialog
          type={exportModal}
          filters={filters}
          onClose={() => setExportModal(null)}
          onExport={performExport}
        />
      ) : null}
    </>
  );
}
