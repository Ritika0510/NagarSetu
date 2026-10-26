NagarSetu — Scope: What We Did Not Build
Payments. NagarSetu is a navigational aid. We do not take moneyon behalf of any government department.
User authentication. An anonymous session_id (localStorage,frontend/lib/api.ts, getSessionId) is sufficient for progresstracking, and stores no personal data.
Multi-city. Three Chandigarh procedures prove the full pipeline.Expansion to another city is data ingestion plus configuration,not new engineering.
Real government integrations. The pipeline consumes officialdocuments; direct integration with government systems raisescompliance and deployment questions that belong after ahackathon, not during one.
Mobile native apps. The web app is responsive (chat/checklisttabs under 1024px, frontend/app/page.tsx). One codebase for thedemo.
More than three procedures. Depth over breadth. Adding aprocedure means adding documents to data/ and re-runningscripts/build_index.py — no code changes.
Scope discipline was a deliberate choice. The build specificationfor this project states it plainly: judges reward a working demoof a narrow feature over a slide deck about a broad platform. Webuilt three procedures completely, measured them, and fixed whatthe measurements exposed (backend/evals/results.md: 4/18 to 18/18)rather than spreading the same hours across thirty half-workingfeatures.