import type { JournalFilters } from "@/entities/patient/types";
import { Button, Card, Modal } from "@/shared/ui";

export function ExportDialog({
  type,
  filters,
  onClose,
  onExport,
}: {
  type: "final" | "slice";
  filters: JournalFilters;
  onClose: () => void;
  onExport: (format: "excel" | "csv") => void;
}) {
  return (
    <Modal onClose={onClose}>
      <Card className="p-6">
        <h2 className="text-xl font-black">
          {type === "final" ? "Итоговая выгрузка" : "Статистический срез"}
        </h2>
        <p className="mt-2 text-slate-500">
          {type === "slice"
            ? `Выгрузка будет сформирована с учетом выбранных фильтров: ID=${filters.id || "все"}, шифр=${filters.code || "все"}, центр=${filters.center === "all" ? "все" : filters.center}, дата операции=${filters.operationDate || "все"}, дата/время создания=${filters.createdAt || "все"}.`
            : "Выгрузка включает все карточки пациентов без учета фильтров."}
        </p>
        <p className="mt-2 text-slate-500">
          Excel-выгрузка формируется в структуре, соответствующей приложенному
          шаблону Excel. CSV — дополнительная демо-опция.
        </p>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <Button variant="exportFinal" onClick={() => onExport("excel")}>
            Excel
          </Button>
          <Button variant="exportSlice" onClick={() => onExport("csv")}>
            CSV
          </Button>
        </div>
        <Button variant="secondary" className="mt-3 w-full" onClick={onClose}>
          Закрыть
        </Button>
      </Card>
    </Modal>
  );
}
