"""
NagarSetu — FastAPI application entrypoint.
Routers: /api/health, /api/chat, /api/progress.
"""

import logging
import os
import sys
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Make `backend.*` imports resolvable regardless of launch directory.
# MUST run before any backend.* imports below.
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

load_dotenv(Path(__file__).resolve().parent.parent / ".env")

logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO"))
log = logging.getLogger("nagarsetu")

# §15: missing keys → warn + Demo Mode
if not os.getenv("GROQ_API_KEY") and not os.getenv("GEMINI_API_KEY"):
    log.warning("No LLM API keys found — setting DEMO_MODE=true (§15).")
    os.environ["DEMO_MODE"] = "true"

app = FastAPI(
    title="NagarSetu API",
    version="0.4.0",
    description="Civic procedure navigation — RAG-grounded, checklist-first.",
)

origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Demo-Mode"],
)


@app.get("/api/health")
def health() -> dict:
    """Liveness probe."""
    return {"ok": True}


# Routers — imported AFTER sys.path fix (§7: chat, progress)
from backend.routers.chat import router as chat_router  # noqa: E402
from backend.routers.progress import router as progress_router  # noqa: E402

app.include_router(chat_router)
app.include_router(progress_router)