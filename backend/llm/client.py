"""
NagarSetu — LLM client with fallback chain per AGENTS.md §9.4.

Providers in order: Groq (JSON mode) → Gemini (JSON mode) → demo cache.
All paths return a parsed dict matching §6.2; callers wrap in Pydantic.
Logs provider + latency per §14.2.
"""

import json
import logging
import os
import time

log = logging.getLogger("nagarsetu.llm")

#GROQ_MODEL = "llama-3.3-70b-versatile"
#GEMINI_MODEL = "gemini-1.5-flash"

GROQ_MODEL = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")

def call_groq(system: str, prompt: str) -> str:
    """Groq primary with JSON mode per §9.4."""
    from groq import Groq  # imported lazily so missing key doesn't break import

    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise RuntimeError("GROQ_API_KEY not set")

    client = Groq(api_key=api_key, timeout=15.0)
    resp = client.chat.completions.create(
        model=GROQ_MODEL,
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": prompt},
        ],
        response_format={"type": "json_object"},
        temperature=0.1,
    )
    return resp.choices[0].message.content


def call_gemini(system: str, prompt: str) -> str:
    """Gemini fallback with JSON mode per §9.4."""
    import google.generativeai as genai

    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY not set")

    genai.configure(api_key=api_key)
    model = genai.GenerativeModel(
        GEMINI_MODEL,
        system_instruction=system,
        generation_config={"response_mime_type": "application/json"},
    )
    resp = model.generate_content(
        prompt,
        request_options={"timeout": 15.0},
    )
    return resp.text


def call_demo_cache(system: str, prompt: str) -> str:
    """
    Demo cache — last resort before total failure (§11).
    The chat router handles demo mode itself before reaching here;
    this raises so the router can return a 503 with X-Demo-Mode header.
    """
    raise RuntimeError("Demo cache must be handled by the router (§7, §11)")


PROVIDERS = [
    ("groq", call_groq),
    ("gemini", call_gemini),
    ("demo", call_demo_cache),
]


def generate(prompt: str, system: str) -> dict:
    """
    Try providers in order per §9.4. Returns parsed JSON dict.
    Raises RuntimeError if ALL providers fail (router then serves demo/503).
    """
    for name, fn in PROVIDERS:
        start = time.perf_counter()
        try:
            raw = fn(system, prompt)
            latency_ms = (time.perf_counter() - start) * 1000
            log.info("LLM %s ok in %.0fms", name, latency_ms)  # §14.2 latency logging
            return json.loads(raw)
        except Exception as e:  # noqa: BLE001 — fall through per §9.4
            log.warning("LLM %s failed after %.0fms: %s", name,
                        (time.perf_counter() - start) * 1000, e)
            continue
    raise RuntimeError("All LLM providers failed")