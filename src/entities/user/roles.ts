import type { Role } from "./types";
import { CRF_BLOCK_ORDER, type CrfBlock } from "@/entities/crf/blocks";

export type Permission =
  | "patient.create"
  | "patient.delete"
  | "files.download"
  | "files.manage"
  | "audit.view"
  | "export.run"
  | "crf.edit";

const MATRIX: Record<Role, Permission[]> = {
  stationary: ["patient.create", "files.download"],
  ambulatory: ["files.download"],
  leader: [
    "patient.create",
    "patient.delete",
    "files.download",
    "files.manage",
    "audit.view",
    "export.run",
  ],
};

export function can(role: Role | null | undefined, permission: Permission): boolean {
  if (!role) return false;
  return MATRIX[role].includes(permission);
}

export function powers(role: Role | null | undefined) {
  return {
    canCreate: can(role, "patient.create"),
    canDeletePatient: can(role, "patient.delete"),
    canFilesManage: can(role, "files.manage"),
    canAudit: can(role, "audit.view"),
    canExport: can(role, "export.run"),
  };
}

const STATIONARY_BLOCKS: CrfBlock[] = [
  "Общие данные",
  "Анамнез",
  "Предоперационные исследования",
  "Операционные данные",
];

const AMBULATORY_VIEW: CrfBlock[] = [
  "Общие данные",
  "Анамнез",
  "Послеоперационные наблюдения",
];

export function canViewBlock(role: Role | null | undefined, block: string): boolean {
  if (role === "leader") return CRF_BLOCK_ORDER.includes(block as CrfBlock);
  if (role === "stationary") return STATIONARY_BLOCKS.includes(block as CrfBlock);
  if (role === "ambulatory") return AMBULATORY_VIEW.includes(block as CrfBlock);
  return false;
}

export function canEditBlock(role: Role | null | undefined, block: string): boolean {
  if (role === "leader") return CRF_BLOCK_ORDER.includes(block as CrfBlock);
  if (role === "stationary") return STATIONARY_BLOCKS.includes(block as CrfBlock);
  if (role === "ambulatory") return block === "Послеоперационные наблюдения";
  return false;
}
