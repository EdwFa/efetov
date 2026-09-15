import { api } from "@/api/mock";
import { useRuntime } from "@/api/useRuntime";
import { groupFiles, type FileTreeNode, type StoredFile } from "@/entities/file/types";
import { useAuth } from "@/features/auth/useAuth";
import { Badge, Button, Card, PageHeader } from "@/shared/ui";
import { useToast } from "@/shared/ui/toast";

function FileNodeView({
  node,
  level,
  canManage,
  onDownload,
  onDelete,
}: {
  node: FileTreeNode;
  level: number;
  canManage: boolean;
  onDownload: () => void;
  onDelete: (name: string) => void;
}) {
  return (
    <>
      {Object.entries(node.folders).map(([folder, child]) => (
        <div
          key={folder}
          className="border-l-2 border-slate-200 pl-3"
          style={{ marginLeft: level * 16 }}
        >
          <div className="my-2 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 font-black text-slate-900">
            <span>{folder}</span>
          </div>
          <FileNodeView
            node={child}
            level={level + 1}
            canManage={canManage}
            onDownload={onDownload}
            onDelete={onDelete}
          />
        </div>
      ))}
      {node.files.map((file: StoredFile) => (
        <div
          key={file.name}
          className="my-2 flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-3 py-3"
          style={{ marginLeft: Math.max(level, 0) * 16 }}
        >
          <div className="min-w-0">
            <div className="truncate font-bold">{file.name}</div>
            <div className="mt-1 text-xs text-slate-500">
              Автор: {file.author} · Дата: {file.date} · Комментарий: {file.comment}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={onDownload}>
              Скачать
            </Button>
            <Button
              variant="danger"
              disabled={!canManage}
              onClick={() => onDelete(file.name)}
            >
              Удалить
            </Button>
          </div>
        </div>
      ))}
    </>
  );
}

export function FilesPage() {
  const { files } = useRuntime();
  const { user, pwr } = useAuth();
  const { showToast } = useToast();
  const tree = groupFiles(files);

  return (
    <>
      <PageHeader
        title="Файловое хранилище"
        description="Древовидная структура папок по месяцам и врачам. Руководитель имеет полные права; врачи стационара и амбулатории могут только скачивать файлы."
      />
      <div className="mb-5 flex flex-wrap gap-2">
        {pwr.canFilesManage ? (
          <>
            <Button
              onClick={() => {
                if (!user) return;
                api.addDemoFile(user);
                showToast("Файл добавлен в древовидное хранилище");
              }}
            >
              + Загрузить файл
            </Button>
            <Button
              variant="secondary"
              onClick={() =>
                showToast(
                  "Создание папки — демо-действие. Папки появляются вместе с файлами."
                )
              }
            >
              + Создать папку
            </Button>
          </>
        ) : (
          <>
            <Button disabled>+ Загрузить файл</Button>
            <Button disabled>Удалить файл</Button>
            <Badge tone="amber">Для вашей роли доступно только скачивание</Badge>
          </>
        )}
      </div>
      <Card className="p-5">
        <div className="space-y-3">
          <FileNodeView
            node={tree}
            level={0}
            canManage={pwr.canFilesManage}
            onDownload={() => showToast("Скачивание файла — демо-действие")}
            onDelete={(name) => {
              if (!user) return;
              if (!pwr.canFilesManage) {
                showToast("Удаление файлов недоступно для текущей роли");
                return;
              }
              api.deleteFile(user, name);
              showToast("Файл удален из демо-хранилища");
            }}
          />
        </div>
      </Card>
    </>
  );
}
