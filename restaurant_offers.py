import sqlite3
from contextlib import closing
from datetime import datetime, timedelta, timezone
from pathlib import Path

OFFERS_DB = Path(__file__).resolve().parent / "db" / "restaurant_offers.sqlite3"


def dubai_today():
    return datetime.now(timezone(timedelta(hours=4))).date()


def list_offers() -> list[dict]:
    if not OFFERS_DB.is_file():
        return []
    with closing(sqlite3.connect(OFFERS_DB)) as connection:
        connection.row_factory = sqlite3.Row
        if not connection.execute(
            "SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'offers'"
        ).fetchone():
            return []
        rows = connection.execute(
            "SELECT id, kind, title, details, ends_on FROM offers "
            "WHERE ends_on IS NULL OR ends_on >= ? ORDER BY id DESC",
            (dubai_today().isoformat(),),
        )
        return [dict(row) for row in rows]


def add_offer(kind: str, title: str, details: str, ends_on: str | None) -> None:
    OFFERS_DB.parent.mkdir(exist_ok=True)
    with closing(sqlite3.connect(OFFERS_DB)) as connection, connection:
        connection.execute(
            """CREATE TABLE IF NOT EXISTS offers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                kind TEXT NOT NULL,
                title TEXT NOT NULL,
                details TEXT NOT NULL,
                ends_on TEXT
            )"""
        )
        connection.execute(
            "INSERT INTO offers (kind, title, details, ends_on) VALUES (?, ?, ?, ?)",
            (kind, title, details, ends_on),
        )


def remove_offer(offer_id: int) -> bool:
    if not OFFERS_DB.is_file() or not 0 < offer_id < 2**63:
        return False
    with closing(sqlite3.connect(OFFERS_DB)) as connection, connection:
        if not connection.execute(
            "SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'offers'"
        ).fetchone():
            return False
        return connection.execute("DELETE FROM offers WHERE id = ?", (offer_id,)).rowcount == 1
