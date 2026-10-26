"""
NagarSetu — Eval harness (Task 1 + Task 1.5 corrections).

Sends 18 queries to POST /api/chat, scores strictly per the agreed rules:
  - Standard query passes iff:
      * expected_procedure_id == response.checklist.procedure_id
      * every expected_fact is a substring of summary, estimates,
        any step title/description, or any step documents_needed entry
        (typography-normalized on both sides)
      * every expected_chunk_id appears in response.sources
  - Trap query passes IFF response.refusal === true (strict; no 503
    hacks — HTTP failure on a trap is a FAIL, by design).

Diagnostics (not scoring): for trap queries, the top-8 retrieved chunk
IDs are logged via a read-only import of backend.rag.retrieve, exposing
why the router did or didn't refuse.

Usage (repo root, backend running on :8000):
    python backend/evals/run_eval.py
"""

import json
import sys
import time
from pathlib import Path
from urllib.error import HTTPError as urllib_error, URLError
from urllib.request import Request, urlopen

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(REPO_ROOT))  # for backend.* imports (read-only)

EVAL_SET = Path(__file__).resolve().parent / "eval_set.jsonl"
RESULTS_MD = Path(__file__).resolve().parent / "results.md"
API = "http://localhost:8000/api/chat"

SUGGESTIONS_NOTE = (
    "Q12 annotation: 'I want to open a small shop in Chandigarh' passes via "
    "keyword routing in backend/routers/chat.py::_detect_procedure, not via "
    "retrieval ranking. Honest-baseline documentation, per review decision."
)


# ---------------------------------------------------------------------------
# HTTP (stdlib only — no extra deps)
# ---------------------------------------------------------------------------

def post_chat(query: str, eval_id: str) -> tuple[int, dict | None]:
    """POST /api/chat. Returns (status_code, parsed_body_or_None)."""
    body = json.dumps({
        "session_id": f"eval-{eval_id}",
        "message": query,
        "language": "en",
    }).encode("utf-8")
    req = Request(
        API,
        data=body,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urlopen(req, timeout=90) as resp:
            return resp.status, json.loads(resp.read().decode("utf-8"))
    except urllib_error as e:
        # 4xx/5xx — read body if JSON, else None
        try:
            return e.code, json.loads(e.read().decode("utf-8"))
        except Exception:
            return e.code, None
    except Exception:
        return 0, None  # network / timeout — total failure


def check_api() -> None:
    """Fail fast with startup instructions when the backend is unavailable."""
    health_url = API.removesuffix("/api/chat") + "/api/health"
    try:
        with urlopen(health_url, timeout=3) as resp:
            health = json.loads(resp.read().decode("utf-8"))
    except (URLError, TimeoutError, ValueError) as e:
        raise SystemExit(
            "Backend API is not responding at "
            f"{health_url}. Start it in another terminal with:\n"
            "  Set-Location "
            '"C:\\Users\\lalit\\OneDrive\\Desktop\\nagarsetu\\backend"\n'
            "  & .\\.venv\\Scripts\\python.exe -m uvicorn main:app --reload"
        ) from e
    if not isinstance(health, dict) or health.get("ok") is not True:
        raise SystemExit(
            f"Backend health check failed at {health_url}: {health!r}"
        )


# ---------------------------------------------------------------------------
# Read-only retrieval diagnostics (traps only)
# ---------------------------------------------------------------------------

def trap_retrieval_diagnostic(query: str) -> list[str]:
    """Top-8 chunk IDs for a trap query, via read-only retrieve() import.
    Any failure → empty list (diagnostics must never crash the eval)."""
    try:
        from backend.rag.retrieve import retrieve  # read-only, no modification
        chunks = retrieve(query, procedure_id=None, k=8)
        return [c.chunk_id for c in chunks]
    except Exception as e:
        return [f"<diagnostic failed: {type(e).__name__}: {e}>"]


# ---------------------------------------------------------------------------
# Scoring
# ---------------------------------------------------------------------------

def _normalize(s: str) -> str:
    """Task 1.5: typography normalization for fact matching —
    en-dash/em-dash → hyphen, non-breaking space → space,
    whitespace collapsed, lowercased. Currency/₹ formatting is NOT
    touched (facts are matched verbatim after typography only)."""
    s = s.lower()
    s = s.replace("\u2013", "-").replace("\u2014", "-")  # – — → -
    s = s.replace("\u00a0", " ")  # non-breaking space → space
    return " ".join(s.split())


def score_standard(entry: dict, body: dict | None) -> tuple[bool, str]:
    """Strict scoring for factual/conditional queries."""
    if body is None:
        return False, "no response body"
    checklist = body.get("checklist")
    if not isinstance(checklist, dict):
        return False, "no checklist in response"

    # 1. procedure_id
    got_pid = checklist.get("procedure_id", "")
    if got_pid != entry["expected_procedure_id"]:
        return False, f"procedure_id mismatch: got '{got_pid}'"

    # 2. facts — substring of summary, estimates, or any step
    #    title/description/docs (Task 1.5: haystack extended to
    #    estimated_total_time/cost and documents_needed; both sides
    #    normalized so en-dash/hyphen variance can't cause false misses)
    haystack = _normalize(
        (checklist.get("summary", "") or "")
        + " " + (checklist.get("estimated_total_time", "") or "")
        + " " + (checklist.get("estimated_total_cost", "") or "")
    )
    for step in checklist.get("steps", []):
        haystack += " " + _normalize(
            (step.get("title", "") or "")
            + " " + (step.get("description", "") or "")
            + " " + " ".join(step.get("documents_needed", []) or [])
        )
    for fact in entry["expected_facts"]:
        if _normalize(fact) not in haystack:
            return False, f"missing fact: '{fact}'"

    # 3. chunk citations — every expected id in response.sources
    source_ids = {s.get("chunk_id") for s in body.get("sources", [])}
    for cid in entry["expected_chunk_ids"]:
        if cid not in source_ids:
            return False, f"expected chunk not in sources: {cid}"

    return True, "ok"


def score_trap(body: dict | None) -> tuple[bool, str]:
    """STRICT: trap passes iff refusal === true. Nothing else counts."""
    if body is None:
        return False, "no response body"
    if body.get("refusal") is True:
        return True, "refused (refusal: true)"
    # Explain what happened instead — diagnostics only
    pid = (body.get("checklist") or {}).get("procedure_id")
    if pid:
        return False, f"generated a checklist for '{pid}' instead of refusing"
    return False, f"no refusal flag (keys: {sorted(body.keys())})"


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> None:
    check_api()

    entries = [
        json.loads(l)
        for l in EVAL_SET.read_text(encoding="utf-8").splitlines()
        if l.strip()
    ]
    assert len(entries) == 18, f"expected 18 eval entries, found {len(entries)}"

    rows = []
    passed = 0
    traps_passed = 0
    grounded_citations = 0
    citation_opportunities = 0  # expected_chunk_id checks across non-trap queries

    for entry in entries:
        eid = entry["id"]
        is_trap = entry["type"] == "trap"

        status, body = post_chat(entry["query"], eid)

        if is_trap:
            ok, reason = score_trap(body)
            retrieved = trap_retrieval_diagnostic(entry["query"])
            if ok:
                traps_passed += 1
        else:
            ok, reason = score_standard(entry, body)
            retrieved = []
            citation_opportunities += len(entry["expected_chunk_ids"])
            if ok:
                grounded_citations += len(entry["expected_chunk_ids"])
            elif body and isinstance(body.get("checklist"), dict):
                source_ids = {s.get("chunk_id") for s in body.get("sources", [])}
                grounded_citations += sum(
                    1 for cid in entry["expected_chunk_ids"] if cid in source_ids
                )

        if ok:
            passed += 1
        rows.append({
            "id": eid,
            "query": entry["query"],
            "type": entry["type"],
            "pass": ok,
            "reason": reason,
            "trap_retrieved": retrieved,
            "http_status": status,
        })
        print(f"  {eid} {'PASS' if ok else 'FAIL'} — {reason}")
        time.sleep(0.5)  # be polite to the LLM provider

    # Rates
    n_traps = sum(1 for e in entries if e["type"] == "trap")
    citation_rate = (
        round(100 * grounded_citations / citation_opportunities, 1)
        if citation_opportunities else 0.0
    )
    trap_rate = f"{traps_passed}/{n_traps}"
    summary = (
        f"{passed}/18 passed | grounded_citation_rate: {citation_rate}% "
        f"| trap_refusal_rate: {trap_rate}"
    )

    print("\n" + "=" * 60)
    print(summary)
    print("=" * 60)

    # results.md
    lines = [
        "# NagarSetu Eval Results",
        "",
        f"**Summary:** `{summary}`",
        "",
        f"Generated: {time.strftime('%Y-%m-%d %H:%M:%S')}",
        "",
        "## Annotations",
        "",
        f"- {SUGGESTIONS_NOTE}",
        "- Trap queries Q14–Q18 require `refusal: true` (strict). Refusal UX",
        "  lands in Task 2; baseline traps failing is expected and documented.",
        "- `trap_retrieved` is a read-only diagnostic (top-8 chunks via",
        "  backend.rag.retrieve) showing WHY the router did not refuse.",
        "",
        "## Results",
        "",
        "| id | query | type | result | reason | trap_retrieved (top-8) | http |",
        "|---|---|---|---|---|---|---|",
    ]
    for r in rows:
        retrieved = ", ".join(r["trap_retrieved"]) if r["trap_retrieved"] else "—"
        q = r["query"].replace("|", "\\|")
        reason = r["reason"].replace("|", "\\|")
        lines.append(
            f"| {r['id']} | {q} | {r['type']} | "
            f"{'✅ PASS' if r['pass'] else '❌ FAIL'} | {reason} | {retrieved} | {r['http_status']} |"
        )
    lines += [
        "",
        "## Metrics definition",
        "",
        "- **grounded_citation_rate**: of all expected_chunk_ids across the 13",
        "  non-trap queries, the % that appeared in `response.sources`.",
        "- **trap_refusal_rate**: traps where `response.refusal === true`,",
        "  strictly. HTTP 503 is a failure mode, not a refusal.",
        "",
    ]
    RESULTS_MD.write_text("\n".join(lines), encoding="utf-8")
    print(f"Results written → {RESULTS_MD}")


if __name__ == "__main__":
    main()