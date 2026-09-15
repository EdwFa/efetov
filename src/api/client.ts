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

export interface AppApi {
  listDemoUsers(): DemoUser[];
  authenticate(login: string, password: string): SessionUser | null;
  getRuntime(): RuntimeSnapshot;
  subscribe(listener: () => void): () => void;
  resetDemoData(): void;
  addAudit(actor: SessionUser, action: string, details: string): void;
  createPatient(actor: SessionUser, input: CreatePatientInput): Patient;
  deletePatient(actor: SessionUser, id: string): Patient | null;
  savePatientBlock(
    actor: SessionUser,
    patientId: string,
    block: string,
    values: Record<string, string>
  ): Patient | null;
  addDemoFile(actor: SessionUser): StoredFile;
  deleteFile(actor: SessionUser, name: string): void;
}
