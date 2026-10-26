# NagarSetu Security Findings and Remediation Report

**Date:** 2026-10-25  
**Assessment Target:** NagarSetu Civic Assistant Repository  
**Classification:** Internal Security Review & Hardening Audit  

---

## 1. Summary of Identified Findings

| ID | Title | Component | Severity | Remediation Status |
|---|---|---|---|---|
| **SEC-01** | Exposed Groq API Key & Admin Credentials | `.env`, `.env.example.txt` | **CRITICAL** | Remediated in working tree; Provider rotation required |
| **SEC-02** | Committed Binary SQLite Database | `progress.db` | **MEDIUM** | Removed from git index; synthetic test fixture used |
| **SEC-03** | Broken Object-Level Authorization (BOLA) | `/api/progress` | **HIGH** | Resolved; bound to server session with ownership validation |
| **SEC-04** | Missing Input Bounds & Unbounded Step Numbers | `schemas.py`, `progress.py` | **MEDIUM** | Resolved; added Pydantic length bounds & step range checks |
| **SEC-05** | Unbounded Rate Limiting & Resource Exhaustion on LLM Gateway | `/api/chat`, `client.py` | **HIGH** | Resolved; sliding-window rate limiter & 15s timeout added |
| **SEC-06** | Insecure Deserialization (`pickle.load`) | `backend/rag/retrieve.py` | **HIGH** | Hardened; path-constrained to verified local directory |
| **SEC-07** | Prompt Injection via Retrieved Document Content | `backend/llm/prompts.py` | **MEDIUM** | Hardened; delimited boundaries & delimiter sanitization added |
| **SEC-08** | Permissive Wildcard CORS & Missing Security Headers | `backend/main.py` | **MEDIUM** | Hardened; restricted origins/methods & nosniff/DENY headers added |
| **SEC-09** | Transparent Fallback & Civic Guidance Grounding | `frontend/lib/api.ts` | **LOW** | Grounded; offline/demo metadata clearly demarcated |

---

## 2. Detailed Findings and Technical Remediation

### SEC-01: Exposed Groq API Key & Configuration Hygiene
- **Evidence:** Active Groq API key (`gsk_*`) was committed in root `.env` and `.env.example.txt`.
- **Impact:** Complete exposure of LLM account quota and potential unauthorized API calls.
- **Remediation Implemented:**
  1. Untracked and removed `.env` and duplicate text files from Git tracking.
  2. Created safe `.env.example` using `your_groq_api_key_here` placeholder.
  3. Extended `.gitignore` to prevent committing `.env`, credentials, and local database files.
- **Residual Risk & Manual Action:** The exposed Groq key was present in historical commits (`e793283`). **Manual action required:** Revoke the credential via the Groq developer console immediately. A history purge via `git filter-repo` should only be performed with team coordination.

---

### SEC-02 & SEC-03: Progress Authorization & Identity Boundary
- **Evidence:** `backend/routers/progress.py` accepted a client-provided `session_id` and performed writes and reads without validating identity or ownership.
- **Impact:** Any client could enumerate, read, or overwrite progress for any other citizen by guessing or supplying their session ID.
- **Remediation Implemented:**
  1. Updated `_resolve_principal` to authenticate requests against server-side session cookies (`nagarsetu_session`).
  2. Bound progress records strictly to the verified principal (`user:<id>`).
  3. Added demo mode isolation with regex validation (`demo-sess-*`), ensuring unauthenticated users cannot tamper with registered citizen records.
  4. Enforced supported procedure checks and step bounds (`1` to `max_steps`).

---

### SEC-04 & SEC-05: Rate Limiting and LLM Resource Exhaustion
- **Evidence:** `/api/chat` lacked rate limiting, payload length restrictions, and LLM timeouts.
- **Impact:** An attacker could send thousands of concurrent requests or gigabyte-sized payloads, triggering DoS or exhausting provider API credits.
- **Remediation Implemented:**
  1. Implemented `SlidingWindowRateLimiter` in `backend/routers/rate_limit.py` (30 requests/minute limit).
  2. Added Pydantic constraints: `message` is restricted to max 2000 characters; `session_id` to max 128 characters.
  3. Added an explicit 15.0s client timeout to Groq API client calls.

---

### SEC-06: BM25 Deserialization Hardening
- **Evidence:** `backend/rag/retrieve.py` called `pickle.load()` on `BM25_PATH`.
- **Impact:** If `BM25_PATH` could be redirected by an environment variable to an attacker-controlled file, arbitrary code execution could occur.
- **Remediation Implemented:**
  1. Added canonical path validation verifying `BM25_PATH` is strictly within `data/index/`.
  2. Raises `PermissionError` if an out-of-bounds artifact is loaded.
