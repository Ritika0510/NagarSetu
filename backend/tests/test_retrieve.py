"""
NagarSetu — Retrieval test (Phase 2 gate, §12 T2.6).

Asserts: query "trade license Chandigarh" returns >= 3 chunks with
procedure_id == "chandigarh_trade_license".

Run from repo root:
    pytest backend/tests/test_retrieve.py -v

Auto-builds the index from MOCK fixtures if it doesn't exist yet, so the
test is runnable end-to-end on a fresh clone.
"""

import json
import subprocess
import sys
from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(REPO_ROOT / "backend"))

CHUNKS_PATH = REPO_ROOT / "data" / "processed" / "chunks.jsonl"
CHROMA_DIR = REPO_ROOT / "data" / "index" / "chroma"
BM25_PATH = REPO_ROOT / "data" / "index" / "bm25.pkl"


@pytest.fixture(scope="session", autouse=True)
def ensure_index():
    """Build chunks + index once for the test session if missing."""
    if not (CHROMA_DIR.exists() and BM25_PATH.exists()):
        if not CHUNKS_PATH.exists():
            r = subprocess.run(
                [sys.executable, str(REPO_ROOT / "scripts" / "fetch_docs.py")],
                capture_output=True, text=True,
            )
            assert r.returncode == 0, f"fetch_docs.py failed:\n{r.stderr}"
        r = subprocess.run(
            [sys.executable, str(REPO_ROOT / "scripts" / "build_index.py")],
            capture_output=True, text=True,
        )
        assert r.returncode == 0, f"build_index.py failed:\n{r.stderr}"
    yield


def test_trade_license_query_returns_3_plus_chunks():
    from rag.retrieve import retrieve

    chunks = retrieve("trade license Chandigarh", procedure_id="chandigarh_trade_license")
    assert len(chunks) >= 3, f"expected >=3 chunks, got {len(chunks)}"


def test_trade_license_chunks_have_correct_procedure_id():
    from rag.retrieve import retrieve

    chunks = retrieve("trade license Chandigarh", procedure_id="chandigarh_trade_license")
    for c in chunks:
        assert c.procedure_id == "chandigarh_trade_license", (
            f"chunk {c.chunk_id} has procedure_id={c.procedure_id}"
        )


def test_unfiltered_query_returns_chunks():
    from rag.retrieve import retrieve

    chunks = retrieve("water connection application", k=5)
    assert len(chunks) >= 1
    assert any(c.procedure_id == "water_connection" for c in chunks)


def test_all_chunks_have_source_url():
    from rag.retrieve import retrieve

    chunks = retrieve("property tax payment", k=8)
    for c in chunks:
        assert c.source_url, f"chunk {c.chunk_id} missing source_url"
        assert c.source_url.startswith(("http", "MOCK")), (
            f"chunk {c.chunk_id} has unresolvable source_url: {c.source_url}"
        )