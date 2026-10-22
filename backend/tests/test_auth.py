"""Account registration and authentication endpoint tests."""

from pathlib import Path
import sqlite3
import sys

import pytest
from fastapi.testclient import TestClient

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(REPO_ROOT))

from backend.main import app  # noqa: E402
from backend.routers import auth  # noqa: E402


@pytest.fixture
def client(tmp_path: Path, monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setattr(auth, "DB_PATH", tmp_path / "accounts.sqlite3")
    with TestClient(app) as test_client:
        yield test_client


def _registration_data() -> dict[str, str]:
    return {
        "full_name": "Karan Kumar",
        "email": "karan@example.com",
        "password": "civic-guidance-123",
        "address": "1 Civic Way",
        "city": "New Delhi",
        "state": "Delhi",
        "postal_code": "110001",
    }


def test_register_sign_in_and_logout(client: TestClient) -> None:
    registration = client.post("/api/auth/register", json=_registration_data())

    assert registration.status_code == 201
    assert registration.json()["user"]["email"] == "karan@example.com"
    assert "password" not in registration.json()["user"]
    session_token = client.cookies.get(auth.SESSION_COOKIE)
    assert session_token
    with sqlite3.connect(auth.DB_PATH) as connection:
        password_hash = connection.execute(
            "SELECT password_hash FROM auth_users WHERE email = ?",
            ("karan@example.com",),
        ).fetchone()[0]
        stored_session = connection.execute(
            "SELECT token_hash FROM auth_sessions"
        ).fetchone()[0]
    assert password_hash != "civic-guidance-123"
    assert password_hash.startswith(f"{auth.PASSWORD_ITERATIONS}$")
    assert stored_session != session_token

    session = client.get("/api/auth/me")
    assert session.status_code == 200
    assert session.json()["user"]["full_name"] == "Karan Kumar"

    logout = client.post("/api/auth/logout")
    assert logout.status_code == 200
    assert client.get("/api/auth/me").status_code == 401

    login = client.post(
        "/api/auth/login",
        json={"email": "KARAN@example.com", "password": "civic-guidance-123"},
    )
    assert login.status_code == 200
    assert login.json()["user"]["id"] == registration.json()["user"]["id"]


def test_duplicate_account_and_invalid_password_are_rejected(
    client: TestClient,
) -> None:
    registration = client.post("/api/auth/register", json=_registration_data())
    assert registration.status_code == 201

    duplicate = client.post("/api/auth/register", json=_registration_data())
    assert duplicate.status_code == 409

    invalid_login = client.post(
        "/api/auth/login",
        json={"email": "karan@example.com", "password": "wrong-password"},
    )
    assert invalid_login.status_code == 401


def test_registration_validates_password_and_required_fields(
    client: TestClient,
) -> None:
    invalid = _registration_data()
    invalid["password"] = "short"
    invalid["city"] = " "

    response = client.post("/api/auth/register", json=invalid)

    assert response.status_code == 422


def test_account_settings_update_profile_password_preferences_and_sessions(
    client: TestClient,
) -> None:
    registered = client.post("/api/auth/register", json=_registration_data())
    assert registered.status_code == 201

    profile = client.patch(
        "/api/auth/me",
        json={
            "full_name": "Karan Singh",
            "address": "2 Civic Way",
            "city": "Chandigarh",
            "state": "Punjab",
            "postal_code": "160001",
        },
    )
    assert profile.status_code == 200
    assert profile.json()["user"]["full_name"] == "Karan Singh"
    assert profile.json()["user"]["email"] == "karan@example.com"

    preferences = client.put(
        "/api/auth/preferences",
        json={
            "language": "hi",
            "email_alerts": False,
            "push_notifications": True,
            "digest_frequency": "weekly",
            "do_not_disturb": True,
        },
    )
    assert preferences.status_code == 200
    assert client.get("/api/auth/preferences").json() == preferences.json()

    sessions = client.get("/api/auth/sessions")
    assert sessions.status_code == 200
    current_session = sessions.json()["sessions"][0]
    assert current_session["is_current"] is True
    assert current_session["created_at"]

    history = client.get("/api/auth/login-history")
    assert history.status_code == 200
    assert len(history.json()["history"]) == 1

    changed_password = client.post(
        "/api/auth/password",
        json={
            "current_password": "civic-guidance-123",
            "new_password": "new-civic-guidance-456",
        },
    )
    assert changed_password.status_code == 200
    assert (
        client.post(
            "/api/auth/login",
            json={
                "email": "karan@example.com",
                "password": "new-civic-guidance-456",
            },
        ).status_code
        == 200
    )


def test_account_settings_require_authentication_and_reject_bad_password(
    client: TestClient,
) -> None:
    assert (
        client.patch(
            "/api/auth/me",
            json={
                "full_name": "Karan Kumar",
                "address": "1 Civic Way",
                "city": "New Delhi",
                "state": "Delhi",
                "postal_code": "110001",
            },
        ).status_code
        == 401
    )
    registration = client.post("/api/auth/register", json=_registration_data())
    assert registration.status_code == 201

    bad_password = client.post(
        "/api/auth/password",
        json={"current_password": "wrong-password", "new_password": "new-password-123"},
    )
    assert bad_password.status_code == 400

    assert client.delete("/api/auth/sessions/not-a-session").status_code == 404


def test_other_sessions_can_be_revoked_but_current_session_cannot(
    client: TestClient,
) -> None:
    registration = client.post("/api/auth/register", json=_registration_data())
    assert registration.status_code == 201
    original_token_hash = auth._token_hash(client.cookies[auth.SESSION_COOKIE])

    login = client.post(
        "/api/auth/login",
        json={"email": "karan@example.com", "password": "civic-guidance-123"},
    )
    assert login.status_code == 200

    sessions = client.get("/api/auth/sessions").json()["sessions"]
    assert len(sessions) == 2
    assert client.delete(f"/api/auth/sessions/{original_token_hash}").status_code == 200
    assert len(client.get("/api/auth/sessions").json()["sessions"]) == 1

    current_token_hash = auth._token_hash(client.cookies[auth.SESSION_COOKIE])
    assert client.delete(f"/api/auth/sessions/{current_token_hash}").status_code == 400


def test_totp_setup_sign_in_and_disable_flow(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr(auth.time, "time", lambda: 1_700_000_000)
    registration = client.post("/api/auth/register", json=_registration_data())
    assert registration.status_code == 201
    assert client.get("/api/auth/two-factor").json() == {"enabled": False}

    setup = client.post("/api/auth/two-factor/setup")
    assert setup.status_code == 200
    secret = setup.json()["secret"]
    assert setup.json()["otpauth_uri"].startswith("otpauth://totp/")

    code = auth._totp_code(secret)
    wrong_code = "999999" if code != "999999" else "000000"
    assert client.post(
        "/api/auth/two-factor/enable", json={"code": wrong_code}
    ).status_code == 400
    enabled = client.post("/api/auth/two-factor/enable", json={"code": code})
    assert enabled.status_code == 200
    assert client.get("/api/auth/two-factor").json() == {"enabled": True}

    assert client.post("/api/auth/logout").status_code == 200
    login = client.post(
        "/api/auth/login",
        json={"email": "karan@example.com", "password": "civic-guidance-123"},
    )
    assert login.status_code == 200
    challenge_id = login.json()["challenge_id"]
    assert login.json()["requires_two_factor"] is True
    assert client.get("/api/auth/me").status_code == 401

    bad_code = client.post(
        "/api/auth/login/two-factor",
        json={"challenge_id": challenge_id, "code": wrong_code},
    )
    assert bad_code.status_code == 401
    completed = client.post(
        "/api/auth/login/two-factor",
        json={"challenge_id": challenge_id, "code": code},
    )
    assert completed.status_code == 200
    assert client.get("/api/auth/me").status_code == 200

    disabled = client.post(
        "/api/auth/two-factor/disable",
        json={"password": "civic-guidance-123", "code": code},
    )
    assert disabled.status_code == 200
    assert client.get("/api/auth/two-factor").json() == {"enabled": False}
    assert client.post("/api/auth/logout").status_code == 200

    password_login = client.post(
        "/api/auth/login",
        json={"email": "karan@example.com", "password": "civic-guidance-123"},
    )
    assert password_login.status_code == 200
    assert "challenge_id" not in password_login.json()
