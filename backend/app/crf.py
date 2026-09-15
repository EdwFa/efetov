CRF_SCHEMA = [
    {"key": "age", "block": "Общие данные", "label": "Возраст", "hint": "из исходной таблицы: «Возраст (во время операции)»"},
    {"key": "diagnosis", "block": "Общие данные", "label": "Диагноз"},
    {"key": "sex", "block": "Общие данные", "label": "Пол (М - 1, Ж - 0)"},
    {"key": "stage", "block": "Общие данные", "label": "Стадия"},
    {"key": "height", "block": "Общие данные", "label": "Рост"},
    {"key": "weight", "block": "Общие данные", "label": "Вес"},
    {"key": "bmi", "block": "Общие данные", "label": "ИМТ", "hint": "вычисляемый параметр", "computed_from": ["height", "weight"]},
    {"key": "comorbidities", "block": "Анамнез", "label": "Сопутствующие заболевания"},
    {"key": "charlson", "block": "Анамнез", "label": "Индекс коморбидности Чарлсона"},
    {"key": "ecog", "block": "Анамнез", "label": "ECOG"},
    {"key": "karnofsky", "block": "Анамнез", "label": "Шкала Карновского"},
    {"key": "asa", "block": "Анамнез", "label": "Риск ASA"},
    {"key": "priorSurgery", "block": "Анамнез", "label": "Операции в анамнезе"},
    {"key": "colonoscopyTumor", "block": "Предоперационные исследования", "label": "Колоноскопия: описание опухоли, дата"},
    {"key": "colonoscopyOther", "block": "Предоперационные исследования", "label": "Колоноскопия: другие изменения"},
    {"key": "ctAbdomen", "block": "Предоперационные исследования", "label": "КТ органов брюшной полости, дата"},
    {"key": "ctChest", "block": "Предоперационные исследования", "label": "КТ органов грудной клетки"},
    {"key": "cea", "block": "Предоперационные исследования", "label": "РЭА, нг/мл"},
    {"key": "ca199", "block": "Предоперационные исследования", "label": "СА 19-9, МЕ/мл"},
    {"key": "hemoglobin", "block": "Предоперационные исследования", "label": "Гемоглобин, г/л"},
    {"key": "wbc", "block": "Предоперационные исследования", "label": "Лейкоциты, *10^9/л"},
    {"key": "platelets", "block": "Предоперационные исследования", "label": "Тромбоциты, *10^9/л"},
    {"key": "creatinine", "block": "Предоперационные исследования", "label": "Креатинин, мкмоль/л"},
    {"key": "hospDate", "block": "Операционные данные", "label": "Дата госпитализации"},
    {"key": "attending", "block": "Операционные данные", "label": "Лечащий врач"},
    {"key": "opDate", "block": "Операционные данные", "label": "Дата операции"},
    {"key": "surgeon", "block": "Операционные данные", "label": "Хирург"},
    {"key": "assistants", "block": "Операционные данные", "label": "Ассистенты"},
    {"key": "operationName", "block": "Операционные данные", "label": "Название операции"},
    {"key": "access", "block": "Операционные данные", "label": "Доступ (лапароскопия-1 / лапаротомия-0 / робот-2)", "aliases": ["Доступ"]},
    {"key": "bloodLoss", "block": "Операционные данные", "label": "Кровопотеря"},
    {"key": "tumorDesc", "block": "Операционные данные", "label": "Описание опухоли"},
    {"key": "intraopComplications", "block": "Операционные данные", "label": "Интраоперационные осложнения"},
    {"key": "icuDays", "block": "Послеоперационные наблюдения", "label": "Количество суток в ОРИТ"},
    {"key": "postopComplications", "block": "Послеоперационные наблюдения", "label": "Осложнения в послеоперационном периоде"},
    {"key": "woundComplications", "block": "Послеоперационные наблюдения", "label": "Раневые осложнения"},
    {"key": "clavien", "block": "Послеоперационные наблюдения", "label": "Clavien-Dindo"},
    {"key": "dischargeDate", "block": "Послеоперационные наблюдения", "label": "Дата выписки"},
    {"key": "followed", "block": "Послеоперационные наблюдения", "label": "Отслежен (да-1, нет-0)"},
    {"key": "lastContact", "block": "Послеоперационные наблюдения", "label": "Дата последнего контакта"},
    {"key": "progression", "block": "Послеоперационные наблюдения", "label": "Прогрессия (да-1, нет-0)"},
    {"key": "localRecurrence", "block": "Послеоперационные наблюдения", "label": "Местный рецидив"},
]


def _norm(value: str) -> str:
    return " ".join(str(value or "").replace("\n", " ").split()).strip().lower()


def fields_of(block: str) -> list[dict]:
    return [field for field in CRF_SCHEMA if field["block"] == block]


def field_names(field: dict) -> list[str]:
    return [field["label"], *field.get("aliases", [])]


def match_stored(stored: list[dict], field: dict) -> dict | None:
    names = {_norm(name) for name in field_names(field)}
    for item in stored:
        if _norm(item.get("name", "")) in names:
            return item
    return None


def compute_bmi(height_cm: str, weight_kg: str) -> str:
    try:
        height = float(str(height_cm).replace(",", "."))
        weight = float(str(weight_kg).replace(",", "."))
    except ValueError:
        return ""
    if height <= 0 or weight <= 0:
        return ""
    meters = height / 100
    return f"{weight / (meters * meters):.2f}"


def merge_block(block: str, stored: list[dict] | None = None) -> list[dict]:
    stored = stored or []
    used: set[int] = set()
    merged: list[dict] = []
    for field in fields_of(block):
        found = match_stored(stored, field)
        if found is not None:
            used.add(id(found))
        merged.append(
            {
                "key": field["key"],
                "name": field["label"],
                "value": (found or {}).get("value", ""),
                "hint": field.get("hint") or (found or {}).get("hint"),
            }
        )
    extras = [item for item in stored if id(item) not in used]
    return [*merged, *extras]


def with_computed(fields: list[dict]) -> list[dict]:
    height = match_stored(fields, next(f for f in CRF_SCHEMA if f["key"] == "height"))
    weight = match_stored(fields, next(f for f in CRF_SCHEMA if f["key"] == "weight"))
    bmi = compute_bmi((height or {}).get("value", ""), (weight or {}).get("value", ""))
    result = []
    for field in fields:
        if field.get("key") == "bmi" or field.get("name") == "ИМТ":
            result.append({**field, "value": bmi or field.get("value", "")})
        else:
            result.append(field)
    return result


def apply_block_values(block: str, stored: list[dict], values: dict[str, str]) -> list[dict]:
    merged = merge_block(block, stored)
    applied = []
    for field in merged:
        value = values.get(field["name"])
        if value is None and field.get("key"):
            value = values.get(field["key"])
        if value is None:
            value = field.get("value", "")
        applied.append({**field, "value": value})
    return with_computed(applied)


def empty_blocks() -> dict[str, list[dict]]:
    from .rbac import ALL_BLOCKS

    blocks: dict[str, list[dict]] = {}
    for block in ALL_BLOCKS:
        blocks[block] = [
            {
                "key": field["key"],
                "name": field["label"],
                "value": "",
                "hint": field.get("hint"),
            }
            for field in fields_of(block)
        ]
    return blocks
