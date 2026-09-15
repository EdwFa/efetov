from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt.exceptions import InvalidTokenError
from sqlalchemy.orm import Session

from .database import get_db
from .models import User
from .rbac import MESSAGES, ROLE_LABELS, can, now
from .security import decode_token

bearer = HTTPBearer(auto_error=False)


class Actor:
    def __init__(self, user: User):
        self.id = user.id
        self.login = user.login
        self.role = user.role
        self.name = user.name


def deny(db: Session, actor: Actor, permission: str, detail: str | None = None):
    from .models import AuditEvent

    message = detail or MESSAGES[permission]
    db.add(
        AuditEvent(
            time=now(),
            user_id=actor.id,
            role=ROLE_LABELS[actor.role],
            action="Отказ в доступе",
            details=message,
        )
    )
    db.commit()
    raise HTTPException(status_code=403, detail={"permission": permission, "message": message})


def require_permission(db: Session, actor: Actor, permission: str):
    if not can(actor.role, permission):
        deny(db, actor, permission)


def get_current_user(
    creds: HTTPAuthorizationCredentials | None = Depends(bearer),
    db: Session = Depends(get_db),
) -> Actor:
    if creds is None or creds.scheme.lower() != "bearer":
        raise HTTPException(status_code=401, detail="Нужна авторизация")
    try:
        payload = decode_token(creds.credentials)
    except InvalidTokenError as exc:
        raise HTTPException(status_code=401, detail="Сессия недействительна") from exc
    user = db.get(User, payload.get("sub"))
    if not user:
        raise HTTPException(status_code=401, detail="Пользователь не найден")
    return Actor(user)
