NagarSetu — Metrics
Every number below traces to a file in this repository.

Eval accuracy: 4/18 at baseline, 18/18 final, in threeiterations. Baseline (first run, before any fixes): see thefirst summary line captured in backend/evals/results.md history.Iteration 2 (procedure_id guardrail, Task 1.5): 12/18.Final (refusal gate, Task 2): 18/18. Re-run live with:python backend/evals/run_eval.py
Grounded citation rate: 100%. Every expected_chunk_id in theeval set appeared in response.sources on the final run.Source: backend/evals/results.md, grounded_citation_rate field.
Trap refusal rate: 5/5. Every out-of-scope query (populationstatistics, voting advice, poem requests, "approve my license",official-name lookup) returns a structured refusal with threeworking suggestions. Source: backend/evals/results.md,trap_refusal_rate field; implementation in backend/rag/scope.py.
Golden path timing: 40 seconds. Measured on the live app:
type query, receive checklist, expand a step, tick a step,
export PDF. Under the 90-second target.
Fabrication guardrail: 0 fabrications in the final 18-query eval run.
  Baseline (before prompt rule 7 + verify.py guardrail): 7 fabricated
  procedure_ids across Q5-Q11 and Q13. The prompt rule prevents the
  failure; the deterministic guardrail (verify.py, _modal_procedure)
  remains as insurance.