import json
from pathlib import Path

from sqlalchemy.orm import Session

from .models import AuditEvent, Patient, StoredFile, User
from .rbac import lock_owner_id
from .security import hash_password

SEED_PATH = Path(__file__).resolve().parent.parent / "seed.json"


def load_seed() -> dict:
    return json.loads(SEED_PATH.read_text(encoding="utf-8"))


def seed_database(db: Session) -> None:
    payload = load_seed()
    users_by_id: dict[str, dict] = {}
    for item in payload["users"]:
        users_by_id[item["id"]] = item
        db.add(
            User(
                id=item["id"],
                login=item["login"],
                password_hash=hash_password(item["password"]),
                role=item["role"],
                name=item["name"],
            )
        )

    extra_creators = {
        "U-STA-002": ("krasnov", "stationary", "Краснов"),
        "U-STA-003": ("doctor_blohin", "stationary", "Врач стационара"),
        "U-STA-004": ("doctor_ryzhih", "stationary", "Врач стационара"),
    }
    for user_id, (login, role, name) in extra_creators.items():
        if user_id not in users_by_id:
            db.add(
                User(
                    id=user_id,
                    login=login,
                    password_hash=hash_password("unused"),
                    role=role,
                    name=name,
                )
            )

    for item in payload["patients"]:
        db.add(
            Patient(
                id=item["id"],
                code=item["code"],
                center=item["center"],
                group=item.get("group") or item["center"],
                center_code=item.get("centerCode") or "",
                operation_date=item.get("operationDate") or "—",
                created_by=item["createdBy"],
                created_at=item["createdAt"],
                updated_at=item["updatedAt"],
                lock_user_id=lock_owner_id(item.get("lock")),
                blocks_json=json.dumps(item["blocks"], ensure_ascii=False),
            )
        )

    for item in payload["files"]:
        db.add(
            StoredFile(
                name=item["name"],
                folder=item["folder"],
                author=item["author"],
                date=item["date"],
                comment=item["comment"],
            )
        )

    for item in reversed(payload["audit"]):
        db.add(
            AuditEvent(
                time=item["time"],
                user_id=item["userId"],
                role=item["role"],
                action=item["action"],
                details=item["details"],
            )
        )
    db.commit()


def reset_database(db: Session) -> None:
    db.query(AuditEvent).delete()
    db.query(StoredFile).delete()
    db.query(Patient).delete()
    db.query(User).delete()
    db.commit()
    seed_database(db)
