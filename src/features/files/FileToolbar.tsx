import { Badge, Button, Label, Select, TextInput } from "@/shared/ui";

export function FileToolbar({
  canManage,
  folders,
  parent,
  folderName,
  comment,
  onParent,
  onFolderName,
  onComment,
  onUploadClick,
  onCreateFolder,
}: {
  canManage: boolean;
  folders: string[];
  parent: string;
  folderName: string;
  comment: string;
  onParent: (value: string) => void;
  onFolderName: (value: string) => void;
  onComment: (value: string) => void;
  onUploadClick: () => void;
  onCreateFolder: () => void;
}) {
  if (!canManage) {
    return (
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <Button disabled>+ Загрузить файл</Button>
        <Button disabled>Удалить файл</Button>
        <Badge tone="amber">Для вашей роли доступно только скачивание</Badge>
      </div>
    );
  }
  return (
    <div className="mb-5 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4">
      <div className="grid gap-3 md:grid-cols-[repeat(auto-fit,minmax(220px,1fr))]">
        <div>
          <Label htmlFor="file-parent">Папка</Label>
          <Select
            id="file-parent"
            value={parent}
            onChange={(event) => onParent(event.target.value)}
          >
            <option value="">Корень хранилища</option>
            {folders.map((folder) => (
              <option key={folder} value={folder}>
                {folder}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="folder-name">Имя новой папки</Label>
          <TextInput
            id="folder-name"
            value={folderName}
            placeholder="Название"
            onChange={(event) => onFolderName(event.target.value)}
          />
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <Button type="button" variant="secondary" onClick={onCreateFolder}>
            Создать папку
          </Button>
          <Button type="button" onClick={onUploadClick}>
            Загрузить файл
          </Button>
        </div>
      </div>
      <div>
        <Label htmlFor="file-comment">Комментарий</Label>
        <TextInput
          id="file-comment"
          value={comment}
          placeholder="Комментарий к файлу"
          onChange={(event) => onComment(event.target.value)}
        />
      </div>
    </div>
  );
}
