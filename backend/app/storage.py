from pathlib import Path

from fastapi import HTTPException
from sqlalchemy.orm import Session

from .database import DATA_DIR
from .models import StoredFile, StoredFolder

UPLOAD_DIR = DATA_DIR / "uploads"


def upload_path(file_id: int) -> Path:
    return UPLOAD_DIR / str(file_id)


def write_upload(file_id: int, content: bytes) -> None:
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    upload_path(file_id).write_bytes(content)


def remove_upload(file_id: int) -> None:
    upload_path(file_id).unlink(missing_ok=True)


def folder_parts(path: str) -> list[str]:
    return [part.strip() for part in path.split("/") if part.strip()]


def join_folder(parent: str, name: str) -> str:
    parent = parent.strip()
    return f"{parent} / {name}" if parent else name


def known_folders(db: Session) -> set[str]:
    paths = {row.path for row in db.query(StoredFolder).all()}
    for stored in db.query(StoredFile).all():
        acc: list[str] = []
        for part in folder_parts(stored.folder):
            acc.append(part)
            paths.add(" / ".join(acc))
    return paths


def clean_folder_name(name: str) -> str:
    cleaned = name.strip()
    if not cleaned or cleaned in {".", ".."} or "/" in cleaned or "\\" in cleaned:
        raise HTTPException(status_code=400, detail="Некорректное имя папки")
    return cleaned


def clean_file_name(name: str | None) -> str:
    cleaned = Path(name or "").name.strip()
    if not cleaned or cleaned in {".", ".."}:
        raise HTTPException(status_code=400, detail="Некорректное имя файла")
    return cleaned


def require_folder(db: Session, folder: str) -> str:
    folder = folder.strip()
    if folder and folder not in known_folders(db):
        raise HTTPException(status_code=400, detail="Папка не найдена")
    return folder
