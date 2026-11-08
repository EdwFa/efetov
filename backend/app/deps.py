from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt.exceptions import InvalidTokenError
from sqlalchemy.orm import Session

from .database import get_db
from .models import User
from .rbac import MESSAGES, ROLE_LABELS, can, now
from .security import SESSION_EXPIRED, decode_token, idle_expired, mark_seen

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


def actor_from_token(
    creds: HTTPAuthorizationCredentials | None,
    db: Session,
    *,
    allow_idle: bool,
) -> Actor:
    if creds is None or creds.scheme.lower() != "bearer":
        raise HTTPException(status_code=401, detail="Нужна авторизация")
    try:
        payload = decode_token(creds.credentials)
    except InvalidTokenError as exc:
        raise HTTPException(status_code=401, detail="Сессия недействительна") from exc
    user = db.get(User, payload.get("sub"))
    if not user or user.removed_at:
        raise HTTPException(status_code=401, detail="Пользователь не найден")
    if user.blocked:
        raise HTTPException(status_code=401, detail="Учётная запись заблокирована")
    if idle_expired(user):
        if not allow_idle:
            raise HTTPException(status_code=401, detail=SESSION_EXPIRED)
    else:
        mark_seen(user)
        db.commit()
    return Actor(user)


def get_current_user(
    creds: HTTPAuthorizationCredentials | None = Depends(bearer),
    db: Session = Depends(get_db),
) -> Actor:
    return actor_from_token(creds, db, allow_idle=False)


def get_session_user(
    creds: HTTPAuthorizationCredentials | None = Depends(bearer),
    db: Session = Depends(get_db),
) -> Actor:
    return actor_from_token(creds, db, allow_idle=True)
