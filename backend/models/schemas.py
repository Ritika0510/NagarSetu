"""
NagarSetu — Pydantic v2 schemas.

Enforces the STRICT LLM output contract from AGENTS.md §6.2.
Every checklist passing through the API MUST validate against
ChecklistStep / Checklist. Uncited steps are structurally invalid.

Validation rules implemented (§6.2):
  - confidence: float 0.0–1.0
  - steps: array, min 1, max 20
  - every step MUST have ≥1 source_chunk_id
  - steps with verified: false render in warning style (frontend concern)
  - if >30% of steps unverified → downstream logic in rag/verify.py
    forces confidence < 0.6 and prepends a warning (§6.2, §8.5)
"""

from typing import List

from pydantic import BaseModel, Field, field_validator


class ChecklistStep(BaseModel):
    """A single step in a procedure checklist. §6.2 'steps[]' item."""

    step_number: int = Field(..., ge=1, le=20, description="1-indexed step order")
    title: str = Field(..., min_length=1, description="Short step title")
    description: str = Field(..., min_length=1, description="What the citizen must do")
    documents_needed: List[str] = Field(default_factory=list)
    fee: str = Field(default="₹0", description="Fee as string, e.g. '₹500' or '₹0'")
    processing_time: str = Field(default="", description="e.g. 'Immediate', '7 working days'")
    official_link: str = Field(default="", description="Official portal URL; 'MOCK' for fixtures")
    source_chunk_ids: List[str] = Field(
        ...,
        min_length=1,
        description="≥1 chunk_id from retrieved sources. MANDATORY — uncited steps are dropped (§0 rule 6).",
    )
    verified: bool = Field(default=False, description="Set by rag/verify.py against retrieved chunks")

    @field_validator("source_chunk_ids")
    @classmethod
    def at_least_one_citation(cls, v: List[str]) -> List[str]:
        if not v or all(not cid.strip() for cid in v):
            raise ValueError("Every step MUST have at least one source_chunk_id (§6.2).")
        return [cid.strip() for cid in v if cid.strip()]


class WarningList(list):
    """Marker type — kept simple; warnings are plain strings."""


class Checklist(BaseModel):
    """The complete LLM output contract. §6.2 top-level object."""

    procedure_name: str = Field(..., min_length=1)
    procedure_id: str = Field(..., min_length=1)
    summary: str = Field(..., min_length=1)
    estimated_total_time: str = Field(default="", description="e.g. '7–15 working days'")
    estimated_total_cost: str = Field(default="", description="e.g. '₹500 – ₹5,000'")
    confidence: float = Field(..., ge=0.0, le=1.0)
    steps: List[ChecklistStep] = Field(..., min_length=1, max_length=20)
    warnings: List[str] = Field(default_factory=list)

    @field_validator("confidence")
    @classmethod
    def confidence_in_range(cls, v: float) -> float:
        if not 0.0 <= v <= 1.0:
            raise ValueError("confidence must be between 0.0 and 1.0 (§6.2).")
        return round(v, 2)


# ---------------------------------------------------------------------------
# API request/response models (§7) — placed here for a single schema module.
# ---------------------------------------------------------------------------

class ChatRequest(BaseModel):
    """POST /api/chat request body. §7."""

    session_id: str = Field(..., min_length=1, description="Anonymous UUID v4")
    message: str = Field(..., min_length=1)
    language: str = Field(default="en", pattern="^(en|hi)$")


class SourceRef(BaseModel):
    """An entry in the /api/chat 'sources' array. §7."""

    chunk_id: str
    source_url: str
    snippet: str


class ChatResponse(BaseModel):
    """POST /api/chat 200 response. §7."""

    assistant_message: str
    checklist: Checklist
    sources: List[SourceRef] = Field(default_factory=list)
    low_confidence: bool = False


class ProgressUpdate(BaseModel):
    """POST /api/progress request body. §7."""

    session_id: str
    procedure_id: str
    step_number: int = Field(..., ge=1)
    completed: bool


class ProgressResponse(BaseModel):
    """GET /api/progress response. §7."""

    completed_steps: List[int]
    total_steps: int


class ExportRequest(BaseModel):
    """POST /api/export request body. §7."""

    session_id: str
    procedure_id: str
    format: str = Field(default="pdf", pattern="^pdf$")