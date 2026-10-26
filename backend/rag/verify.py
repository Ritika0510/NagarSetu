"""
NagarSetu — Groundedness verification per AGENTS.md §8.5.

Every step's source_chunk_ids are checked against the retrieved chunk set.
Unverifiable steps are marked; >30% unverified → confidence forced low
and a warning prepended.
"""

VALID_CHUNK_WARNING = (
    "Some steps could not be verified against official sources. "
    "Please confirm with the department."
)

import logging

log = logging.getLogger("nagarsetu.verify")


def _modal_procedure(retrieved_chunks) -> tuple[str, str] | None:
    """
    Task 1.5: modal (most frequent, retrieval-order-preferring)
    (procedure_id, procedure_name) across retrieved chunks.
    Returns None if no chunks.
    """
    counts: dict[str, int] = {}
    names: dict[str, str] = {}
    first_rank: dict[str, int] = {}
    for rank, c in enumerate(retrieved_chunks):
        pid = getattr(c, "procedure_id", None)
        if not pid:
            continue
        counts[pid] = counts.get(pid, 0) + 1
        names.setdefault(pid, getattr(c, "procedure_name", "") or "")
        first_rank.setdefault(pid, rank)
    if not counts:
        return None
    # max by (count, -first_rank): most chunks wins; ties broken by
    # retrieval position (earlier = more relevant).
    best = max(counts, key=lambda p: (counts[p], -first_rank[p]))
    return best, names[best]

# def verify(checklist: dict, retrieved_chunks) -> dict:
#     """
#     Mutates + returns the checklist dict per §8.5.
#     `retrieved_chunks`: iterable of Chunk objects (or objects with .chunk_id).

#     Task 1.5 addition: deterministic procedure_id guardrail — the LLM's
#     procedure_id/procedure_name are overridden with the modal retrieved
#     chunk's values. Every override is logged (fabrication metric).
#     """
#     retrieved_chunks = list(retrieved_chunks)  # allow generators / re-iteration

#     # --- §8.5 groundedness check (unchanged) ---
#     valid_ids = {c.chunk_id for c in retrieved_chunks}
#     for step in checklist.get("steps", []):
#         step["verified"] = any(
#             cid in valid_ids for cid in step.get("source_chunk_ids", [])
#         )
#     unverified = sum(1 for s in checklist["steps"] if not s["verified"])
#     ratio = unverified / max(len(checklist["steps"]), 1)
#     if ratio > 0.30:
#         checklist["confidence"] = min(checklist.get("confidence", 1.0), 0.5)
#         checklist.setdefault("warnings", []).insert(0, VALID_CHUNK_WARNING)

#     # --- Task 1.5: procedure_id guardrail (deterministic) ---
#     modal = _modal_procedure(retrieved_chunks)
#     if modal:
#         modal_pid, modal_name = modal
#         if checklist.get("procedure_id") != modal_pid:
#             log.warning(
#                 "PROCEDURE_ID_OVERRIDE: llm='%s' -> grounded='%s' (fabrication caught)",
#                 checklist.get("procedure_id"), modal_pid,
#             )
#         checklist["procedure_id"] = modal_pid
#         if modal_name:
#             checklist["procedure_name"] = modal_name

#     return checklist

def verify(checklist: dict, retrieved_chunks) -> dict:
    """
    Mutates + returns the checklist dict per §8.5.
    `retrieved_chunks`: iterable of Chunk objects (or objects with .chunk_id).
    """
    retrieved_chunks = list(retrieved_chunks)  # allow generators / re-iteration

    valid_ids = {c.chunk_id for c in retrieved_chunks}
    for step in checklist.get("steps", []):
        step["verified"] = any(
            cid in valid_ids for cid in step.get("source_chunk_ids", [])
        )
    unverified = sum(1 for s in checklist["steps"] if not s["verified"])
    ratio = unverified / max(len(checklist["steps"]), 1)
    if ratio > 0.30:
        checklist["confidence"] = min(checklist.get("confidence", 1.0), 0.5)
        checklist.setdefault("warnings", []).insert(0, VALID_CHUNK_WARNING)

    # --- Task 1.5: procedure_id guardrail (deterministic) ---
    modal = _modal_procedure(retrieved_chunks)
    if modal:
        modal_pid, modal_name = modal
        if checklist.get("procedure_id") != modal_pid:
            log.warning(
                "PROCEDURE_ID_OVERRIDE: llm='%s' -> grounded='%s' (fabrication caught)",
                checklist.get("procedure_id"), modal_pid,
            )
        checklist["procedure_id"] = modal_pid
        if modal_name:
            checklist["procedure_name"] = modal_name

    return checklist