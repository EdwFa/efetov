import { Badge, Button } from "@/shared/ui";

export function FileToolbar({
  canManage,
  onUpload,
  onCreateFolder,
}: {
  canManage: boolean;
  onUpload: () => void;
  onCreateFolder: () => void;
}) {
  return (
    <div className="mb-5 flex flex-wrap gap-2">
      {canManage ? (
        <>
          <Button onClick={onUpload}>+ Загрузить файл</Button>
          <Button variant="secondary" onClick={onCreateFolder}>
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
  );
}
