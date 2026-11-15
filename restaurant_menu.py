import sqlite3
from contextlib import closing
from pathlib import Path

MENU_DB = Path(__file__).resolve().parent / "db" / "restaurant_menu.sqlite3"


def list_menu_items() -> list[dict]:
    if not MENU_DB.is_file():
        return []
    with closing(sqlite3.connect(MENU_DB)) as connection:
        connection.row_factory = sqlite3.Row
        if not connection.execute(
            "SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'menu_items'"
        ).fetchone():
            return []
        rows = connection.execute(
            "SELECT id, name, description, price, image IS NOT NULL AS has_image "
            "FROM menu_items ORDER BY id"
        )
        return [
            {
                "id": row["id"],
                "name": row["name"],
                "description": row["description"],
                "price": row["price"],
                "image": f"/api/menu/{row['id']}/image" if row["has_image"] else None,
            }
            for row in rows
        ]


def read_menu_image(item_id: int) -> bytes | None:
    if not MENU_DB.is_file() or not 0 < item_id < 2**63:
        return None
    with closing(sqlite3.connect(MENU_DB)) as connection:
        if not connection.execute(
            "SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'menu_items'"
        ).fetchone():
            return None
        row = connection.execute(
            "SELECT image FROM menu_items WHERE id = ?", (item_id,)
        ).fetchone()
        return row[0] if row else None


def add_menu_item(name: str, description: str, price: str, image: bytes | None) -> None:
    MENU_DB.parent.mkdir(exist_ok=True)
    with closing(sqlite3.connect(MENU_DB)) as connection, connection:
        connection.execute(
            """CREATE TABLE IF NOT EXISTS menu_items (
                id INTEGER PRIMARY KEY,
                name TEXT NOT NULL,
                description TEXT NOT NULL,
                price TEXT NOT NULL,
                image BLOB
            )"""
        )
        connection.execute(
            "INSERT INTO menu_items (name, description, price, image) VALUES (?, ?, ?, ?)",
            (name, description, price, image),
        )
