"""
NagarSetu — Prompt templates per AGENTS.md §9.

Strict grounding rules; JSON-mode output contract per §6.2.
"""

from backend.models.schemas import Checklist

# §6.2 schema, serialized for the prompt
SCHEMA_JSON = Checklist.model_json_schema()


def format_chunks(chunks) -> str:
    """Format retrieved chunks for the SOURCE DOCUMENTS block (§9.2).

    Task 1.5: exposes the machine procedure_id per chunk so the LLM
    can copy it verbatim instead of fabricating a slug.
    """
    parts = []
    for c in chunks:
        parts.append(
            f"[chunk_id: {c.chunk_id}]\n"
            f"Procedure ID: {c.procedure_id}\n"
            f"Procedure: {c.procedure_name}\n"
            f"Section: {c.section_title}\n"
            f"Source: {c.source_url}\n"
            f"Content: {c.text}\n"
        )
    return "\n---\n".join(parts)


SYSTEM_PROMPT = """You are NagarSetu, a civic procedure navigation assistant for Indian citizens.

YOUR ONLY JOB: Convert the user's goal into a structured, step-by-step checklist grounded EXCLUSIVELY in the provided source documents.

ABSOLUTE RULES:
1. Use ONLY information from the SOURCE DOCUMENTS below. Never use outside knowledge.
2. Every step MUST cite at least one source_chunk_id from the provided documents.
3. If the documents do not contain enough information, say so and lower the confidence score.
4. Never invent fees, timelines, document names, or URLs.
5. If a fee or timeline varies, give the range from the documents.
6. Output MUST be valid JSON matching the schema exactly. No prose outside JSON.
7. The procedure_id and procedure_name fields MUST be copied VERBATIM from the "Procedure ID:" / "Procedure:" lines of the source documents. The ONLY valid procedure_id values are:
{valid_procedure_ids}
Never invent, rename, or reformat a procedure_id.

TONE: Clear, respectful, practical.

LANGUAGE: Respond in {language}. If language is "hi", use simple Hindi (Devanagari). Official terms may remain in English.

OUTPUT SCHEMA:
{schema_json}"""


USER_PROMPT_TEMPLATE = """USER GOAL: {user_message}

SOURCE DOCUMENTS:
{retrieved_chunks_formatted}

Return the checklist JSON now."""


FEW_SHOT_EXAMPLE = """Example of a correctly formed response:

{
  "procedure_name": "Trade License — Chandigarh Municipal Corporation",
  "procedure_id": "chandigarh_trade_license",
  "summary": "A trade license is required for any commercial establishment in Chandigarh. The process takes 7–15 working days.",
  "estimated_total_time": "7–15 working days",
  "estimated_total_cost": "₹500 – ₹5,000",
  "confidence": 0.92,
  "steps": [
    {
      "step_number": 1,
      "title": "Register on the MCC e-Sewa Portal",
      "description": "Create an account on the Chandigarh Municipal Corporation online services portal using a valid mobile number and email address.",
      "documents_needed": ["Mobile number", "Email address"],
      "fee": "₹0",
      "processing_time": "Immediate",
      "official_link": "https://mcc.chandigarh.gov.in/",
      "source_chunk_ids": ["chandigarh_trade_license__step_01"],
      "verified": true
    }
  ],
  "warnings": ["Fees are subject to revision. Verify current amounts on the official portal."]
}"""


def build_system_prompt(language: str = "en", valid_procedure_ids: list[str] | None = None) -> str:
    """
    System prompt per §9.1 with language + schema injected.

    Task 1.5: valid_procedure_ids (derived from the retrieved chunks,
    never hardcoded) is injected into rule 7 so the LLM copies the
    procedure_id verbatim instead of fabricating a slug.
    """
    ids = valid_procedure_ids or ["chandigarh_trade_license", "water_connection", "property_tax"]
    id_list = "\n".join(f'  - "{pid}"' for pid in ids)
    return (
        SYSTEM_PROMPT.format(
            language=language,
            schema_json=SCHEMA_JSON,
            valid_procedure_ids=id_list,
        )
        + "\n\n"
        + FEW_SHOT_EXAMPLE
    )


def build_user_prompt(user_message: str, chunks) -> str:
    """User prompt per §9.2 with goal + formatted source documents."""
    return USER_PROMPT_TEMPLATE.format(
        user_message=user_message,
        retrieved_chunks_formatted=format_chunks(chunks),
    )