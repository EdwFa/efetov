export interface StoredFile {
  name: string;
  folder: string;
  author: string;
  date: string;
  comment: string;
}

export interface FileTreeNode {
  files: StoredFile[];
  folders: Record<string, FileTreeNode>;
}

export function groupFiles(files: StoredFile[]): FileTreeNode {
  const root: FileTreeNode = { files: [], folders: {} };
  files.forEach((file) => {
    const parts = file.folder
      .split("/")
      .map((part) => part.trim())
      .filter(Boolean);
    let node = root;
    parts.forEach((part) => {
      node.folders[part] = node.folders[part] || { files: [], folders: {} };
      node = node.folders[part];
    });
    node.files.push(file);
  });
  return root;
}
