import { useState } from "react";
import {
  groupFiles,
  type FileTreeNode,
  type StoredFile,
} from "@/entities/file/types";
import { Button, Card } from "@/shared/ui";

function FileNodeView({
  node,
  level,
  path,
  collapsed,
  onToggle,
  canManage,
  onDownload,
  onDelete,
}: {
  node: FileTreeNode;
  level: number;
  path: string;
  collapsed: ReadonlySet<string>;
  onToggle: (path: string) => void;
  canManage: boolean;
  onDownload: (name: string) => void;
  onDelete: (name: string) => void;
}) {
  return (
    <>
      {Object.entries(node.folders).map(([folder, child]) => {
        const folderPath = path ? `${path}/${folder}` : folder;
        const isCollapsed = collapsed.has(folderPath);
        return (
          <div
            key={folderPath}
            className="border-l-2 border-slate-200 pl-3"
            style={{ marginLeft: level * 16 }}
          >
            <button
              type="button"
              className="my-2 flex w-full items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-left font-black text-slate-900"
              aria-expanded={!isCollapsed}
              aria-label={`${isCollapsed ? "Раскрыть" : "Свернуть"} папку ${folder}`}
              onClick={() => onToggle(folderPath)}
            >
              <span aria-hidden="true">{isCollapsed ? "▶" : "▼"}</span>
              <span>{folder}</span>
            </button>
            {isCollapsed ? null : (
              <FileNodeView
                node={child}
                level={level + 1}
                path={folderPath}
                collapsed={collapsed}
                onToggle={onToggle}
                canManage={canManage}
                onDownload={onDownload}
                onDelete={onDelete}
              />
            )}
          </div>
        );
      })}
      {node.files.map((file: StoredFile) => (
        <div
          key={file.name}
          className="my-2 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-3"
          style={{ marginLeft: Math.max(level, 0) * 16 }}
        >
          <div className="min-w-0">
            <div className="truncate font-bold">{file.name}</div>
            <div className="mt-1 break-words text-xs text-slate-500">
              Автор: {file.author} · Дата: {file.date} · Комментарий: {file.comment}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => onDownload(file.name)}>
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
  folders = [],
  canManage,
  onDownload,
  onDelete,
}: {
  files: StoredFile[];
  folders?: string[];
  canManage: boolean;
  onDownload: (name: string) => void;
  onDelete: (name: string) => void;
}) {
  const tree = groupFiles(files, folders);
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set());
  const toggle = (folderPath: string) => {
    setCollapsed((current) => {
      const next = new Set(current);
      if (next.has(folderPath)) next.delete(folderPath);
      else next.add(folderPath);
      return next;
    });
  };
  return (
    <Card className="overflow-hidden p-5">
      <div className="space-y-3 overflow-x-auto">
        <FileNodeView
          node={tree}
          level={0}
          path=""
          collapsed={collapsed}
          onToggle={toggle}
          canManage={canManage}
          onDownload={onDownload}
          onDelete={onDelete}
        />
      </div>
    </Card>
  );
}
