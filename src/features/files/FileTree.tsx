import {
  groupFiles,
  type FileTreeNode,
  type StoredFile,
} from "@/entities/file/types";
import { Button, Card } from "@/shared/ui";

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

export function FileTree({
  files,
  canManage,
  onDownload,
  onDelete,
}: {
  files: StoredFile[];
  canManage: boolean;
  onDownload: () => void;
  onDelete: (name: string) => void;
}) {
  const tree = groupFiles(files);
  return (
    <Card className="p-5">
      <div className="space-y-3">
        <FileNodeView
          node={tree}
          level={0}
          canManage={canManage}
          onDownload={onDownload}
          onDelete={onDelete}
        />
      </div>
    </Card>
  );
}
