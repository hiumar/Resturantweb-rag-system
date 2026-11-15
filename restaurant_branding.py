import io
import sqlite3
from contextlib import closing
from pathlib import Path

from PIL import Image, ImageOps

BRANDING_DB = Path(__file__).resolve().parent / "db" / "restaurant_branding.sqlite3"
MAX_LOGO_BYTES = 2 * 1024 * 1024


def read_branding() -> tuple[str | None, bytes | None]:
    if not BRANDING_DB.is_file():
        return None, None
    with closing(sqlite3.connect(BRANDING_DB)) as connection:
        if not connection.execute(
            "SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'branding'"
        ).fetchone():
            return None, None
        row = connection.execute(
            "SELECT name, logo FROM branding WHERE id = 1"
        ).fetchone()
    return row if row else (None, None)


def save_branding(*, name: str | None = None, logo: bytes | None = None) -> None:
    BRANDING_DB.parent.mkdir(exist_ok=True)
    with closing(sqlite3.connect(BRANDING_DB)) as connection, connection:
        connection.execute(
            "CREATE TABLE IF NOT EXISTS branding (id INTEGER PRIMARY KEY, name TEXT, logo BLOB)"
        )
        connection.execute(
            """INSERT INTO branding (id, name, logo) VALUES (1, ?, ?)
               ON CONFLICT(id) DO UPDATE SET
               name = COALESCE(excluded.name, branding.name),
               logo = COALESCE(excluded.logo, branding.logo)""",
            (name, logo),
        )


def normalize_logo(data: bytes) -> bytes:
    return normalize_image(data, size=512, format="PNG", label="logo")


def normalize_image(data: bytes, *, size: int, format: str, label: str) -> bytes:
    try:
        with Image.open(io.BytesIO(data), formats=["PNG", "JPEG", "WEBP"]) as image:
            if max(image.size) > 4096:
                raise ValueError
            normalized = ImageOps.exif_transpose(image).convert("RGBA")
            normalized.thumbnail((size, size), Image.Resampling.LANCZOS)
            output = io.BytesIO()
            normalized.save(output, format=format)
    except (OSError, ValueError, Image.DecompressionBombError, SyntaxError):
        raise ValueError(f"Choose a valid PNG, JPEG, or WebP {label} up to 4096 pixels per side.") from None
    return output.getvalue()
