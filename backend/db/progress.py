"""
NagarSetu — SQLite persistence per AGENTS.md §6.3.

Tables: sessions, progress. Anonymous session IDs only (§2.2).
"""

import sqlite3
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
DB_PATH = Path(__import__("os").getenv(
    "SQLITE_PATH", REPO_ROOT / "progress.db"
))

SCHEMA = """
CREATE TABLE IF NOT EXISTS sessions (
  session_id TEXT PRIMARY KEY,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  language TEXT DEFAULT 'en'
);

CREATE TABLE IF NOT EXISTS progress (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL,
  procedure_id TEXT NOT NULL,
  step_number INTEGER NOT NULL,
  completed BOOLEAN DEFAULT 0,
  completed_at TIMESTAMP,
  UNIQUE(session_id, procedure_id, step_number),
  FOREIGN KEY (session_id) REFERENCES sessions(session_id)
);
"""


def get_conn() -> sqlite3.Connection:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.execute("PRAGMA foreign_keys = ON")
    conn.executescript(SCHEMA)
    return conn


def ensure_session(session_id: str, language: str = "en") -> None:
    with get_conn() as conn:
        conn.execute(
            "INSERT OR IGNORE INTO sessions (session_id, language) VALUES (?, ?)",
            (session_id, language),
        )


def upsert_progress(session_id: str, procedure_id: str,
                    step_number: int, completed: bool) -> None:
    ensure_session(session_id)
    with get_conn() as conn:
        conn.execute(
            """
            INSERT INTO progress (session_id, procedure_id, step_number, completed, completed_at)
            VALUES (?, ?, ?, ?, CASE WHEN ? THEN CURRENT_TIMESTAMP ELSE NULL END)
            ON CONFLICT(session_id, procedure_id, step_number)
            DO UPDATE SET completed = excluded.completed,
                          completed_at = excluded.completed_at
            """,
            (session_id, procedure_id, step_number, completed, completed),
        )


def get_progress(session_id: str, procedure_id: str) -> tuple[list[int], int]:
    """Returns (completed_steps, total_steps). total = max step number seen."""
    with get_conn() as conn:
        rows = conn.execute(
            "SELECT step_number, completed FROM progress "
            "WHERE session_id = ? AND procedure_id = ?",
            (session_id, procedure_id),
        ).fetchall()
    completed = [r[0] for r in rows if r[1]]
    total = max((r[0] for r in rows), default=0)
    return completed, total