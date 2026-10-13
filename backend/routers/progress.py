"""
NagarSetu — Progress endpoints per AGENTS.md §7.

POST /api/progress → upsert step completion
GET  /api/progress → fetch session checklist state
"""

from fastapi import APIRouter

from backend.db.progress import get_progress, upsert_progress
from backend.models.schemas import ProgressResponse, ProgressUpdate

router = APIRouter()


@router.post("/api/progress")
def update_progress(req: ProgressUpdate) -> dict:
    upsert_progress(req.session_id, req.procedure_id, req.step_number, req.completed)
    return {"ok": True}


@router.get("/api/progress", response_model=ProgressResponse)
def read_progress(session_id: str, procedure_id: str) -> ProgressResponse:
    completed, total = get_progress(session_id, procedure_id)
    return ProgressResponse(completed_steps=completed, total_steps=total)