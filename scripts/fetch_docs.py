"""
NagarSetu — Document fetcher per AGENTS.md §8.1.

Attempts to fetch official documents for the 3 MVP procedures from
priority sources. If fetching fails (network, 404, blocked), generates
MOCK_-prefixed fixtures and flags them — per §2.3: never block.

Usage:
    python scripts/fetch_docs.py

Outputs:
    /data/raw/{procedure_id}/...          — raw PDFs/HTML (or MOCK files)
    /data/processed/chunks.jsonl          — cleaned chunks per §6.1
"""

import json
import logging
import re
import sys
from pathlib import Path
from urllib.request import Request, urlopen

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
log = logging.getLogger("fetch_docs")

REPO_ROOT = Path(__file__).resolve().parent.parent
RAW_DIR = REPO_ROOT / "data" / "raw"
PROCESSED_DIR = REPO_ROOT / "data" / "processed"
CHUNKS_PATH = PROCESSED_DIR / "chunks.jsonl"

USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) NagarSetu/0.1 (civic demo)"

# Priority sources per §8.1, keyed by procedure.
PROCEDURES = [
    {
        "procedure_id": "chandigarh_trade_license",
        "procedure_name": "Trade License — Chandigarh Municipal Corporation",
        "department": "Municipal Corporation Chandigarh",
        "jurisdiction": "Chandigarh",
        "source_urls": [
            "https://mcc.chandigarh.gov.in/trade-license",
            "https://mcchandigarh.gov.in/trade-licence",
            "https://services.india.gov.in/service/detail/trade-licence-chandigarh",
        ],
    },
    {
        "procedure_id": "water_connection",
        "procedure_name": "New Water Connection — Punjab / Chandigarh",
        "department": "Municipal Corporation Chandigarh / Punjab Water Supply",
        "jurisdiction": "Chandigarh",
        "source_urls": [
            "https://mcc.chandigarh.gov.in/water-connection",
            "https://punjab.gov.in/water-supply",
            "https://services.india.gov.in/service/detail/new-water-connection",
        ],
    },
    {
        "procedure_id": "property_tax",
        "procedure_name": "Property Tax Payment — Chandigarh Municipal Corporation",
        "department": "Municipal Corporation Chandigarh",
        "jurisdiction": "Chandigarh",
        "source_urls": [
            "https://mcc.chandigarh.gov.in/property-tax",
            "https://mcchandigarh.gov.in/property-tax",
            "https://services.india.gov.in/service/detail/property-tax-chandigarh",
        ],
    },
]


def fetch_url(url: str, timeout: int = 15) -> bytes | None:
    """Fetch a URL, return bytes or None on any failure."""
    try:
        req = Request(url, headers={"User-Agent": USER_AGENT})
        with urlopen(req, timeout=timeout) as resp:
            content = resp.read()
            log.info("  fetched %s (%d bytes)", url, len(content))
            return content
    except Exception as e:  # noqa: BLE001 — any failure → mock, per §8.1
        log.warning("  FAILED %s: %s", url, e)
        return None


def fetch_procedure(proc: dict) -> list[dict]:
    """Try each source URL for a procedure. Return list of raw docs."""
    docs = []
    pid = proc["procedure_id"]
    raw_dir = RAW_DIR / pid
    raw_dir.mkdir(parents=True, exist_ok=True)

    for i, url in enumerate(proc["source_urls"]):
        content = fetch_url(url)
        if content and len(content) > 500:  # plausible document, not an error page
            ext = "html"
            fname = raw_dir / f"{pid}_src{i}.{ext}"
            fname.write_bytes(content)
            docs.append({"url": url, "path": str(fname), "mock": False})
        else:
            # Rule 4: never block — write a MOCK marker file
            mock_path = raw_dir / f"MOCK_{pid}_src{i}.txt"
            mock_path.write_text(
                f"MOCK PLACEHOLDER — fetch of {url} failed at ingest time.\n"
                f"Contents below are synthesized fixtures flagged with source_url=MOCK.\n",
                encoding="utf-8",
            )

    if not docs:
        log.warning("No live docs for %s — generating MOCK fixtures (§2.3, §0 rule 4).", pid)
    return docs


# ---------------------------------------------------------------------------
# MOCK chunk fixtures — used when live fetching fails.
# chunk_id / source_url conventions per §6.1.
# ---------------------------------------------------------------------------

def mock_chunks(proc: dict) -> list[dict]:
    pid = proc["procedure_id"]
    steps = [
        ("Register on the e-Sewa portal",
         f"Create an account on the {proc['department']} online services portal using a valid "
         f"mobile number and email address. Registration is free and immediate."),
        ("Prepare identity and ownership documents",
         "Collect proof of identity (Aadhaar/PAN), proof of address, and ownership or "
         "rent agreement documents for the premises."),
        ("Fill the online application form",
         "Log in to the portal, select the relevant service, and complete the application "
         "form with premises details, applicant details, and category of request."),
        ("Upload documents",
         "Upload scanned copies of all required documents in PDF or JPG format, each "
         "under 2 MB, as listed on the application form."),
        ("Pay the applicable fee online",
         "Pay the fee via net banking, UPI, debit or credit card. Fees vary by category "
         "of request; the portal shows the exact amount before payment."),
        ("Track application status",
         "Use the application reference number to track status on the portal. Status "
         "updates are also sent by SMS to the registered mobile number."),
        ("Receive approval certificate",
         "Once approved, the certificate is issued digitally and can be downloaded "
         "from the portal. Physical collection is available if preferred."),
        ("Renewal and follow-up",
         "Note the validity period of the certificate. Renewal applications should be "
         "filed before expiry to avoid late fees."),
    ]
    chunks = []
    for n, (title, text) in enumerate(steps, start=1):
        chunks.append({
            "chunk_id": f"{pid}__step_{n:02d}",
            "procedure_id": pid,
            "procedure_name": proc["procedure_name"],
            "department": proc["department"],
            "step_number": n,
            "section_title": title,
            "text": f"{title}. {text}",
            "source_url": "MOCK",  # flagged per §6.1 rule
            "source_page": None,
            "doc_type": "mock",
            "language": "en",
            "jurisdiction": proc["jurisdiction"],
            "last_verified": "2026-10-08",
        })
    # One overview chunk per §6.1 section-slug format
    chunks.append({
        "chunk_id": f"{pid}__overview",
        "procedure_id": pid,
        "procedure_name": proc["procedure_name"],
        "department": proc["department"],
        "step_number": None,
        "section_title": "Overview",
        "text": (
            f"{proc['procedure_name']}: the complete process involves registering on the "
            f"online portal, preparing documents, submitting the application, paying fees, "
            f"and receiving the certificate. Estimated 7–15 working days. MOCK fixture."
        ),
        "source_url": "MOCK",
        "source_page": None,
        "doc_type": "mock",
        "language": "en",
        "jurisdiction": proc["jurisdiction"],
        "last_verified": "2026-10-08",
    })
    return chunks


def extract_live_chunks(docs: list[dict], proc: dict) -> list[dict]:
    """
    Extract chunks from fetched HTML (BeautifulSoup per §4).
    PDF parsing (PyMuPDF) is attempted for .pdf files; the current
    fetcher targets HTML pages. Semantic chunking per §8.2 is simplified:
    split on <h2>/<h3> sections, cap at 800 tokens (~3200 chars).
    """
    from bs4 import BeautifulSoup  # imported here so mock path works without bs4

    chunks = []
    step_n = 0
    for doc in docs:
        if doc["path"].endswith(".html"):
            html = Path(doc["path"]).read_bytes().decode("utf-8", errors="ignore")
            soup = BeautifulSoup(html, "html.parser")
            for tag in soup.find_all(["h2", "h3"]):
                section_text = " ".join(
                    s.strip() for s in tag.find_next_siblings(string=False) if s.name in ("p", "li", "table")
                    for s2 in ([s] if s.name != "li" else [s])
                )[:3200]
                if len(section_text) < 100:
                    continue
                step_n += 1
                slug = re.sub(r"[^a-z0-9]+", "_", tag.get_text(strip=True).lower())[:40]
                chunks.append({
                    "chunk_id": f"{proc['procedure_id']}__{slug or f'step_{step_n:02d}'}",
                    "procedure_id": proc["procedure_id"],
                    "procedure_name": proc["procedure_name"],
                    "department": proc["department"],
                    "step_number": step_n,
                    "section_title": tag.get_text(strip=True),
                    "text": f"{tag.get_text(strip=True)}. {section_text}",
                    "source_url": doc["url"],
                    "source_page": None,
                    "doc_type": "html",
                    "language": "en",
                    "jurisdiction": proc["jurisdiction"],
                    "last_verified": "2026-10-08",
                })
    return chunks


def main() -> None:
    all_chunks: list[dict] = []
    for proc in PROCEDURES:
        log.info("Fetching %s ...", proc["procedure_id"])
        docs = fetch_procedure(proc)
        chunks = extract_live_chunks(docs, proc)
        if not chunks:
            chunks = mock_chunks(proc)
            log.warning("  %s: using %d MOCK chunks (source_url=MOCK, flagged).",
                        proc["procedure_id"], len(chunks))
        else:
            log.info("  %s: extracted %d live chunks.", proc["procedure_id"], len(chunks))
        all_chunks.extend(chunks)

    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
    with open(CHUNKS_PATH, "w", encoding="utf-8") as f:
        for c in all_chunks:
            f.write(json.dumps(c, ensure_ascii=False) + "\n")
    log.info("Wrote %d chunks → %s", len(all_chunks), CHUNKS_PATH)

    mock_count = sum(1 for c in all_chunks if c["source_url"] == "MOCK")
    if mock_count:
        log.warning("*** %d/%d chunks are MOCK fixtures (official fetch failed). ***",
                    mock_count, len(all_chunks))


if __name__ == "__main__":
    sys.exit(main())