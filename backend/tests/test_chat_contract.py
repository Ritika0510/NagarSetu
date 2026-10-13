"""
NagarSetu — Chat contract test (T3.6).

Validates /api/chat responses against the §6.2 Pydantic schema.
Uses FastAPI TestClient; if no LLM keys are present, a stub generator
is injected so the contract logic is testable offline.
"""

import sys
from pathlib import Path
from unittest.mock import patch

import pytest

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(REPO_ROOT))
sys.path.insert(0, str(REPO_ROOT / "backend"))

from fastapi.testclient import TestClient  # noqa: E402

from backend.main import app  # noqa: E402
from backend.rag import retrieve as retrieve_mod  # noqa: E402

client = TestClient(app)


def _stub_checklist() -> dict:
    """A minimal valid §6.2 checklist citing MOCK chunks."""
    return {
        "procedure_name": "Trade License — Chandigarh Municipal Corporation",
        "procedure_id": "chandigarh_trade_license",
        "summary": "A trade license is required for commercial establishments.",
        "estimated_total_time": "7–15 working days",
        "estimated_total_cost": "₹500 – ₹5,000",
        "confidence": 0.9,
        "steps": [
            {
                "step_number": 1,
                "title": "Register on the e-Sewa portal",
                "description": "Create an account with mobile and email.",
                "documents_needed": ["Mobile number", "Email address"],
                "fee": "₹0",
                "processing_time": "Immediate",
                "official_link": "https://mcchandigarh.gov.in/",
                "source_chunk_ids": ["chandigarh_trade_license__step_01"],
                "verified": True,
            }
        ],
        "warnings": [],
    }


def test_health():
    r = client.get("/api/health")
    assert r.status_code == 200 and r.json() == {"ok": True}


def test_chat_contract_with_stub_llm():
    """Full pipeline with stubbed LLM: response validates against §6.2."""
    with patch("backend.routers.chat.generate", return_value=_stub_checklist()):
        r = client.post(
            "/api/chat",
            json={
                "session_id": "test-session-1",
                "message": "I want to open a small shop in Chandigarh",
                "language": "en",
            },
        )
    assert r.status_code == 200, r.text
    body = r.json()

    # §7 response shape
    assert set(body) >= {"assistant_message", "checklist", "sources", "low_confidence"}
    cl = body["checklist"]
    # §6.2 fields
    for field in ("procedure_name", "procedure_id", "summary",
                  "estimated_total_time", "estimated_total_cost",
                  "confidence", "steps", "warnings"):
        assert field in cl, f"missing §6.2 field: {field}"
    assert 0.0 <= cl["confidence"] <= 1.0
    assert 1 <= len(cl["steps"]) <= 20
    # Every step: ≥1 source_chunk_id + verified flag present
    for step in cl["steps"]:
        assert step.get("source_chunk_ids"), "step missing source_chunk_ids (§6.2)"
        assert "verified" in step
    # Sources reference the retrieved chunks
    assert len(body["sources"]) >= 1
    assert any(s["chunk_id"].startswith("chandigarh_trade_license")
               for s in body["sources"])


def test_chat_validation_error():
    """Bad request bodies → 422 per §7."""
    r = client.post("/api/chat", json={"session_id": ""})
    assert r.status_code == 422


def test_verification_drops_uncited_steps():
    """Steps citing unknown chunk_ids must come back verified=false (§8.5)."""
    stub = _stub_checklist()
    stub["steps"][0]["source_chunk_ids"] = ["nonexistent_chunk_id"]
    with patch("backend.routers.chat.generate", return_value=stub):
        r = client.post(
            "/api/chat",
            json={
                "session_id": "test-session-2",
                "message": "I want to open a small shop in Chandigarh",
                "language": "en",
            },
        )
    assert r.status_code == 200
    cl = r.json()["checklist"]
    assert cl["steps"][0]["verified"] is False
    # 100% unverified > 30% → forced low confidence + warning (§8.5, §6.2)
    assert cl["confidence"] <= 0.5
    assert any("could not be verified" in w for w in cl["warnings"])