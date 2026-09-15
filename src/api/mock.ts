import { CREATE_BLOCKS, fieldKey } from "@/entities/crf/blocks";
import { centerCode, nextCode, nextPatientId } from "@/entities/patient/code";
import type { Patient } from "@/entities/patient/types";
import { ROLE_LABELS, type SessionUser } from "@/entities/user/types";
import { now } from "@/shared/lib/dates";
import type { AppApi, CreatePatientInput, RuntimeSnapshot } from "./client";
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

  createPatient(actor, input: CreatePatientInput) {
    const id = nextPatientId(runtime.patients.map((item) => item.id));
    const code =
      input.code.trim() || nextCode(id, centerCode(input.center));
    const operationDate = input.operationDate.trim() || "—";
    const blocks: Patient["blocks"] = {};
    (Object.entries(CREATE_BLOCKS) as Array<[string, string[]]>).forEach(
      ([block, fields]) => {
        blocks[block] = fields.map((name) => ({
          name,
          value:
            block === "Послеоперационные наблюдения"
              ? ""
              : input.values[fieldKey(block, name)] || "",
        }));
      }
    );
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
      lock: "нет",
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
    const target = runtime.patients.find((item) => item.id === patientId);
    if (!target) return null;
    const patients = runtime.patients.map((patient) => {
      if (patient.id !== patientId) return patient;
      const nextBlocks = {
        ...patient.blocks,
        [block]: (patient.blocks[block] || []).map((field) => ({
          ...field,
          value: values[field.name] ?? field.value,
        })),
      };
      const dateField = nextBlocks["Операционные данные"]?.find(
        (field) => field.name === "Дата операции"
      );
      return {
        ...patient,
        blocks: nextBlocks,
        operationDate: dateField?.value || patient.operationDate,
        updatedAt: now(),
      };
    });
    runtime = { ...runtime, patients };
    pushAudit(
      actor,
      "Редактирование блока",
      `Пациент ${target.code}: обновлен блок «${block}»`
    );
    emit();
    return patients.find((item) => item.id === patientId) || null;
  },

  addDemoFile(actor) {
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
    runtime = {
      ...runtime,
      files: runtime.files.filter((item) => item.name !== name),
    };
    pushAudit(actor, "Удаление файла", `Удален файл «${name}»`);
    emit();
  },
};

export const api = mockApi;
