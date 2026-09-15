import json
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from .crf import apply_block_values, empty_blocks
from .database import Base, SessionLocal, engine, get_db
from .deps import Actor, deny, get_current_user, require_permission
from .models import AuditEvent, Patient, StoredFile, User
from .rbac import ROLE_LABELS, can_edit_block, center_code, next_code, next_patient_id, now, today
from .security import create_token, verify_password
from .seed import load_seed, reset_database, seed_database
from .serialize import file_to_dict, patient_to_dict, user_to_session


class LoginBody(BaseModel):
    login: str
    password: str
    details: str = "Успешная аутентификация"


class CreatePatientBody(BaseModel):
    code: str = ""
    center: str
    operationDate: str = ""
    values: dict[str, str] = Field(default_factory=dict)


class SaveBlockBody(BaseModel):
    values: dict[str, str] = Field(default_factory=dict)


class ExportBody(BaseModel):
    details: str


class EndSessionBody(BaseModel):
    reason: str = "manual"


def users_map(db: Session) -> dict[str, User]:
    return {user.id: user for user in db.query(User).all()}


def runtime_payload(db: Session) -> dict:
    people = users_map(db)
    patients = [
        patient_to_dict(item, people)
        for item in db.query(Patient).order_by(Patient.id.asc()).all()
    ]
    files = [file_to_dict(item) for item in db.query(StoredFile).all()]
    audit = [
        {
            "time": item.time,
            "userId": item.user_id,
            "role": item.role,
            "action": item.action,
            "details": item.details,
        }
        for item in db.query(AuditEvent).order_by(AuditEvent.id.desc()).all()
    ]
    return {"patients": patients, "files": files, "audit": audit}


def add_audit(db: Session, actor: Actor, action: str, details: str):
    db.add(
        AuditEvent(
            time=now(),
            user_id=actor.id,
            role=ROLE_LABELS[actor.role],
            action=action,
            details=details,
        )
    )


def get_patient(db: Session, patient_id: str) -> Patient:
    patient = db.get(Patient, patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Пациент не найден")
    return patient


@asynccontextmanager
async def lifespan(_app: FastAPI):
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if db.query(User).count() == 0:
            seed_database(db)
    finally:
        db.close()
    yield


app = FastAPI(title="Efetov API", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health():
    return {"ok": True, "db": "sqlite"}


@app.get("/api/demo-users")
def demo_users():
    return [
        {
            "id": item["id"],
            "login": item["login"],
            "password": item["password"],
            "role": item["role"],
            "name": item["name"],
        }
        for item in load_seed()["users"]
    ]


@app.post("/api/login")
def login(body: LoginBody, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.login == body.login).first()
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Неверный логин или пароль")
    actor = Actor(user)
    add_audit(db, actor, "Вход в систему", body.details)
    db.commit()
    return {"user": user_to_session(user), "token": create_token(user)}


@app.get("/api/runtime")
def get_runtime(_actor: Actor = Depends(get_current_user), db: Session = Depends(get_db)):
    return runtime_payload(db)


@app.post("/api/reset-demo")
def reset_demo(_actor: Actor = Depends(get_current_user), db: Session = Depends(get_db)):
    reset_database(db)
    return runtime_payload(db)


@app.post("/api/export")
def record_export(
    body: ExportBody,
    actor: Actor = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    require_permission(db, actor, "export.run")
    add_audit(db, actor, "Экспорт", body.details)
    db.commit()
    return {"ok": True}


@app.post("/api/session/end")
def end_session(
    body: EndSessionBody,
    actor: Actor = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    for patient in db.query(Patient).filter(Patient.lock_user_id == actor.id).all():
        patient.lock_user_id = None
    action = "Выход по неактивности" if body.reason == "idle" else "Выход из системы"
    details = (
        "Автоматическое завершение сессии после 15 минут бездействия"
        if body.reason == "idle"
        else "Пользователь завершил сессию"
    )
    add_audit(db, actor, action, details)
    db.commit()
    return {"ok": True}


@app.post("/api/patients")
def create_patient(
    body: CreatePatientBody,
    actor: Actor = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    require_permission(db, actor, "patient.create")
    ids = [item.id for item in db.query(Patient).all()]
    patient_id = next_patient_id(ids)
    prefix = center_code(body.center)
    code = body.code.strip() or next_code(patient_id, prefix)
    operation_date = body.operationDate.strip() or "—"
    blocks = empty_blocks()
    for block, fields in list(blocks.items()):
        values = {} if block == "Послеоперационные наблюдения" else body.values
        blocks[block] = apply_block_values(block, fields, values)
    created_at = now()
    patient = Patient(
        id=patient_id,
        code=code,
        center=body.center,
        group=body.center,
        center_code=prefix,
        operation_date=operation_date,
        created_by=actor.id,
        created_at=created_at,
        updated_at=created_at,
        lock_user_id=None,
        blocks_json=json.dumps(blocks, ensure_ascii=False),
    )
    db.add(patient)
    add_audit(db, actor, "Создание карты пациента", f"Создана карточка ID {patient_id}, шифр {code}")
    db.commit()
    db.refresh(patient)
    return patient_to_dict(patient, users_map(db))


@app.delete("/api/patients/{patient_id}")
def delete_patient(
    patient_id: str,
    actor: Actor = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    require_permission(db, actor, "patient.delete")
    patient = get_patient(db, patient_id)
    payload = patient_to_dict(patient, users_map(db))
    db.delete(patient)
    add_audit(
        db,
        actor,
        "Удаление карты пациента",
        f"Удалена карточка ID {payload['id']}, шифр {payload['code']}",
    )
    db.commit()
    return payload


@app.put("/api/patients/{patient_id}/block")
def save_block(
    patient_id: str,
    block: str,
    body: SaveBlockBody,
    actor: Actor = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not can_edit_block(actor.role, block):
        deny(db, actor, "crf.edit", f"Редактирование блока «{block}» недоступно для текущей роли")
    patient = get_patient(db, patient_id)
    if patient.lock_user_id and patient.lock_user_id != actor.id:
        deny(
            db,
            actor,
            "crf.edit",
            f"Карточка {patient.code} редактируется пользователем {patient.lock_user_id}",
        )
    blocks = json.loads(patient.blocks_json)
    stored = blocks.get(block) or []
    blocks[block] = apply_block_values(block, stored, body.values)
    date_field = next(
        (
            field
            for field in blocks.get("Операционные данные", [])
            if field.get("name") == "Дата операции" or field.get("key") == "opDate"
        ),
        None,
    )
    if date_field and date_field.get("value"):
        patient.operation_date = date_field["value"]
    patient.blocks_json = json.dumps(blocks, ensure_ascii=False)
    patient.updated_at = now()
    add_audit(db, actor, "Редактирование блока", f"Пациент {patient.code}: обновлен блок «{block}»")
    db.commit()
    db.refresh(patient)
    return patient_to_dict(patient, users_map(db))


@app.post("/api/patients/{patient_id}/lock")
def lock_patient(
    patient_id: str,
    actor: Actor = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    patient = get_patient(db, patient_id)
    owner = patient.lock_user_id
    if owner and owner != actor.id and actor.role != "leader":
        deny(
            db,
            actor,
            "crf.edit",
            f"Карточка {patient.code} уже редактируется пользователем {owner}",
        )
    if owner == actor.id:
        return patient_to_dict(patient, users_map(db))
    patient.lock_user_id = actor.id
    details = (
        f"Карточка {patient.code}: блокировка перехвачена у {owner}"
        if owner and owner != actor.id
        else f"Карточка {patient.code} взята в работу"
    )
    add_audit(db, actor, "Блокировка карты", details)
    db.commit()
    db.refresh(patient)
    return patient_to_dict(patient, users_map(db))


@app.post("/api/patients/{patient_id}/unlock")
def unlock_patient(
    patient_id: str,
    actor: Actor = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    patient = get_patient(db, patient_id)
    owner = patient.lock_user_id
    if not owner:
        return patient_to_dict(patient, users_map(db))
    if owner != actor.id and actor.role != "leader":
        deny(
            db,
            actor,
            "crf.edit",
            f"Снять блокировку карточки {patient.code} может только {owner} или руководитель",
        )
    patient.lock_user_id = None
    add_audit(db, actor, "Снятие блокировки", f"Карточка {patient.code}: блокировка снята")
    db.commit()
    db.refresh(patient)
    return patient_to_dict(patient, users_map(db))


@app.post("/api/files")
def add_demo_file(
    actor: Actor = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    require_permission(db, actor, "files.manage")
    count = db.query(StoredFile).count()
    month = ["Июнь", "Июль", "Август"][count % 3]
    name = f"Демо-файл {count + 1}.pdf"
    file = StoredFile(
        name=name,
        folder=f"2026 / {month} / Руководитель",
        author=actor.id,
        date=today(),
        comment="Добавлено в демо-прототипе",
    )
    db.add(file)
    add_audit(db, actor, "Загрузка файла", f"Загружен файл «{name}»")
    db.commit()
    db.refresh(file)
    return file_to_dict(file)


@app.delete("/api/files")
def delete_file(
    name: str,
    actor: Actor = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    require_permission(db, actor, "files.manage")
    file = db.query(StoredFile).filter(StoredFile.name == name).first()
    if not file:
        raise HTTPException(status_code=404, detail="Файл не найден")
    db.delete(file)
    add_audit(db, actor, "Удаление файла", f"Удален файл «{name}»")
    db.commit()
    return {"ok": True}
