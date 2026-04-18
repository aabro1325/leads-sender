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
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS leads (
                id TEXT PRIMARY KEY,
                created_at REAL NOT NULL,
                data TEXT NOT NULL
            )
            """
        )
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC)"
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


def db_upsert_lead(lead_id: str, created_at: float, data_json: str) -> None:
    with _connect() as conn:
        conn.execute(
            """
            INSERT INTO leads (id, created_at, data) VALUES (?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET data = excluded.data
            """,
            (lead_id, created_at, data_json),
        )


def db_get_lead(lead_id: str) -> str | None:
    with _connect() as conn:
        row = conn.execute(
            "SELECT data FROM leads WHERE id = ?", (lead_id,)
        ).fetchone()
    return row[0] if row else None


def db_list_leads(limit: int = 100) -> list[str]:
    with _connect() as conn:
        rows = conn.execute(
            "SELECT data FROM leads ORDER BY created_at DESC LIMIT ?", (limit,)
        ).fetchall()
    return [r[0] for r in rows]


def db_delete_lead(lead_id: str) -> bool:
    with _connect() as conn:
        cur = conn.execute("DELETE FROM leads WHERE id = ?", (lead_id,))
        return cur.rowcount > 0
