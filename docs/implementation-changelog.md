# NagarSetu Implementation Changelog

All notable changes made to the NagarSetu codebase during the Security, Reliability, and Hackathon Readiness implementation.

---

## [Unreleased] - 2026-10-25

### Security & Secrets Remediation
- **Removed Exposed Credentials**: Untracked `.env`, `.env.example.txt`, and `backend/.env`.
- **Created `.env.example`**: Standardized environment template with `your_groq_api_key_here` placeholder and safe defaults.
- **Updated `.gitignore`**: Blocked `.env*`, `.db*`, `*.sqlite3`, `progress.db`, `node_modules/`, `.next/`, `*.log`, and cache files.
- **Untracked Binary Artifacts**: Removed `progress.db`, `uvicorn.log`, `frontend/.next/`, and `data/index/chroma/chroma.sqlite3` from Git tracking.

### Authorization & Progress Persistence
- **`backend/db/progress.py`**:
  - Bound all progress operations to validated principals (`user:<user_id>` or `demo-sess-<id>`).
  - Implemented `SUPPORTED_PROCEDURES` dictionary defining valid procedures and maximum step counts.
  - Implemented `validate_procedure_and_step()` to enforce strict boundaries.
  - Added index `idx_progress_lookup` on `(session_id, procedure_id)` for optimized query performance.
- **`backend/routers/progress.py`**:
  - Implemented server-side identity resolution via `nagarsetu_session` cookie.
  - Prevented arbitrary client-specified session manipulation.
  - Added isolated, regex-validated demo session mode (`demo-sess-*`) when unauthenticated and demo mode is active.

### API Hardening & Resilience
- **`backend/models/schemas.py`**:
  - Bounded `ChatRequest.message` to max 2000 characters.
  - Bounded `ChatRequest.session_id` to max 128 characters.
- **`backend/routers/rate_limit.py`**:
  - Created `SlidingWindowRateLimiter` class protecting `/api/chat` (30 requests / 60 seconds).
- **`backend/routers/chat.py`**:
  - Added rate limiter invocation before retrieval and LLM calls.
- **`backend/llm/client.py`**:
  - Added 15.0 second explicit timeout to `Groq` client initialization to prevent hanging workers.
- **`backend/llm/prompts.py`**:
  - Added `<document_content>` delimitation and sanitized triple-backticks in retrieved document text to mitigate prompt injection.
- **`backend/main.py`**:
  - Added HTTP middleware injecting security headers (`X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`).
  - Restricted CORS to explicit HTTP methods (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `OPTIONS`) and standard headers.

### RAG Integrity & Deserialization
- **`backend/rag/retrieve.py`**:
  - Added canonical path check verifying `BM25_PATH` is within `data/index/` and is a regular file before calling `pickle.load()`.
  - Normalized relative path resolution against `REPO_ROOT` across all execution contexts.

### Automated Test Suite
- **`backend/tests/test_progress_auth.py`**: Added tests for unauthenticated progress rejection, cross-user isolation, procedure validation, step bounds validation, and demo session isolation.
- **`backend/tests/test_security_resilience.py`**: Added automated tests for chat rate limiting, oversized message rejection, scope gating, security headers, and BM25 path boundary checks.
