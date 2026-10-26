"""
NagarSetu — Persistent storage and verified progress management.

Supports both PostgreSQL (via DATABASE_URL on Antideploy) and SQLite fallback.
Binds progress tracking to authenticated user IDs or an isolated, validated demo identity.
Enforces procedure validity and step bounds per procedure.
"""

from contextlib import contextmanager
from datetime import datetime, timezone
import os
from pathlib import Path
import sqlite3
from typing import Generator, Optional, Tuple, Any

try:
    import psycopg
    from psycopg.rows import dict_row
    HAS_PSYCOPG = True
except ImportError:
    HAS_PSYCOPG = False

REPO_ROOT = Path(__file__).resolve().parent.parent.parent

# Supported procedure registry with step limits
SUPPORTED_PROCEDURES = {
    "chandigarh_trade_license": {
        "name": "Trade License — Chandigarh Municipal Corporation",
        "max_steps": 8,
    },
    "water_connection": {
        "name": "New Water Connection — Punjab / Chandigarh",
        "max_steps": 8,
    },
    "property_tax": {
        "name": "Property Tax Payment — Chandigarh Municipal Corporation",
        "max_steps": 7,
    },
}

DEMO_PRINCIPAL_PREFIX = "demo-sess-"

PG_SCHEMA = """
CREATE TABLE IF NOT EXISTS sessions (
  session_id TEXT PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  language TEXT DEFAULT 'en'
);

CREATE TABLE IF NOT EXISTS progress (
  id BIGSERIAL PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES sessions(session_id) ON DELETE CASCADE,
  procedure_id TEXT NOT NULL,
  step_number INTEGER NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(session_id, procedure_id, step_number)
);

CREATE INDEX IF NOT EXISTS idx_progress_lookup 
  ON progress(session_id, procedure_id);
"""

SQLITE_SCHEMA = """
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

CREATE INDEX IF NOT EXISTS idx_progress_lookup 
  ON progress(session_id, procedure_id);
"""


def _get_sqlite_path() -> Path:
    _env_db = os.getenv("SQLITE_PATH")
    if not _env_db:
        return (REPO_ROOT / "progress.db").resolve()
    _p = Path(_env_db)
    return _p.resolve() if _p.is_absolute() else (REPO_ROOT / _p).resolve()


DB_PATH = _get_sqlite_path()
_pg_initialized = False


def is_postgres() -> bool:
    return bool(os.getenv("DATABASE_URL") and HAS_PSYCOPG)


def _init_pg(conn: psycopg.Connection) -> None:
    global _pg_initialized
    if not _pg_initialized:
        with conn.cursor() as cur:
            cur.execute(PG_SCHEMA)
        conn.commit()
        _pg_initialized = True


def validate_procedure_and_step(procedure_id: str, step_number: int | None = None) -> None:
    """Validate that procedure_id is supported and step_number is within valid range."""
    if procedure_id not in SUPPORTED_PROCEDURES:
        raise ValueError(f"Unsupported procedure_id '{procedure_id}'.")
    if step_number is not None:
        max_steps = SUPPORTED_PROCEDURES[procedure_id]["max_steps"]
        if step_number < 1 or step_number > max_steps:
            raise ValueError(
                f"Invalid step_number {step_number} for procedure '{procedure_id}'. "
                f"Must be between 1 and {max_steps}."
            )


def _ensure_session_sqlite(session_id: str, language: str = "en") -> None:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute("PRAGMA foreign_keys = ON")
        conn.executescript(SQLITE_SCHEMA)
        conn.execute(
            "INSERT OR IGNORE INTO sessions (session_id, language) VALUES (?, ?)",
            (session_id, language),
        )


def ensure_session(session_id: str, language: str = "en") -> None:
    if is_postgres():
        try:
            db_url = os.environ["DATABASE_URL"].strip("'\"")
            with psycopg.connect(db_url) as conn:
                _init_pg(conn)
                with conn.cursor() as cur:
                    cur.execute(
                        """
                        INSERT INTO sessions (session_id, language) 
                        VALUES (%s, %s)
                        ON CONFLICT (session_id) DO NOTHING
                        """,
                        (session_id, language),
                    )
                conn.commit()
            return
        except Exception:
            pass
    _ensure_session_sqlite(session_id, language)


def _upsert_progress_sqlite(principal_id: str, procedure_id: str, step_number: int, completed: bool) -> None:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute("PRAGMA foreign_keys = ON")
        conn.executescript(SQLITE_SCHEMA)
        conn.execute(
            """
            INSERT INTO progress (session_id, procedure_id, step_number, completed, completed_at)
            VALUES (?, ?, ?, ?, CASE WHEN ? THEN CURRENT_TIMESTAMP ELSE NULL END)
            ON CONFLICT(session_id, procedure_id, step_number)
            DO UPDATE SET completed = excluded.completed,
                          completed_at = excluded.completed_at
            """,
            (principal_id, procedure_id, step_number, completed, completed),
        )


def upsert_progress(
    principal_id: str,
    procedure_id: str,
    step_number: int,
    completed: bool,
) -> None:
    validate_procedure_and_step(procedure_id, step_number)
    ensure_session(principal_id)

    if is_postgres():
        try:
            db_url = os.environ["DATABASE_URL"].strip("'\"")
            with psycopg.connect(db_url) as conn:
                _init_pg(conn)
                with conn.cursor() as cur:
                    cur.execute(
                        """
                        INSERT INTO progress (session_id, procedure_id, step_number, completed, completed_at)
                        VALUES (%s, %s, %s, %s, CASE WHEN %s THEN CURRENT_TIMESTAMP ELSE NULL END)
                        ON CONFLICT (session_id, procedure_id, step_number)
                        DO UPDATE SET completed = EXCLUDED.completed,
                                      completed_at = EXCLUDED.completed_at
                        """,
                        (principal_id, procedure_id, step_number, completed, completed),
                    )
                conn.commit()
            return
        except Exception:
            pass
    _upsert_progress_sqlite(principal_id, procedure_id, step_number, completed)


def get_progress(principal_id: str, procedure_id: str) -> tuple[list[int], int]:
    """Returns (completed_steps, total_steps) for the verified principal."""
    validate_procedure_and_step(procedure_id)

    if is_postgres():
        try:
            db_url = os.environ["DATABASE_URL"].strip("'\"")
            with psycopg.connect(db_url) as conn:
                _init_pg(conn)
                with conn.cursor() as cur:
                    cur.execute(
                        """
                        SELECT step_number, completed FROM progress 
                        WHERE session_id = %s AND procedure_id = %s ORDER BY step_number ASC
                        """,
                        (principal_id, procedure_id),
                    )
                    rows = cur.fetchall()
            completed = [r[0] for r in rows if r[1]]
            configured_total = SUPPORTED_PROCEDURES[procedure_id]["max_steps"]
            return completed, configured_total
        except Exception:
            pass

    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute("PRAGMA foreign_keys = ON")
        conn.executescript(SQLITE_SCHEMA)
        rows = conn.execute(
            "SELECT step_number, completed FROM progress "
            "WHERE session_id = ? AND procedure_id = ? ORDER BY step_number ASC",
            (principal_id, procedure_id),
        ).fetchall()

    completed = [r[0] for r in rows if r[1]]
    configured_total = SUPPORTED_PROCEDURES[procedure_id]["max_steps"]
    return completed, configured_total