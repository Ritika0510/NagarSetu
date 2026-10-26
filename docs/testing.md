# NagarSetu Testing & Verification Guide

This document outlines reproducible commands, test coverage, and verified execution results for NagarSetu.

---

## 1. Reproducible Test Commands

### Backend Test Suite
Ensure the Python virtual environment has required dependencies:
```bash
pip install fastapi uvicorn chromadb sentence-transformers rank-bm25 pydantic pytest httpx
```

Ensure the baseline index is built:
```bash
python scripts/build_index.py
```

Run all unit, integration, authorization, and resilience tests:
```bash
pytest -v
```

Run specific test modules:
```bash
# Authorization and ownership isolation
pytest backend/tests/test_progress_auth.py -v

# Rate limiting, input bounds, security headers, and BM25 path defense
pytest backend/tests/test_security_resilience.py -v

# Authentication and session management
pytest backend/tests/test_auth.py -v

# Chat output contract and grounding verification
pytest backend/tests/test_chat_contract.py -v

# Hybrid retrieval
pytest backend/tests/test_retrieve.py -v
```

### Frontend Production Build
```bash
cd frontend
npm install
npm run build
```

---

## 2. Test Suite Summary and Results

| Test Module | Coverage Description | Test Count | Result |
|---|---|---|---|
| `test_auth.py` | Registration, PBKDF2 hashing, cookie sessions, 2FA setup & validation | 7 | **PASSED** |
| `test_chat_contract.py` | Schema validation (§6.2), grounding verification, uncited step rejection | 4 | **PASSED** |
| `test_retrieve.py` | Hybrid RRF vector + BM25 retrieval, procedure filtering, source URLs | 4 | **PASSED** |
| `test_progress_auth.py` | Authorization enforcement, cross-user isolation, procedure & step bounds, demo isolation | 4 | **PASSED** |
| `test_security_resilience.py` | Sliding window rate limiting, oversized body rejection, out-of-scope refusals, security headers, BM25 path defense, prompt injection sanitization, insufficient evidence handling | 7 | **PASSED** |
| **Total Unit/Regression Tests** | Complete verified backend test coverage | **26** | **PASSED (100%)** |
| **Database Integration** | Live PostgreSQL integration test (`scripts/test_postgres.py`) on Antideploy database | 1 | **PASSED (VERIFIED)** |
| **Frontend Production Build** | Next.js 14.2 production compile across 15 static/app routes | 15 routes | **PASSED (100%)** |

---

## 3. Known Limitations & Non-Testable Live Services

- **Live Government Portals**: Source URLs with `MOCK` prefixes or demo fixtures represent mock datasets for hackathon evaluation and do not interact directly with live Chandigarh municipal databases.
- **Provider API Keys in Local Dev**: In local environments without live `GROQ_API_KEY` or `GEMINI_API_KEY`, the application safely operates in Demo Mode (`DEMO_MODE=true`).
