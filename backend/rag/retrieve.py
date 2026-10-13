"""
NagarSetu — Hybrid retrieval per AGENTS.md §8.4.

Vector (ChromaDB) + BM25 keyword search, fused with Reciprocal Rank
Fusion (k=60), then filtered by procedure_id if provided.

Why hybrid: §8.4 — hybrid retrieval reduces hallucination by up to 63%
vs pure vector search.
"""

import json
import os
import pickle
from dataclasses import dataclass
from pathlib import Path

import chromadb
import numpy as np
from rank_bm25 import BM25Okapi
from sentence_transformers import SentenceTransformer

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
CHROMA_PATH = Path(os.getenv("CHROMA_PATH", REPO_ROOT / "data" / "index" / "chroma"))
BM25_PATH = Path(os.getenv("BM25_PATH", REPO_ROOT / "data" / "index" / "bm25.pkl"))
CHUNKS_META_PATH = CHROMA_PATH.parent / "chunks_meta.json"


@dataclass
class Chunk:
    """Retrieved chunk per §6.1 (internal)."""
    chunk_id: str
    procedure_id: str
    procedure_name: str
    department: str
    step_number: int | None
    section_title: str
    text: str
    source_url: str
    source_page: int | None
    doc_type: str
    language: str
    jurisdiction: str


# --- Lazy singletons: heavy models load once per process ---
_embedder: SentenceTransformer | None = None
_collection = None
_bm25: BM25Okapi | None = None
_chunk_meta: dict | None = None


def _get_embedder() -> SentenceTransformer:
    global _embedder
    if _embedder is None:
        _embedder = SentenceTransformer("all-MiniLM-L6-v2")
    return _embedder


def _get_collection():
    global _collection
    if _collection is None:
        client = chromadb.PersistentClient(path=str(CHROMA_PATH))
        _collection = client.get_collection("procedures")
    return _collection


def _get_bm25() -> BM25Okapi:
    global _bm25
    if _bm25 is None:
        with open(BM25_PATH, "rb") as f:
            _bm25 = pickle.load(f)
    return _bm25


def _get_chunk_meta() -> dict:
    global _chunk_meta
    if _chunk_meta is None:
        with open(CHUNKS_META_PATH, encoding="utf-8") as f:
            _chunk_meta = json.load(f)
    return _chunk_meta


def _to_chunk(chunk_id: str, text: str, metadata: dict) -> Chunk:
    full = _get_chunk_meta().get(chunk_id, {})
    return Chunk(
        chunk_id=chunk_id,
        procedure_id=metadata.get("procedure_id", full.get("procedure_id", "")),
        procedure_name=full.get("procedure_name", ""),
        department=metadata.get("department", full.get("department", "")),
        step_number=full.get("step_number"),
        section_title=full.get("section_title", ""),
        text=text,
        source_url=metadata.get("source_url", full.get("source_url", "MOCK")),
        source_page=full.get("source_page"),
        doc_type=full.get("doc_type", "unknown"),
        language=full.get("language", "en"),
        jurisdiction=full.get("jurisdiction", ""),
    )


def rrf_merge(vec_ids: list[list[str]], bm25_ids: list[str], k: int = 60) -> list[str]:
    """
    Reciprocal Rank Fusion (§8.4): score(d) = Σ 1/(k + rank_i(d)), k=60.
    """
    scores: dict[str, float] = {}
    for ids in vec_ids:  # typically one query → one ranked list
        for rank, cid in enumerate(ids, start=1):
            scores[cid] = scores.get(cid, 0.0) + 1.0 / (k + rank)
    for rank, cid in enumerate(bm25_ids, start=1):
        scores[cid] = scores.get(cid, 0.0) + 1.0 / (k + rank)
    return sorted(scores, key=scores.get, reverse=True)


def retrieve(query: str, procedure_id: str | None = None, k: int = 8) -> list[Chunk]:
    """
    Hybrid retrieval per §8.4.
    Raises FileNotFoundError if the index hasn't been built.
    """
    if not CHROMA_PATH.exists() or not BM25_PATH.exists():
        raise FileNotFoundError(
            "Index not found — run scripts/build_index.py first "
            f"(looked in {CHROMA_PATH.parent})."
        )

    k2 = k * 2

    # Vector side: embed query ourselves (consistent with index build),
    # query by embedding, take top k*2.
    query_emb = _get_embedder().encode(query).tolist()
    vec_results = _get_collection().query(query_embeddings=[query_emb], n_results=k2)
    vec_ids: list[list[str]] = vec_results["ids"]

    # BM25 side: score all docs, take top k*2 by score.
    bm25 = _get_bm25()
    bm25_scores = bm25.get_scores(query.lower().split())
    top_idx = np.argsort(bm25_scores)[-k2:][::-1]  # descending
    all_ids = list(_get_chunk_meta().keys())  # insertion order == BM25 corpus order
    bm25_top = [all_ids[i] for i in top_idx]

    # RRF fusion
    fused_ids = rrf_merge(vec_ids, bm25_top, k=60)

    # Reconstruct chunks; filter by procedure_id (§8.4)
    id_to_text = {cid: t for cid, t in zip(vec_results["ids"][0], vec_results["documents"][0])}
    meta = _get_chunk_meta()
    chunks = []
    for cid in fused_ids:
        if cid not in meta:
            continue
        c = _to_chunk(cid, meta[cid]["text"], {})
        if procedure_id and c.procedure_id != procedure_id:
            continue
        chunks.append(c)

    return chunks[:k]