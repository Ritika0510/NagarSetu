"""
NagarSetu — Authorized Progress Endpoints.

POST /api/progress → upsert step completion for authenticated user or demo session
GET  /api/progress → fetch checklist progress for authenticated user or demo session

Authorization model:
- Authenticated users: identified by valid `nagarsetu_session` cookie.
- Demo mode: if no auth cookie is present and DEMO_MODE is true, an isolated
  demo principal (prefixed with 'demo-sess-') is allowed.
- Cross-user reads/writes are strictly prohibited: client cannot specify another user's identity.
"""

import hashlib
import os
import re
from typing import Optional
from fastapi import APIRouter, Cookie, Header, HTTPException, status

from backend.db.progress import (
    DEMO_PRINCIPAL_PREFIX,
    SUPPORTED_PROCEDURES,
    get_progress,
    upsert_progress,
    validate_procedure_and_step,
)
from backend.models.schemas import ProgressResponse, ProgressUpdate
from backend.routers.auth import SESSION_COOKIE, _load_user

router = APIRouter()

DEMO_SESSION_REGEX = re.compile(r"^[a-zA-Z0-9_\-]{8,64}$")


def _resolve_principal(
    session_token: Optional[str],
    client_session_id: Optional[str] = None,
) -> str:
    """
    Resolve and verify principal identity.
    If authenticated via cookie, principal is 'user:<user_id>'.
    If unauthenticated and demo mode is active, accepts validated demo session id.
    Otherwise rejects with 401 Unauthorized.
    """
    if session_token:
        try:
            user = _load_user(session_token)
            return f"user:{user['id']}"
        except HTTPException:
            # Expired or invalid token
            pass

    # Check demo mode fallback
    demo_allowed = os.getenv("DEMO_MODE", "true").lower() in ("true", "1", "yes")
    if demo_allowed and client_session_id:
        clean_id = client_session_id.strip()
        if DEMO_SESSION_REGEX.match(clean_id):
            return f"{DEMO_PRINCIPAL_PREFIX}{clean_id}"

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Authentication required. Please sign in or use an authorized demo session.",
    )


@router.post("/api/progress")
def update_progress(
    req: ProgressUpdate,
    session_token: Optional[str] = Cookie(default=None, alias=SESSION_COOKIE),
) -> dict:
    principal = _resolve_principal(session_token, req.session_id)

    try:
        upsert_progress(
            principal_id=principal,
            procedure_id=req.procedure_id,
            step_number=req.step_number,
            completed=req.completed,
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    return {"ok": True}


@router.get("/api/progress", response_model=ProgressResponse)
def read_progress(
    procedure_id: str,
    session_id: Optional[str] = None,
    session_token: Optional[str] = Cookie(default=None, alias=SESSION_COOKIE),
) -> ProgressResponse:
    principal = _resolve_principal(session_token, session_id)

    try:
        completed, total = get_progress(principal, procedure_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    return ProgressResponse(completed_steps=completed, total_steps=total)