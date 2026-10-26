# NagarSetu — Hackathon Demonstration Script (Code Yudh)

**Event:** Code Yudh, Chandigarh University, 27–28 October 2026  
**Product:** NagarSetu — Civic Procedure Navigation (RAG-Grounded, Checklist-First)  
**Budget:** ₹0 (Zero paid infrastructure, zero paid inference)

---

## 1. Problem & Citizen Narrative (30 Seconds)
Citizens navigating municipal procedures (such as trade licenses, water connections, and property tax payments) face confusing official websites, ambiguous document requirements, and outdated instructions. Generic LLMs hallucinate rules, fabricate fees, and invent government deadlines. 

**NagarSetu** provides:
1. Grounded civic guidance bound strictly to official gazettes and municipal orders.
2. An actionable, verifiable step-by-step checklist.
3. Persistent progress tracking with strict authorization isolation.
4. Transparent fallback behavior in demo/offline modes with zero fabricated claims.

---

## 2. Step-by-Step Live Walkthrough (2 Minutes)

### Step 1: Starting the Local Application
Run the unified local stack:
```bash
# Terminal 1: Backend
uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload

# Terminal 2: Frontend
cd frontend && npm run dev
```
Open `http://localhost:3000` in the browser.

---

### Step 2: Citizen Query & Evidence Grounding
- **Query:** *"How do I apply for a new trade license for my shop in Chandigarh?"*
- **What happens behind the scenes:**
  1. The query hits `/api/chat`.
  2. The hybrid retrieval engine performs Reciprocal Rank Fusion (RRF) across semantic dense vector embeddings (ChromaDB) and exact keyword matching (BM25).
  3. Grounding verification (`backend/rag/verify.py`) scans retrieved municipal citations. Any uncited or hallucinatory step is eliminated before reaching the client.
  4. Response is rendered with verified official source URLs (Municipal Corporation Chandigarh).

---

### Step 3: Interactive Actionable Checklist
- The right panel dynamically populates the **Trade License Checklist (Steps 1–8)**.
- Each step displays:
  - Precise required documents (e.g., Ownership Proof / Rent Agreement, Fire NOC, Identity Proof).
  - Why each requirement matters.
  - Official source citation pill.
  - Interactive completion toggle.

---

### Step 4: Progress Persistence & Multi-Storage Support
- Check off Step 1 (*"Verify Shop Jurisdiction"*).
- The state is persisted via `/api/progress` into the database (PostgreSQL if `DATABASE_URL` is set, or local SQLite `progress.db`).
- Refresh the browser (`F5`):
  - Notice that Step 1 remains checked and the progress bar reflects `1/8 completed`.

---

### Step 5: Security & Cross-User Isolation
- **Demonstration of Authorization Defense:**
  - Authenticated sessions enforce ownership (`user:<user_id>`).
  - Isolated demo sessions are restricted to `demo-sess-*` identifiers.
  - Cross-user reads or attempts to mark steps on another user's session ID are rejected with `403 Forbidden`.
  - Procedures outside the catalog or step numbers exceeding bounds (e.g., Step 99) are rejected with `422 Unprocessable Entity`.

---

### Step 6: Out-of-Scope & Prompt Injection Defense
- **Query:** *"Who will win the next Chandigarh mayoral election?"*
- **Response:** NagarSetu transparently refuses political or non-civic queries: *"NagarSetu is a civic assistant for public service procedures. I can only answer questions related to civic services, applications, and public administrative processes."*
- **Retrieved Chunk Isolation:** Retrieved text is wrapped in defensive delimiters (`<document_content>`) preventing document-embedded adversarial instructions from hijacking the system prompt.

---

### Step 7: Offline & Zero-Network Demo Mode
- Disconnect the internet or trigger `?demo=true`.
- The interface displays the **DEMO MODE** badge.
- Pre-bundled verified JSON fixtures for all core procedures (Trade License, Water Connection, Property Tax) provide instant, realistic responses without making network calls.
