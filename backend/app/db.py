from __future__ import annotations

import sqlite3
from pathlib import Path

from .config import settings

_db_path = Path(settings.db_path)


def _connect() -> sqlite3.Connection:
    _db_path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(_db_path), check_same_thread=False)
    conn.execute("PRAGMA journal_mode=WAL")
    return conn


def init_db() -> None:
    with _connect() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS sent_emails (
                email TEXT PRIMARY KEY,
                sent_at TEXT NOT NULL DEFAULT (datetime('now'))
            )
            """
        )


def email_already_sent(email: str) -> bool:
    with _connect() as conn:
        row = conn.execute(
            "SELECT 1 FROM sent_emails WHERE email = ?", (email.lower(),)
        ).fetchone()
    return row is not None


def mark_email_sent(email: str) -> None:
    with _connect() as conn:
        conn.execute(
            "INSERT OR IGNORE INTO sent_emails (email) VALUES (?)", (email.lower(),)
        )
