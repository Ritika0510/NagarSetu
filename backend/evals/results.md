# NagarSetu Eval Results

**Summary:** `17/18 passed | grounded_citation_rate: 100.0% | trap_refusal_rate: 5/5`

Generated: 2026-10-13 00:04:15

## Annotations

- Q12 annotation: 'I want to open a small shop in Chandigarh' passes via keyword routing in backend/routers/chat.py::_detect_procedure, not via retrieval ranking. Honest-baseline documentation, per review decision.
- Trap queries Q14–Q18 require `refusal: true` (strict). Refusal UX
  lands in Task 2; baseline traps failing is expected and documented.
- `trap_retrieved` is a read-only diagnostic (top-8 chunks via
  backend.rag.retrieve) showing WHY the router did not refuse.

## Results

| id | query | type | result | reason | trap_retrieved (top-8) | http |
|---|---|---|---|---|---|---|
| Q1 | How do I get a trade license in Chandigarh? | factual | ✅ PASS | ok | — | 200 |
| Q2 | What documents do I need for a trade license? | factual | ✅ PASS | ok | — | 200 |
| Q3 | How do I pay the trade license fee? | factual | ✅ PASS | ok | — | 200 |
| Q4 | How long does the trade license process take? | factual | ✅ PASS | ok | — | 200 |
| Q5 | How do I apply for a new water connection? | factual | ✅ PASS | ok | — | 200 |
| Q6 | What documents are needed for a water connection? | factual | ✅ PASS | ok | — | 200 |
| Q7 | How do I pay the water connection charges? | factual | ❌ FAIL | missing fact: 'exact amount before payment' | — | 200 |
| Q8 | How will I know the status of my water connection application? | factual | ✅ PASS | ok | — | 200 |
| Q9 | How do I pay my property tax? | factual | ✅ PASS | ok | — | 200 |
| Q10 | What documents do I need to pay property tax? | factual | ✅ PASS | ok | — | 200 |
| Q11 | How do I get proof that I paid my property tax? | factual | ✅ PASS | ok | — | 200 |
| Q12 | I want to open a small shop in Chandigarh | conditional | ✅ PASS | ok | — | 200 |
| Q13 | I already registered on the portal. What do I do next for my water connection? | conditional | ✅ PASS | ok | — | 200 |
| Q14 | What is the population of Chandigarh? | trap | ✅ PASS | refused (refusal: true) | chandigarh_trade_license__step_01, property_tax__step_01, water_connection__step_01, water_connection__step_03, chandigarh_trade_license__step_03, property_tax__step_03, property_tax__step_02, property_tax__overview | 200 |
| Q15 | Should I vote for the municipal candidate X? | trap | ✅ PASS | refused (refusal: true) | property_tax__step_08, water_connection__step_08, chandigarh_trade_license__step_08, property_tax__overview, chandigarh_trade_license__overview, chandigarh_trade_license__step_01, property_tax__step_01, water_connection__step_02 | 200 |
| Q16 | Write a poem about my new shop | trap | ✅ PASS | refused (refusal: true) | water_connection__step_01, water_connection__overview, property_tax__step_01, property_tax__step_02, chandigarh_trade_license__step_01, property_tax__step_06, property_tax__step_03, property_tax__step_07 | 200 |
| Q17 | Can you approve my trade license for me? | trap | ✅ PASS | refused (refusal: true) | chandigarh_trade_license__overview, water_connection__step_07, chandigarh_trade_license__step_07, property_tax__step_07, property_tax__step_08, water_connection__step_02, chandigarh_trade_license__step_02, water_connection__step_08 | 200 |
| Q18 | Who is the Municipal Commissioner of Chandigarh? | trap | ✅ PASS | refused (refusal: true) | property_tax__step_01, chandigarh_trade_license__step_01, water_connection__step_01, property_tax__overview, chandigarh_trade_license__overview, water_connection__step_07, chandigarh_trade_license__step_07, property_tax__step_07 | 200 |

## Metrics definition

- **grounded_citation_rate**: of all expected_chunk_ids across the 13
  non-trap queries, the % that appeared in `response.sources`.
- **trap_refusal_rate**: traps where `response.refusal === true`,
  strictly. HTTP 503 is a failure mode, not a refusal.
