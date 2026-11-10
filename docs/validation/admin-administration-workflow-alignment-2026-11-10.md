# Administration workflow alignment — 10 November 2026

Reviewed `docs/revised-study-scope.md`, `docs/project-scope.md`, `docs/admin-workflow.md` and the implemented administrative services. Replaced the reference-inspired but misleading System Status / Access & Security / Recovery & Support tool descriptions with actionable destinations supported by the study and current implementation.

Four visible tiles now route to:
1. Teacher Verification -> submitted Teacher Applications.
2. Account Access -> student/teacher Accounts.
3. Decision Records -> saved administrator-owned audit snapshot.
4. Account History & Recovery -> find the affected account and inspect/reconcile saved decisions.

Recovery is not a password-reset or support-ticket service. It checks existing administrative decision outcomes. Contextual original controls are preserved; unavailable recovery is hidden instead of a disabled primary tile. The signed-in administrator's activity records provide bounded oversight; service health and role promotion remain outside the UI. Visual reference layout, illustration and theme are retained.

Updated `js/admin-administration-view.js`, `css/admin-workspace.css`, the focused browser fixture and `docs/admin-workflow.md`.

Passed synthetic local rendered browser fixtures at 1440px, 900px and 390px: all four real destinations, no unavailable primary tile, truthful environment/security scope, preserved recovery listener, hidden irrelevant recovery and viewport containment. Six decision-receipt unit tests passed. Local build: 37 pages / 616 files, zero missing/rejected references. These are focused synthetic UI tests, not fresh emulator authorization acceptance. No production/deployment/billing or educational logic changes.
