import type { Permission } from "@/entities/user/roles";
import type { SessionUser } from "@/entities/user/types";
import { loadToken, saveToken } from "@/features/auth/session";
import { ForbiddenError } from "./errors";
import type {
  AppApi,
  CreatePatientInput,
  RuntimeSnapshot,
} from "./client";
import { EMPTY_RUNTIME } from "./client";

const API_ROOT =
  (import.meta.env.VITE_API_URL as string | undefined) ||
  (import.meta.env.DEV ? "http://127.0.0.1:8000" : "");

let snapshot: RuntimeSnapshot = EMPTY_RUNTIME;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function setSnapshot(next: RuntimeSnapshot) {
  snapshot = next;
  emit();
}

if (import.meta.hot) {
  const previous = import.meta.hot.data.snapshot as RuntimeSnapshot | undefined;
  if (previous) snapshot = previous;
  import.meta.hot.dispose((data) => {
    data.snapshot = snapshot;
  });
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", "application/json");
  }
  const token = loadToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const response = await fetch(`${API_ROOT}${path}`, { ...init, headers });
  if (response.status === 204) return undefined as T;
  const data = await response.json().catch(() => ({}));
  if (response.status === 403) {
    const detail = data.detail ?? data;
    throw new ForbiddenError(
      (detail.permission ?? "crf.edit") as Permission,
      detail.message ?? detail.detail ?? "Недостаточно прав"
    );
  }
  if (!response.ok) {
    const message =
      typeof data.detail === "string"
        ? data.detail
        : data.detail?.message || `Ошибка API (${response.status})`;
    throw new Error(message);
  }
  return data as T;
}

async function refreshRuntime(): Promise<RuntimeSnapshot> {
  if (!loadToken()) {
    setSnapshot(EMPTY_RUNTIME);
    return snapshot;
  }
  const next = await request<RuntimeSnapshot>("/api/runtime");
  setSnapshot(next);
  return next;
}

export const api: AppApi = {
  async listDemoUsers() {
    return request("/api/demo-users");
  },

  async authenticate(login, password, details = "Успешная аутентификация") {
    const response = await fetch(`${API_ROOT}/api/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ login, password, details }),
    });
    if (response.status === 401) return null;
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.detail || "Ошибка входа");
    }
    saveToken(data.token);
    await refreshRuntime();
    return data.user as SessionUser;
  },

  getRuntime() {
    return snapshot;
  },

  subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  refreshRuntime,

  async resetDemoData() {
    setSnapshot(await request("/api/reset-demo", { method: "POST" }));
  },

  async recordExport(_actor, details) {
    await request("/api/export", {
      method: "POST",
      body: JSON.stringify({ details }),
    });
  },

  async createPatient(_actor, input: CreatePatientInput) {
    const patient = await request<RuntimeSnapshot["patients"][number]>(
      "/api/patients",
      {
        method: "POST",
        body: JSON.stringify(input),
      }
    );
    await refreshRuntime();
    return patient;
  },

  async deletePatient(_actor, id) {
    const patient = await request<RuntimeSnapshot["patients"][number]>(
      `/api/patients/${id}`,
      { method: "DELETE" }
    );
    await refreshRuntime();
    return patient;
  },

  async savePatientBlock(_actor, patientId, block, values) {
    const patient = await request<RuntimeSnapshot["patients"][number]>(
      `/api/patients/${patientId}/block?block=${encodeURIComponent(block)}`,
      {
        method: "PUT",
        body: JSON.stringify({ values }),
      }
    );
    await refreshRuntime();
    return patient;
  },

  async lockPatient(_actor, patientId) {
    const patient = await request<RuntimeSnapshot["patients"][number]>(
      `/api/patients/${patientId}/lock`,
      { method: "POST" }
    );
    await refreshRuntime();
    return patient;
  },

  async unlockPatient(_actor, patientId) {
    const patient = await request<RuntimeSnapshot["patients"][number]>(
      `/api/patients/${patientId}/unlock`,
      { method: "POST" }
    );
    await refreshRuntime();
    return patient;
  },

  async endSession(_actor, reason) {
    try {
      await request("/api/session/end", {
        method: "POST",
        body: JSON.stringify({ reason }),
      });
    } finally {
      saveToken(null);
      setSnapshot(EMPTY_RUNTIME);
    }
  },

  async addDemoFile(_actor) {
    const file = await request<RuntimeSnapshot["files"][number]>("/api/files", {
      method: "POST",
    });
    await refreshRuntime();
    return file;
  },

  async deleteFile(_actor, name) {
    await request(`/api/files?name=${encodeURIComponent(name)}`, {
      method: "DELETE",
    });
    await refreshRuntime();
  },
};
