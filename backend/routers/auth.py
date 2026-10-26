"""Account registration and cookie-based authentication."""

import hashlib
import hmac
import os
import base64
import secrets
import sqlite3
import struct
import time
import uuid
from contextlib import contextmanager
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Iterator, Literal
from urllib.parse import quote

from fastapi import APIRouter, Cookie, HTTPException, Request, Response, status
from pydantic import BaseModel, Field, field_validator

from backend.db.progress import DB_PATH

router = APIRouter(prefix="/api/auth", tags=["auth"])

SESSION_COOKIE = "nagarsetu_session"
SESSION_LIFETIME = timedelta(days=30)
PASSWORD_ITERATIONS = 600_000
PASSWORD_SALT_BYTES = 16

SCHEMA = """
CREATE TABLE IF NOT EXISTS auth_users (
  user_id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS auth_sessions (
  token_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES auth_users(user_id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  remote_address TEXT NOT NULL DEFAULT '',
  user_agent TEXT NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS auth_sessions_user_id_idx
  ON auth_sessions(user_id);

CREATE TABLE IF NOT EXISTS auth_login_history (
  event_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES auth_users(user_id) ON DELETE CASCADE,
  logged_in_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  remote_address TEXT NOT NULL DEFAULT '',
  user_agent TEXT NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS auth_login_history_user_id_idx
  ON auth_login_history(user_id, logged_in_at DESC);

  CREATE TABLE IF NOT EXISTS auth_2fa_challenges (
    challenge_hash TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES auth_users(user_id) ON DELETE CASCADE,
    expires_at TEXT NOT NULL,
    attempts INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS auth_preferences (
  user_id TEXT PRIMARY KEY REFERENCES auth_users(user_id) ON DELETE CASCADE,
  language TEXT NOT NULL DEFAULT 'en',
  email_alerts INTEGER NOT NULL DEFAULT 1,
  push_notifications INTEGER NOT NULL DEFAULT 0,
  digest_frequency TEXT NOT NULL DEFAULT 'daily',
  do_not_disturb INTEGER NOT NULL DEFAULT 0
);
"""


class RegistrationRequest(BaseModel):
    full_name: str = Field(min_length=1, max_length=120)
    email: str = Field(min_length=3, max_length=254)
    password: str = Field(min_length=8, max_length=128)
    address: str = Field(min_length=1, max_length=200)
    city: str = Field(min_length=1, max_length=100)
    state: str = Field(min_length=1, max_length=100)
    postal_code: str = Field(min_length=3, max_length=20)

    @field_validator("full_name", "address", "city", "state", "postal_code")
    @classmethod
    def strip_required_text(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("This field cannot be blank.")
        return value

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        value = value.strip().lower()
        local, separator, domain = value.partition("@")
        if not separator or not local or "." not in domain or any(c.isspace() for c in value):
            raise ValueError("Enter a valid email address.")
        return value


class LoginRequest(BaseModel):
    email: str = Field(min_length=3, max_length=254)
    password: str = Field(min_length=1, max_length=128)

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        value = value.strip().lower()
        local, separator, domain = value.partition("@")
        if not separator or not local or "." not in domain or any(c.isspace() for c in value):
            raise ValueError("Enter a valid email address.")
        return value


class TwoFactorCodeRequest(BaseModel):
    code: str = Field(pattern=r"^\d{6}$")


class TwoFactorDisableRequest(TwoFactorCodeRequest):
    password: str = Field(min_length=1, max_length=128)


class TwoFactorLoginRequest(TwoFactorCodeRequest):
    challenge_id: str = Field(min_length=20, max_length=128)


class ProfileUpdateRequest(BaseModel):
    full_name: str = Field(min_length=1, max_length=120)
    address: str = Field(min_length=1, max_length=200)
    city: str = Field(min_length=1, max_length=100)
    state: str = Field(min_length=1, max_length=100)
    postal_code: str = Field(min_length=3, max_length=20)

    @field_validator("full_name", "address", "city", "state", "postal_code")
    @classmethod
    def strip_required_text(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("This field cannot be blank.")
        return value


class PasswordChangeRequest(BaseModel):
    current_password: str = Field(min_length=1, max_length=128)
    new_password: str = Field(min_length=8, max_length=128)


class PreferencesRequest(BaseModel):
    language: Literal["en", "hi"] = "en"
    email_alerts: bool = True
    push_notifications: bool = False
    digest_frequency: Literal["immediate", "daily", "weekly", "never"] = "daily"
    do_not_disturb: bool = False


@contextmanager
def _connection() -> Iterator[sqlite3.Connection]:
    Path(DB_PATH).parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    try:
        connection.executescript(SCHEMA)
        existing_user_columns = {
            row["name"] for row in connection.execute("PRAGMA table_info(auth_users)")
        }
        for name, definition in (
            ("totp_secret", "TEXT"),
            ("totp_pending_secret", "TEXT"),
            ("totp_setup_attempts", "INTEGER NOT NULL DEFAULT 0"),
        ):
            if name not in existing_user_columns:
                connection.execute(
                    f"ALTER TABLE auth_users ADD COLUMN {name} {definition}"
                )
        existing_session_columns = {
            row["name"] for row in connection.execute("PRAGMA table_info(auth_sessions)")
        }
        for name, definition in (
            ("created_at", "TEXT NOT NULL DEFAULT ''"),
            ("remote_address", "TEXT NOT NULL DEFAULT ''"),
            ("user_agent", "TEXT NOT NULL DEFAULT ''"),
        ):
            if name not in existing_session_columns:
                connection.execute(
                    f"ALTER TABLE auth_sessions ADD COLUMN {name} {definition}"
                )
        connection.execute(
            "UPDATE auth_sessions SET created_at = CURRENT_TIMESTAMP WHERE created_at = ''"
        )
        with connection:
            yield connection
    finally:
        connection.close()


def _hash_password(password: str, salt: bytes | None = None) -> str:
    salt = salt or secrets.token_bytes(PASSWORD_SALT_BYTES)
    digest = hashlib.pbkdf2_hmac(
        "sha256", password.encode("utf-8"), salt, PASSWORD_ITERATIONS
    )
    return f"{PASSWORD_ITERATIONS}${salt.hex()}${digest.hex()}"


def _verify_password(password: str, encoded_hash: str) -> bool:
    iterations, salt_hex, digest_hex = encoded_hash.split("$", maxsplit=2)
    candidate = hashlib.pbkdf2_hmac(
        "sha256", password.encode("utf-8"), bytes.fromhex(salt_hex), int(iterations)
    )
    return hmac.compare_digest(candidate.hex(), digest_hex)


def _new_totp_secret() -> str:
    return base64.b32encode(secrets.token_bytes(20)).decode("ascii").rstrip("=")


def _totp_code(secret: str, timestamp: float | None = None) -> str:
    key = base64.b32decode(secret + "=" * (-len(secret) % 8))
    counter = int((timestamp if timestamp is not None else time.time()) // 30)
    digest = hmac.new(key, struct.pack(">Q", counter), hashlib.sha1).digest()
    offset = digest[-1] & 0x0F
    code = (struct.unpack(">I", digest[offset : offset + 4])[0] & 0x7FFFFFFF) % 1_000_000
    return f"{code:06d}"


def _verify_totp(secret: str, code: str) -> bool:
    now = time.time()
    return any(
        hmac.compare_digest(_totp_code(secret, now + offset * 30), code)
        for offset in (-1, 0, 1)
    )


def _totp_uri(secret: str, email: str) -> str:
    account = quote(email, safe="")
    issuer = quote("NagarSetu", safe="")
    return (
        f"otpauth://totp/{issuer}:{account}?secret={secret}"
        f"&issuer={issuer}&algorithm=SHA1&digits=6&period=30"
    )


_DUMMY_PASSWORD_HASH = _hash_password("not-a-real-account", b"\0" * PASSWORD_SALT_BYTES)


def _token_hash(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def _utc_timestamp(value: datetime) -> str:
    return value.astimezone(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")


def _secure_cookie() -> bool:
    configured = os.getenv("AUTH_COOKIE_SECURE")
    if configured is not None:
        return configured.strip().lower() in {"1", "true", "yes"}
    return os.getenv("ENVIRONMENT", "development").strip().lower() == "production"


def _cookie_samesite() -> Literal["lax", "none"]:
    configured = os.getenv("AUTH_COOKIE_SAMESITE")
    if configured:
        val = configured.strip().lower()
        if val in {"lax", "none"}:
            return val  # type: ignore[return-value]
    # In production with cross-origin frontend (pages.dev -> onrender.com),
    # SameSite=None; Secure is required for cookies to be sent across origins.
    if _secure_cookie():
        return "none"
    return "lax"


def _set_session_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key=SESSION_COOKIE,
        value=token,
        max_age=int(SESSION_LIFETIME.total_seconds()),
        httponly=True,
        secure=_secure_cookie(),
        samesite=_cookie_samesite(),
        path="/",
    )


def _request_details(request: Request) -> tuple[str, str]:
    remote_address = request.client.host if request.client else ""
    user_agent = request.headers.get("user-agent", "")[:500]
    return remote_address, user_agent


def _create_session(
    connection: sqlite3.Connection, user_id: str, request: Request
) -> str:
    token = secrets.token_urlsafe(32)
    now = datetime.now(timezone.utc)
    remote_address, user_agent = _request_details(request)
    connection.execute(
        """
        INSERT INTO auth_sessions
            (token_hash, user_id, expires_at, created_at, remote_address, user_agent)
        VALUES (?, ?, ?, ?, ?, ?)
        """,
        (
            _token_hash(token),
            user_id,
            _utc_timestamp(now + SESSION_LIFETIME),
            _utc_timestamp(now),
            remote_address,
            user_agent,
        ),
    )
    return token


def _record_login(connection: sqlite3.Connection, user_id: str, request: Request) -> None:
    remote_address, user_agent = _request_details(request)
    connection.execute(
        """
        INSERT INTO auth_login_history
            (event_id, user_id, logged_in_at, remote_address, user_agent)
        VALUES (?, ?, ?, ?, ?)
        """,
        (
            str(uuid.uuid4()),
            user_id,
            _utc_timestamp(datetime.now(timezone.utc)),
            remote_address,
            user_agent,
        ),
    )


def _user_response(user: sqlite3.Row) -> dict[str, str]:
    return {
        "id": user["user_id"],
        "full_name": user["full_name"],
        "email": user["email"],
        "address": user["address"],
        "city": user["city"],
        "state": user["state"],
        "postal_code": user["postal_code"],
        "created_at": user["created_at"],
    }


def _load_user(token: str | None) -> dict[str, str]:
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Please sign in to continue.",
        )

    with _connection() as connection:
        row = connection.execute(
            """
            SELECT u.*
            FROM auth_sessions AS s
            JOIN auth_users AS u ON u.user_id = s.user_id
            WHERE s.token_hash = ? AND s.expires_at > ?
            """,
            (_token_hash(token), _utc_timestamp(datetime.now(timezone.utc))),
        ).fetchone()
    if row is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Your session has expired. Please sign in again.",
        )
    return _user_response(row)


@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(
    request: RegistrationRequest, response: Response, http_request: Request
) -> dict[str, dict[str, str]]:
    user_id = str(uuid.uuid4())
    try:
        with _connection() as connection:
            connection.execute(
                """
                INSERT INTO auth_users
                    (user_id, full_name, email, password_hash, address, city, state, postal_code)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    user_id,
                    request.full_name,
                    request.email,
                    _hash_password(request.password),
                    request.address,
                    request.city,
                    request.state,
                    request.postal_code,
                ),
            )
            user = connection.execute(
                "SELECT * FROM auth_users WHERE user_id = ?", (user_id,)
            ).fetchone()
            token = _create_session(connection, user_id, http_request)
            _record_login(connection, user_id, http_request)
    except sqlite3.IntegrityError as error:
        if "auth_users.email" in str(error).lower() or "unique constraint" in str(error).lower():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="An account with this email address already exists.",
            ) from error
        raise

    _set_session_cookie(response, token)
    return {"user": _user_response(user)}


@router.post("/login")
def login(
    request: LoginRequest, response: Response, http_request: Request
) -> dict[str, object]:
    with _connection() as connection:
        user = connection.execute(
            "SELECT * FROM auth_users WHERE email = ? COLLATE NOCASE",
            (request.email,),
        ).fetchone()
        password_hash = user["password_hash"] if user is not None else _DUMMY_PASSWORD_HASH
        password_matches = _verify_password(request.password, password_hash)
        if user is None or not password_matches:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Email or password is incorrect.",
            )
        if user["totp_secret"]:
            challenge_id = secrets.token_urlsafe(32)
            connection.execute(
                """
                INSERT INTO auth_2fa_challenges (challenge_hash, user_id, expires_at)
                VALUES (?, ?, ?)
                """,
                (
                    _token_hash(challenge_id),
                    user["user_id"],
                    _utc_timestamp(datetime.now(timezone.utc) + timedelta(minutes=5)),
                ),
            )
            return {
                "requires_two_factor": True,
                "challenge_id": challenge_id,
            }
        connection.execute(
            "DELETE FROM auth_sessions WHERE expires_at <= ?",
            (_utc_timestamp(datetime.now(timezone.utc)),),
        )
        token = _create_session(connection, user["user_id"], http_request)
        _record_login(connection, user["user_id"], http_request)

    _set_session_cookie(response, token)
    return {"user": _user_response(user)}


@router.post("/login/two-factor")
def complete_two_factor_login(
    request: TwoFactorLoginRequest,
    response: Response,
    http_request: Request,
) -> dict[str, dict[str, str]]:
    challenge_hash = _token_hash(request.challenge_id)
    user_response: dict[str, str] | None = None
    token: str | None = None
    failure_status: int | None = None
    with _connection() as connection:
        challenge = connection.execute(
            """
            SELECT c.user_id AS challenge_user_id, c.expires_at, c.attempts, u.*
            FROM auth_2fa_challenges AS c
            JOIN auth_users AS u ON u.user_id = c.user_id
            WHERE c.challenge_hash = ?
            """,
            (challenge_hash,),
        ).fetchone()
        now = _utc_timestamp(datetime.now(timezone.utc))
        if challenge is None or challenge["expires_at"] <= now:
            connection.execute(
                "DELETE FROM auth_2fa_challenges WHERE challenge_hash = ?",
                (challenge_hash,),
            )
            failure_status = status.HTTP_401_UNAUTHORIZED
        elif challenge["attempts"] >= 5:
            connection.execute(
                "DELETE FROM auth_2fa_challenges WHERE challenge_hash = ?",
                (challenge_hash,),
            )
            failure_status = status.HTTP_429_TOO_MANY_REQUESTS
        elif not challenge["totp_secret"] or not _verify_totp(
            challenge["totp_secret"], request.code
        ):
            next_attempts = challenge["attempts"] + 1
            if next_attempts >= 5:
                connection.execute(
                    "DELETE FROM auth_2fa_challenges WHERE challenge_hash = ?",
                    (challenge_hash,),
                )
                failure_status = status.HTTP_429_TOO_MANY_REQUESTS
            else:
                connection.execute(
                    "UPDATE auth_2fa_challenges SET attempts = ? WHERE challenge_hash = ?",
                    (next_attempts, challenge_hash),
                )
                failure_status = status.HTTP_401_UNAUTHORIZED
        else:
            connection.execute(
                "DELETE FROM auth_2fa_challenges WHERE challenge_hash = ?",
                (challenge_hash,),
            )
            connection.execute("DELETE FROM auth_sessions WHERE expires_at <= ?", (now,))
            token = _create_session(
                connection, challenge["challenge_user_id"], http_request
            )
            _record_login(connection, challenge["challenge_user_id"], http_request)
            user_response = _user_response(challenge)

    if failure_status is not None:
        detail = (
            "Too many verification attempts. Please sign in again."
            if failure_status == status.HTTP_429_TOO_MANY_REQUESTS
            else "The verification code is invalid or has expired."
        )
        raise HTTPException(status_code=failure_status, detail=detail)
    if token is None or user_response is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Two-factor sign-in could not be completed.",
        )
    _set_session_cookie(response, token)
    return {"user": user_response}


@router.get("/two-factor")
def two_factor_status(
    session_token: str | None = Cookie(default=None, alias=SESSION_COOKIE),
) -> dict[str, bool]:
    user = _load_user(session_token)
    with _connection() as connection:
        row = connection.execute(
            "SELECT totp_secret FROM auth_users WHERE user_id = ?", (user["id"],)
        ).fetchone()
    return {"enabled": bool(row and row["totp_secret"])}


@router.post("/two-factor/setup")
def setup_two_factor(
    session_token: str | None = Cookie(default=None, alias=SESSION_COOKIE),
) -> dict[str, str]:
    user = _load_user(session_token)
    secret = _new_totp_secret()
    with _connection() as connection:
        row = connection.execute(
            "SELECT totp_secret FROM auth_users WHERE user_id = ?", (user["id"],)
        ).fetchone()
        if row is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Please sign in to continue.",
            )
        if row["totp_secret"]:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Two-factor authentication is already enabled.",
            )
        connection.execute(
            """
            UPDATE auth_users
            SET totp_pending_secret = ?, totp_setup_attempts = 0
            WHERE user_id = ?
            """,
            (secret, user["id"]),
        )
    return {
        "secret": secret,
        "otpauth_uri": _totp_uri(secret, user["email"]),
    }


@router.post("/two-factor/enable")
def enable_two_factor(
    request: TwoFactorCodeRequest,
    session_token: str | None = Cookie(default=None, alias=SESSION_COOKIE),
) -> dict[str, bool]:
    user = _load_user(session_token)
    failure_status: int | None = None
    with _connection() as connection:
        row = connection.execute(
            """
            SELECT totp_secret, totp_pending_secret, totp_setup_attempts
            FROM auth_users WHERE user_id = ?
            """,
            (user["id"],),
        ).fetchone()
        if row is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Please sign in to continue.",
            )
        if row["totp_secret"]:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Two-factor authentication is already enabled.",
            )
        if row["totp_setup_attempts"] >= 5:
            failure_status = status.HTTP_429_TOO_MANY_REQUESTS
        elif not row["totp_pending_secret"] or not _verify_totp(
            row["totp_pending_secret"], request.code
        ):
            next_attempts = row["totp_setup_attempts"] + 1
            failure_status = (
                status.HTTP_429_TOO_MANY_REQUESTS if next_attempts >= 5
                else status.HTTP_400_BAD_REQUEST
            )
            connection.execute(
                """
                UPDATE auth_users
                SET totp_setup_attempts = ?,
                    totp_pending_secret = CASE WHEN ? >= 5 THEN NULL ELSE totp_pending_secret END
                WHERE user_id = ?
                """,
                (next_attempts, next_attempts, user["id"]),
            )
        else:
            connection.execute(
                """
                UPDATE auth_users
                SET totp_secret = totp_pending_secret,
                    totp_pending_secret = NULL,
                    totp_setup_attempts = 0
                WHERE user_id = ?
                """,
                (user["id"],),
            )
            connection.execute(
                "DELETE FROM auth_sessions WHERE user_id = ? AND token_hash != ?",
                (user["id"], _token_hash(session_token or "")),
            )
    if failure_status is not None:
        raise HTTPException(
            status_code=failure_status,
            detail=(
                "Too many incorrect codes. Start authenticator setup again."
                if failure_status == status.HTTP_429_TOO_MANY_REQUESTS
                else "The code is invalid. Check your authenticator and try again."
            ),
        )
    return {"enabled": True}


@router.post("/two-factor/disable")
def disable_two_factor(
    request: TwoFactorDisableRequest,
    session_token: str | None = Cookie(default=None, alias=SESSION_COOKIE),
) -> dict[str, bool]:
    user = _load_user(session_token)
    failure = False
    with _connection() as connection:
        row = connection.execute(
            "SELECT password_hash, totp_secret FROM auth_users WHERE user_id = ?",
            (user["id"],),
        ).fetchone()
        if (
            row is None
            or not _verify_password(request.password, row["password_hash"])
            or not row["totp_secret"]
            or not _verify_totp(row["totp_secret"], request.code)
        ):
            failure = True
        else:
            connection.execute(
                """
                UPDATE auth_users
                SET totp_secret = NULL, totp_pending_secret = NULL
                WHERE user_id = ?
                """,
                (user["id"],),
            )
            connection.execute(
                "DELETE FROM auth_2fa_challenges WHERE user_id = ?", (user["id"],)
            )
            connection.execute(
                "DELETE FROM auth_sessions WHERE user_id = ? AND token_hash != ?",
                (user["id"], _token_hash(session_token or "")),
            )
    if failure:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Your password or authenticator code is incorrect.",
        )
    return {"enabled": False}


@router.get("/me")
def current_user(
    session_token: str | None = Cookie(default=None, alias=SESSION_COOKIE),
) -> dict[str, dict[str, str]]:
    return {"user": _load_user(session_token)}


@router.patch("/me")
def update_profile(
    request: ProfileUpdateRequest,
    session_token: str | None = Cookie(default=None, alias=SESSION_COOKIE),
) -> dict[str, dict[str, str]]:
    user = _load_user(session_token)
    with _connection() as connection:
        connection.execute(
            """
            UPDATE auth_users
            SET full_name = ?, address = ?, city = ?, state = ?, postal_code = ?
            WHERE user_id = ?
            """,
            (
                request.full_name,
                request.address,
                request.city,
                request.state,
                request.postal_code,
                user["id"],
            ),
        )
        updated = connection.execute(
            "SELECT * FROM auth_users WHERE user_id = ?", (user["id"],)
        ).fetchone()
    return {"user": _user_response(updated)}


@router.post("/password")
def change_password(
    request: PasswordChangeRequest,
    session_token: str | None = Cookie(default=None, alias=SESSION_COOKIE),
) -> dict[str, bool]:
    user = _load_user(session_token)
    with _connection() as connection:
        row = connection.execute(
            "SELECT password_hash FROM auth_users WHERE user_id = ?", (user["id"],)
        ).fetchone()
        if row is None or not _verify_password(request.current_password, row["password_hash"]):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Your current password is incorrect.",
            )
        connection.execute(
            "UPDATE auth_users SET password_hash = ? WHERE user_id = ?",
            (_hash_password(request.new_password), user["id"]),
        )
        connection.execute(
            """
            DELETE FROM auth_sessions
            WHERE user_id = ? AND token_hash != ?
            """,
            (user["id"], _token_hash(session_token or "")),
        )
    return {"ok": True}


@router.get("/sessions")
def list_sessions(
    session_token: str | None = Cookie(default=None, alias=SESSION_COOKIE),
) -> dict[str, list[dict[str, str | bool]]]:
    user = _load_user(session_token)
    now = _utc_timestamp(datetime.now(timezone.utc))
    with _connection() as connection:
        connection.execute("DELETE FROM auth_sessions WHERE expires_at <= ?", (now,))
        rows = connection.execute(
            """
            SELECT token_hash, created_at, expires_at, remote_address, user_agent
            FROM auth_sessions
            WHERE user_id = ?
            ORDER BY created_at DESC
            """,
            (user["id"],),
        ).fetchall()
    current_hash = _token_hash(session_token or "")
    return {
        "sessions": [
            {
                "id": row["token_hash"],
                "created_at": row["created_at"],
                "expires_at": row["expires_at"],
                "remote_address": row["remote_address"],
                "user_agent": row["user_agent"],
                "is_current": row["token_hash"] == current_hash,
            }
            for row in rows
        ]
    }


@router.delete("/sessions/{session_id}")
def revoke_session(
    session_id: str,
    session_token: str | None = Cookie(default=None, alias=SESSION_COOKIE),
) -> dict[str, bool]:
    user = _load_user(session_token)
    current_hash = _token_hash(session_token or "")
    if not hmac.compare_digest(session_id, current_hash):
        with _connection() as connection:
            result = connection.execute(
                "DELETE FROM auth_sessions WHERE token_hash = ? AND user_id = ?",
                (session_id, user["id"]),
            )
        if result.rowcount == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="That session could not be found.",
            )
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The current session cannot be revoked here. Use sign out instead.",
        )
    return {"ok": True}


@router.get("/login-history")
def login_history(
    session_token: str | None = Cookie(default=None, alias=SESSION_COOKIE),
) -> dict[str, list[dict[str, str]]]:
    user = _load_user(session_token)
    with _connection() as connection:
        rows = connection.execute(
            """
            SELECT logged_in_at, remote_address, user_agent
            FROM auth_login_history
            WHERE user_id = ?
            ORDER BY logged_in_at DESC
            LIMIT 50
            """,
            (user["id"],),
        ).fetchall()
    return {
        "history": [
            {
                "logged_in_at": row["logged_in_at"],
                "remote_address": row["remote_address"],
                "user_agent": row["user_agent"],
            }
            for row in rows
        ]
    }


@router.get("/preferences")
def get_preferences(
    session_token: str | None = Cookie(default=None, alias=SESSION_COOKIE),
) -> dict[str, str | bool]:
    user = _load_user(session_token)
    with _connection() as connection:
        row = connection.execute(
            "SELECT * FROM auth_preferences WHERE user_id = ?", (user["id"],)
        ).fetchone()
        if row is None:
            return PreferencesRequest().model_dump()
    return {
        "language": row["language"],
        "email_alerts": bool(row["email_alerts"]),
        "push_notifications": bool(row["push_notifications"]),
        "digest_frequency": row["digest_frequency"],
        "do_not_disturb": bool(row["do_not_disturb"]),
    }


@router.put("/preferences")
def update_preferences(
    request: PreferencesRequest,
    session_token: str | None = Cookie(default=None, alias=SESSION_COOKIE),
) -> dict[str, str | bool]:
    user = _load_user(session_token)
    preferences = request.model_dump()
    with _connection() as connection:
        connection.execute(
            """
            INSERT INTO auth_preferences
                (user_id, language, email_alerts, push_notifications,
                 digest_frequency, do_not_disturb)
            VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT(user_id) DO UPDATE SET
                language = excluded.language,
                email_alerts = excluded.email_alerts,
                push_notifications = excluded.push_notifications,
                digest_frequency = excluded.digest_frequency,
                do_not_disturb = excluded.do_not_disturb
            """,
            (
                user["id"],
                preferences["language"],
                preferences["email_alerts"],
                preferences["push_notifications"],
                preferences["digest_frequency"],
                preferences["do_not_disturb"],
            ),
        )
    return preferences


@router.post("/logout")
def logout(
    response: Response,
    session_token: str | None = Cookie(default=None, alias=SESSION_COOKIE),
) -> dict[str, bool]:
    if session_token:
        with _connection() as connection:
            connection.execute(
                "DELETE FROM auth_sessions WHERE token_hash = ?",
                (_token_hash(session_token),),
            )
    response.delete_cookie(
        key=SESSION_COOKIE,
        httponly=True,
        secure=_secure_cookie(),
        samesite=_cookie_samesite(),
        path="/",
    )
    return {"ok": True}
