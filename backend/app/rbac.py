from datetime import datetime

ROLE_LABELS = {
    "leader": "Руководитель исследования",
    "stationary": "Врач стационара",
    "ambulatory": "Врач амбулатории",
}

PERMISSIONS = {
    "stationary": ["patient.create", "files.download"],
    "ambulatory": ["files.download"],
    "leader": [
        "patient.create",
        "patient.delete",
        "files.download",
        "files.manage",
        "audit.view",
        "export.run",
    ],
}

STATIONARY_BLOCKS = [
    "Общие данные",
    "Анамнез",
    "Предоперационные исследования",
    "Операционные данные",
]
AMBULATORY_VIEW = ["Общие данные", "Анамнез", "Послеоперационные наблюдения"]
ALL_BLOCKS = [
    "Общие данные",
    "Анамнез",
    "Предоперационные исследования",
    "Операционные данные",
    "Послеоперационные наблюдения",
]

MESSAGES = {
    "patient.create": "Создание карточки пациента недоступно для текущей роли",
    "patient.delete": "Удаление пациента недоступно для текущей роли",
    "files.download": "Скачивание файлов недоступно для текущей роли",
    "files.manage": "Управление файлами недоступно для текущей роли",
    "audit.view": "Модуль аудита недоступен для текущей роли",
    "export.run": "Выгрузка недоступна для текущей роли",
    "crf.edit": "Редактирование блока недоступно для текущей роли",
}

LOCK_FREE = "нет"


def now() -> str:
    return datetime.now().strftime("%d.%m.%Y %H:%M")


def today() -> str:
    return datetime.now().strftime("%d.%m.%Y")


def can(role: str, permission: str) -> bool:
    return permission in PERMISSIONS.get(role, [])


def can_view_block(role: str, block: str) -> bool:
    if role == "leader":
        return block in ALL_BLOCKS
    if role == "stationary":
        return block in STATIONARY_BLOCKS
    if role == "ambulatory":
        return block in AMBULATORY_VIEW
    return False


def can_edit_block(role: str, block: str) -> bool:
    if role == "leader":
        return block in ALL_BLOCKS
    if role == "stationary":
        return block in STATIONARY_BLOCKS
    if role == "ambulatory":
        return block == "Послеоперационные наблюдения"
    return False


def format_lock(user_id: str) -> str:
    return f"редактируется: {user_id}"


def lock_owner_id(lock: str | None) -> str | None:
    value = (lock or "").strip()
    if not value or value == LOCK_FREE:
        return None
    prefix = "редактируется:"
    if value.lower().startswith(prefix):
        return value.split(":", 1)[1].strip()
    return value


def center_code(center: str) -> str:
    if "Блохина" in center:
        return "Б"
    if "Рыжих" in center:
        return "Р"
    return "С"


def next_patient_id(ids: list[str]) -> str:
    numbers = [int(item) for item in ids if str(item).isdigit()]
    return str((max(numbers) if numbers else 0) + 1)


def next_code(patient_id: str, prefix: str = "С") -> str:
    return f"{prefix}-2026-{str(patient_id).zfill(3)}"
