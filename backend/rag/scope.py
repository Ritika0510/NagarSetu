"""
NagarSetu — Scope evaluation layer (Task 2).

Determines whether a query is in-scope (about one of the indexed
procedures) BEFORE generation. Prevents the LLM from fabricating
checklists for out-of-scope requests — the failure mode documented
in the Task 1 baseline (Q14–Q18 all generated checklists).

Read-only consumer of retrieval results. Does NOT touch retrieval,
RRF, prompts, LLM client, or verify.
"""

from __future__ import annotations

# Case-insensitive substring patterns → hard refusal.
# Rationale per trap taxonomy:
#   - demographic/official-info asks (population, who is, commissioner)
#   - political opinion (vote, recommend, opinion)
#   - creative tasks (poem, write me a)
#   - action-on-behalf (approve my) — NagarSetu navigates, never acts
OUT_OF_SCOPE_PATTERNS = [
    "who is",
    "population",
    "vote for",
    "vote ",
    "write a poem",
    "write me a",
    "poem about",
    "can you approve",
    "approve my",
    "should i vote",
    "recommend",
    "your opinion",
]

REFUSAL_MESSAGE = (
    "I can only answer questions about the procedures I have "
    "official documents for. Try one of these:"
)

DEFAULT_SUGGESTIONS = [
    "How do I get a trade license in Chandigarh?",
    "How do I apply for a new water connection?",
    "How do I pay my property tax?",
]

# The 3 valid procedure_ids — used as the in-scope vocabulary.
KNOWN_PROCEDURES = {"chandigarh_trade_license", "water_connection", "property_tax"}


def evaluate_scope(query: str, procedure_id: str | None, chunks: list) -> dict | None:
    """
    Returns None if the query is in-scope (caller proceeds to generation).
    Returns a refusal dict if out-of-scope. Never raises.

    `chunks`: the retrieved Chunk objects (read-only; may be empty).
    `procedure_id`: router's keyword-detection result (may be None).
    """
    q = (query or "").lower()

    # (a) nothing routed, nothing retrieved → nothing to ground on
    if procedure_id is None and not chunks:
        return _refusal()

    # (b) explicit out-of-scope pattern → refuse regardless of retrieval,
    #     because BM25 matches on common tokens ("Chandigarh", "shop")
    #     produce false grounding for off-topic queries (baseline Q14/Q18)
    for pattern in OUT_OF_SCOPE_PATTERNS:
        if pattern in q:
            return _refusal()

    # In-scope: routed procedure is a known procedure AND we have chunks
    if procedure_id in KNOWN_PROCEDURES and chunks:
        return None

    # Routed to a known procedure but nothing retrieved → refuse rather
    # than 503 (the old behavior). Grounding is mandatory (§0 rule 6).
    if procedure_id in KNOWN_PROCEDURES and not chunks:
        return _refusal()

    # procedure_id is None but chunks exist (e.g. ambiguous query that
    # still retrieved something): allow generation ONLY if every retrieved
    # chunk belongs to a single known procedure. Mixed/no-procedure
    # retrieval is too weak to ground on.
    if chunks:
        pids = {getattr(c, "procedure_id", None) for c in chunks}
        if pids and pids <= KNOWN_PROCEDURES and len(pids) == 1:
            return None

    return _refusal()


def _refusal() -> dict:
    return {
        "refusal": True,
        "reason": "not_in_scope",
        "message": REFUSAL_MESSAGE,
        "suggestions": list(DEFAULT_SUGGESTIONS),
    }