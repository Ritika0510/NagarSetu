"""
NagarSetu — Index builder per AGENTS.md §8.3.

Reads /data/processed/chunks.jsonl, embeds with all-MiniLM-L6-v2,
writes the ChromaDB persistent collection and BM25 pickle.

Usage:
    python scripts/build_index.py
"""

import json
import logging
import pickle
import sys
from pathlib import Path

import chromadb
from rank_bm25 import BM25Okapi
from sentence_transformers import SentenceTransformer

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
log = logging.getLogger("build_index")

REPO_ROOT = Path(__file__).resolve().parent.parent
CHUNKS_PATH = Path(
    __import__("os").getenv("CHUNKS_PATH", REPO_ROOT / "data" / "processed" / "chunks.jsonl")
)
CHROMA_PATH = Path(
    __import__("os").getenv("CHROMA_PATH", REPO_ROOT / "data" / "index" / "chroma")
)
BM25_PATH = Path(
    __import__("os").getenv("BM25_PATH", REPO_ROOT / "data" / "index" / "bm25.pkl")
)


def load_jsonl(path: Path) -> list[dict]:
    chunks = []
    with open(path, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                chunks.append(json.loads(line))
    return chunks


def main() -> None:
    if not CHUNKS_PATH.exists():
        log.error("chunks.jsonl not found at %s — run fetch_docs.py first.", CHUNKS_PATH)
        sys.exit(1)

    chunks = load_jsonl(CHUNKS_PATH)
    log.info("Loaded %d chunks from %s", len(chunks), CHUNKS_PATH)

    # --- Embeddings (§8.3) ---
    log.info("Embedding with all-MiniLM-L6-v2 (first run downloads ~90MB)...")
    embedder = SentenceTransformer("all-MiniLM-L6-v2")
    embeddings = embedder.encode([c["text"] for c in chunks])

    # --- ChromaDB (§8.3) ---
    CHROMA_PATH.parent.mkdir(parents=True, exist_ok=True)
    chroma = chromadb.PersistentClient(path=str(CHROMA_PATH))
    # Recreate collection for idempotent rebuilds
    try:
        chroma.delete_collection("procedures")
    except Exception:  # collection may not exist yet
        pass
    collection = chroma.get_or_create_collection("procedures")
    def _meta(c: dict) -> dict:
        """ChromaDB metadata: no None values allowed — coerce to str."""
        m = {
            k: c.get(k)
            for k in ("procedure_id", "step_number", "source_url", "department")
        }
        return {k: (v if v is not None else "") for k, v in m.items()}

    collection.add(
        ids=[c["chunk_id"] for c in chunks],
        embeddings=embeddings.tolist(),
        documents=[c["text"] for c in chunks],
        metadatas=[_meta(c) for c in chunks],
    )
    log.info("ChromaDB: %d vectors → %s", len(chunks), CHROMA_PATH)

    # --- BM25 (§8.3) ---
    bm25 = BM25Okapi([c["text"].lower().split() for c in chunks])
    with open(BM25_PATH, "wb") as f:
        pickle.dump(bm25, f)
    log.info("BM25 index → %s", BM25_PATH)

    # Persist chunk_id → metadata lookup so retrieve.py can reconstruct chunks
    with open(CHROMA_PATH.parent / "chunks_meta.json", "w", encoding="utf-8") as f:
        json.dump({c["chunk_id"]: c for c in chunks}, f, ensure_ascii=False)

    log.info("Index build complete.")


if __name__ == "__main__":
    main()