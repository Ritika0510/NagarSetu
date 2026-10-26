NagarSetu — Judge Q&A Preparation
Q1. Did you fine-tune a model?No. NagarSetu is a retrieval-grounded system: prompt-constrainedgeneration over retrieved official documents, with deterministicpost-processing. The only models involved are an embedding model(all-MiniLM-L6-v2) and an off-the-shelf LLM accessed via API.Reference: backend/llm/prompts.py (constraint-based prompting),backend/rag/retrieve.py (embeddings).

Q2. How do you prevent hallucination?Three enforcement layers. The prompt forbids uncited claims(backend/llm/prompts.py, SYSTEM_PROMPT rules 1-7). Aftergeneration, verify() checks every step's source_chunk_ids againstthe actually-retrieved chunks and marks unverifiable steps(backend/rag/verify.py). A deterministic guardrail overrides anyfabricated procedure_id with the grounded value and logs it(backend/rag/verify.py, _modal_procedure). Uncited or unverifiedcontent is flagged in the UI, never silently presented as fact.

Q3. What is your eval accuracy?18/18 on our 18-query eval set — 13 factual/conditional queriesplus 5 adversarial trap queries — up from 4/18 at baseline.Grounded citation rate 100%. The harness is re-runnable:python backend/evals/run_eval.py. Source: backend/evals/results.md.

Q4. What happens if the LLM is down?Layered fallback. Groq fails over to Gemini (backend/llm/client.py,generate). If both fail, the frontend serves a bundled, schema-validated demo cache with zero network dependency(frontend/lib/demo/*.json, Task 4). If the query is not cached andthe network is down, the user gets a structured offline card withworking suggestions — never a raw error. The live demo can survivea dead venue network by design.

Q5. How would you add a new city?Add the city's official documents to data/raw/, runscripts/fetch_docs.py and scripts/build_index.py (ChromaDB plusBM25 rebuild), and add the procedure_id to the routing vocabularyin backend/routers/chat.py (_detect_procedure) andbackend/rag/scope.py (KNOWN_PROCEDURES). No architecture changes.

Q6. What are the known limitations?The current source documents are flagged MOCK fixtures — theretrieval, citation, and verification pipeline is real, but thegrounding data is representative, not official (source_url: "MOCK"is shown as a badge in the UI, ChecklistCard). Progress is storedper-device in SQLite. The eval set is 18 queries — honest butsmall. Reference: frontend/components/ChecklistCard.tsx (mockbadge), backend/db/progress.py.

Q7. How does hybrid retrieval work?Each query runs two retrievers over the same chunks: vectorsearch (ChromaDB, all-MiniLM-L6-v2 embeddings) and BM25 keywordsearch. Their ranked lists are merged with Reciprocal Rank Fusion(score = sum of 1/(60 + rank)), which balances semantic matchingagainst exact term matching. Reference: backend/rag/retrieve.py,functions retrieve and rrf_merge.

Q8. What would you build with 3 more months?Replace the MOCK fixtures with ingested official documents and adocument-freshness pipeline (last_verified fields already exist inthe chunk schema). Expand to more cities using the existingingestion path. Harden the eval set from 18 to 200+ queries andrun it in CI. Reference: scripts/fetch_docs.py, backend/evals/run_eval.py, chunk schema in scripts/fetch_docs.py (mock_chunks).

