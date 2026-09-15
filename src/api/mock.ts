import { CRF_BLOCK_ORDER } from "@/entities/crf/blocks";
import { applyBlockValues } from "@/entities/crf/merge";
import { emptyBlocks, fieldKey, fieldsOf } from "@/entities/crf/schema";
import { centerCode, nextCode, nextPatientId } from "@/entities/patient/code";
import {
  formatLock,
  LOCK_FREE,
  lockOwnerId,
} from "@/entities/patient/lock";
import type { Patient } from "@/entities/patient/types";
import { can, canEditBlock, type Permission } from "@/entities/user/roles";
import { ROLE_LABELS, type SessionUser } from "@/entities/user/types";
import { now } from "@/shared/lib/dates";
import type { AppApi, CreatePatientInput, RuntimeSnapshot } from "./client";
import { ForbiddenError } from "./errors";
import { SEED } from "./mock/seed";

const STORAGE_KEY = "efetovRuntimeV1";

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function loadRuntime(): RuntimeSnapshot {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (
      saved &&
      Array.isArray(saved.patients) &&
      Array.isArray(saved.files) &&
      Array.isArray(saved.audit)
    ) {
      return saved as RuntimeSnapshot;
    }
  } catch {
    /* demo seed */
  }
  return clone({
    patients: SEED.patients,
    files: SEED.files,
    audit: SEED.audit,
  });
}

let runtime = loadRuntime();
const listeners = new Set<() => void>();

function emit() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(runtime));
  listeners.forEach((listener) => listener());
}

function setRuntime(next: RuntimeSnapshot) {
  runtime = next;
  emit();
}

function pushAudit(actor: SessionUser, action: string, details: string) {
  runtime = {
    ...runtime,
    audit: [
      {
        time: now(),
        userId: actor.id,
        role: ROLE_LABELS[actor.role],
        action,
        details,
      },
      ...runtime.audit,
    ],
  };
}

function deny(actor: SessionUser, permission: Permission, details?: string): never {
  const error = new ForbiddenError(permission, details);
  pushAudit(actor, "Отказ в доступе", error.message);
  emit();
  throw error;
}

function requirePermission(actor: SessionUser, permission: Permission) {
  if (!can(actor.role, permission)) deny(actor, permission);
}

function updatePatient(
  patientId: string,
  mapper: (patient: Patient) => Patient
): Patient | null {
  let updated: Patient | null = null;
  const patients = runtime.patients.map((patient) => {
    if (patient.id !== patientId) return patient;
    updated = mapper(patient);
    return updated;
  });
  if (!updated) return null;
  runtime = { ...runtime, patients };
  return updated;
}

function releaseLocksHeldBy(userId: string) {
  runtime = {
    ...runtime,
    patients: runtime.patients.map((patient) =>
      lockOwnerId(patient.lock) === userId
        ? { ...patient, lock: LOCK_FREE }
        : patient
    ),
  };
}

export const mockApi: AppApi = {
  listDemoUsers() {
    return SEED.users;
  },

  authenticate(login, password) {
    const found = SEED.users.find(
      (item) => item.login === login && item.password === password
    );
    if (!found) return null;
    return {
      login: found.login,
      role: found.role,
      id: found.id,
      name: found.name,
    };
  },

  getRuntime() {
    return runtime;
  },

  subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  resetDemoData() {
    setRuntime(
      clone({
        patients: SEED.patients,
        files: SEED.files,
        audit: SEED.audit,
      })
    );
  },

  addAudit(actor, action, details) {
    pushAudit(actor, action, details);
    emit();
  },

  recordExport(actor, details) {
    requirePermission(actor, "export.run");
    pushAudit(actor, "Экспорт", details);
    emit();
  },

  createPatient(actor, input: CreatePatientInput) {
    requirePermission(actor, "patient.create");
    const id = nextPatientId(runtime.patients.map((item) => item.id));
    const code =
      input.code.trim() || nextCode(id, centerCode(input.center));
    const operationDate = input.operationDate.trim() || "—";
    const blocks = emptyBlocks();
    CRF_BLOCK_ORDER.forEach((block) => {
      const stored = fieldsOf(block).map((field) => ({
        key: field.key,
        name: field.label,
        value:
          block === "Послеоперационные наблюдения"
            ? ""
            : input.values[field.key] ||
              input.values[fieldKey(block, field.label)] ||
              "",
        hint: field.hint,
      }));
      blocks[block] = applyBlockValues(block, stored, input.values);
    });
    const createdAt = now();
    const patient: Patient = {
      id,
      code,
      center: input.center,
      group: input.center,
      centerCode: centerCode(input.center),
      operationDate,
      createdBy: actor.id,
      createdByLogin: actor.login,
      createdByName: actor.name,
      createdAt,
      updatedAt: createdAt,
      lock: LOCK_FREE,
      blocks,
    };
    runtime = { ...runtime, patients: [...runtime.patients, patient] };
    pushAudit(
      actor,
      "Создание карты пациента",
      `Создана карточка ID ${id}, шифр ${code}`
    );
    emit();
    return patient;
  },

  deletePatient(actor, id) {
    requirePermission(actor, "patient.delete");
    const target = runtime.patients.find((item) => item.id === id);
    if (!target) return null;
    runtime = {
      ...runtime,
      patients: runtime.patients.filter((item) => item.id !== id),
    };
    pushAudit(
      actor,
      "Удаление карты пациента",
      `Удалена карточка ID ${target.id}, шифр ${target.code}`
    );
    emit();
    return target;
  },

  savePatientBlock(actor, patientId, block, values) {
    if (!canEditBlock(actor.role, block)) {
      deny(
        actor,
        "crf.edit",
        `Редактирование блока «${block}» недоступно для текущей роли`
      );
    }
    const target = runtime.patients.find((item) => item.id === patientId);
    if (!target) return null;
    const owner = lockOwnerId(target.lock);
    if (owner && owner !== actor.id) {
      deny(
        actor,
        "crf.edit",
        `Карточка ${target.code} редактируется пользователем ${owner}`
      );
    }
    const updated = updatePatient(patientId, (patient) => {
      const nextBlocks = {
        ...patient.blocks,
        [block]: applyBlockValues(block, patient.blocks[block] || [], values),
      };
      const dateField = nextBlocks["Операционные данные"]?.find(
        (field) => field.name === "Дата операции" || field.key === "opDate"
      );
      return {
        ...patient,
        blocks: nextBlocks,
        operationDate: dateField?.value || patient.operationDate,
        updatedAt: now(),
      };
    });
    if (!updated) return null;
    pushAudit(
      actor,
      "Редактирование блока",
      `Пациент ${target.code}: обновлен блок «${block}»`
    );
    emit();
    return updated;
  },

  lockPatient(actor, patientId) {
    const target = runtime.patients.find((item) => item.id === patientId);
    if (!target) return null;
    const owner = lockOwnerId(target.lock);
    if (owner && owner !== actor.id && actor.role !== "leader") {
      deny(
        actor,
        "crf.edit",
        `Карточка ${target.code} уже редактируется пользователем ${owner}`
      );
    }
    if (owner === actor.id) return target;
    const updated = updatePatient(patientId, (patient) => ({
      ...patient,
      lock: formatLock(actor.id),
    }));
    if (!updated) return null;
    pushAudit(
      actor,
      "Блокировка карты",
      owner && owner !== actor.id
        ? `Карточка ${target.code}: блокировка перехвачена у ${owner}`
        : `Карточка ${target.code} взята в работу`
    );
    emit();
    return updated;
  },

  unlockPatient(actor, patientId) {
    const target = runtime.patients.find((item) => item.id === patientId);
    if (!target) return null;
    const owner = lockOwnerId(target.lock);
    if (!owner) return target;
    if (owner !== actor.id && actor.role !== "leader") {
      deny(
        actor,
        "crf.edit",
        `Снять блокировку карточки ${target.code} может только ${owner} или руководитель`
      );
    }
    const updated = updatePatient(patientId, (patient) => ({
      ...patient,
      lock: LOCK_FREE,
    }));
    if (!updated) return null;
    pushAudit(
      actor,
      "Снятие блокировки",
      `Карточка ${target.code}: блокировка снята`
    );
    emit();
    return updated;
  },

  endSession(actor, reason) {
    releaseLocksHeldBy(actor.id);
    pushAudit(
      actor,
      reason === "idle" ? "Выход по неактивности" : "Выход из системы",
      reason === "idle"
        ? "Автоматическое завершение сессии после 15 минут бездействия"
        : "Пользователь завершил сессию"
    );
    emit();
  },

  addDemoFile(actor) {
    requirePermission(actor, "files.manage");
    const month = ["Июнь", "Июль", "Август"][runtime.files.length % 3];
    const name = `Демо-файл ${runtime.files.length + 1}.pdf`;
    const file = {
      name,
      folder: `2026 / ${month} / Руководитель`,
      author: actor.id,
      date: now().split(" ")[0],
      comment: "Добавлено в демо-прототипе",
    };
    runtime = { ...runtime, files: [...runtime.files, file] };
    pushAudit(actor, "Загрузка файла", `Загружен файл «${name}»`);
    emit();
    return file;
  },

  deleteFile(actor, name) {
    requirePermission(actor, "files.manage");
    runtime = {
      ...runtime,
      files: runtime.files.filter((item) => item.name !== name),
    };
    pushAudit(actor, "Удаление файла", `Удален файл «${name}»`);
    emit();
  },
};

export const api = mockApi;
