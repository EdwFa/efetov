import { api } from "@/api/mock";
import { tryApi } from "@/api/errors";
import { useRuntime } from "@/api/useRuntime";
import { useAuth } from "@/features/auth/useAuth";
import { FileToolbar } from "@/features/files/FileToolbar";
import { FileTree } from "@/features/files/FileTree";
import { PageHeader } from "@/shared/ui";
import { useToast } from "@/shared/ui/toast";

export function FilesPage() {
  const { files } = useRuntime();
  const { user, pwr } = useAuth();
  const { showToast } = useToast();

  return (
    <>
      <PageHeader
        title="Файловое хранилище"
        description="Древовидная структура папок по месяцам и врачам. Руководитель имеет полные права; врачи стационара и амбулатории могут только скачивать файлы."
      />
      <FileToolbar
        canManage={pwr.canFilesManage}
        onUpload={async () => {
          if (!user) return;
          const added = await tryApi(
            () => api.addDemoFile(user),
            (error) => showToast(error.message)
          );
          if (added.ok) showToast("Файл добавлен в древовидное хранилище");
        }}
        onCreateFolder={() =>
          showToast(
            "Создание папки — демо-действие. Папки появляются вместе с файлами."
          )
        }
      />
      <FileTree
        files={files}
        canManage={pwr.canFilesManage}
        onDownload={() => showToast("Скачивание файла — демо-действие")}
        onDelete={async (name) => {
          if (!user) return;
          const removed = await tryApi(
            () => api.deleteFile(user, name),
            (error) => showToast(error.message)
          );
          if (removed.ok) showToast("Файл удален из демо-хранилища");
        }}
      />
    </>
  );
}
