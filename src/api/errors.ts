import type { Permission } from "@/entities/user/roles";

const MESSAGES: Record<Permission, string> = {
  "patient.create": "Создание карточки пациента недоступно для текущей роли",
  "patient.delete": "Удаление пациента недоступно для текущей роли",
  "files.download": "Скачивание файлов недоступно для текущей роли",
  "files.manage": "Управление файлами недоступно для текущей роли",
  "audit.view": "Модуль аудита недоступен для текущей роли",
  "export.run": "Выгрузка недоступна для текущей роли",
  "crf.edit": "Редактирование блока недоступно для текущей роли",
};

export class ForbiddenError extends Error {
  readonly permission: Permission;

  constructor(permission: Permission, message?: string) {
    super(message ?? MESSAGES[permission]);
    this.name = "ForbiddenError";
    this.permission = permission;
  }
}

export function isForbiddenError(error: unknown): error is ForbiddenError {
  return error instanceof ForbiddenError;
}

export function tryApi<T>(
  fn: () => T,
  onForbidden: (error: ForbiddenError) => void
): { ok: true; value: T } | { ok: false } {
  try {
    return { ok: true, value: fn() };
  } catch (error) {
    if (isForbiddenError(error)) {
      onForbidden(error);
      return { ok: false };
    }
    throw error;
  }
}
