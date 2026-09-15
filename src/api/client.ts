import type { AuditEvent } from "@/entities/audit/types";
import type { StoredFile } from "@/entities/file/types";
import type { Patient } from "@/entities/patient/types";
import type { DemoUser, SessionUser } from "@/entities/user/types";

export interface CreatePatientInput {
  code: string;
  center: string;
  operationDate: string;
  values: Record<string, string>;
}

export interface RuntimeSnapshot {
  patients: Patient[];
  files: StoredFile[];
  audit: AuditEvent[];
}

export const EMPTY_RUNTIME: RuntimeSnapshot = {
  patients: [],
  files: [],
  audit: [],
};

export interface AppApi {
  listDemoUsers(): Promise<DemoUser[]>;
  authenticate(
    login: string,
    password: string,
    details?: string
  ): Promise<SessionUser | null>;
  getRuntime(): RuntimeSnapshot;
  subscribe(listener: () => void): () => void;
  refreshRuntime(): Promise<RuntimeSnapshot>;
  resetDemoData(): Promise<void>;
  recordExport(actor: SessionUser, details: string): Promise<void>;
  createPatient(actor: SessionUser, input: CreatePatientInput): Promise<Patient>;
  deletePatient(actor: SessionUser, id: string): Promise<Patient | null>;
  savePatientBlock(
    actor: SessionUser,
    patientId: string,
    block: string,
    values: Record<string, string>
  ): Promise<Patient | null>;
  lockPatient(actor: SessionUser, patientId: string): Promise<Patient | null>;
  unlockPatient(actor: SessionUser, patientId: string): Promise<Patient | null>;
  endSession(actor: SessionUser, reason: "manual" | "idle"): Promise<void>;
  addDemoFile(actor: SessionUser): Promise<StoredFile>;
  deleteFile(actor: SessionUser, name: string): Promise<void>;
}
