# Guided teacher approval and activation — 10 November 2026

Implemented locally in `js/teacher-review-panel.js` and `js/admin-workspace.js`.

Teacher Applications offers **Approve & Activate**, **Request changes**, and **Decline**. Approval and activation remain separate permission-checked transactions with separate audit records. Confirmation explains both operations. Qualification checks, route-specific requirements, stale-version checks, and applicant-facing reasons remain required.

If approval succeeds but activation fails, the review stays locked and exposes activation-only recovery. An uncertain activation checks its exact receipt; a missing receipt never triggers another write. A fresh account read and the existing transaction version check guard activation. A changed moderation event requires inspecting the account rather than overwriting another decision. Existing reviewed applications retain the Accounts recovery route.

## Validation

- Administrator browser regression: **262 checks passed**, 1280px and 390px; Firebase mocked with synthetic records. Includes deterministic activation failure, approval preservation, activation-only retry, uncertain activation, and late-commit receipt recovery without replay.
- Separate administrator page/navigation browser suite: **42 checks passed**.
- Decision recovery, overview, review rules and application policy: **23 tests passed**.
- Priority 3 local integrity validator: **valid**.
- Local web release build: **37 pages / 608 files**, zero missing/rejected references.
- Responsive synthetic screenshots: `admin-application-final/` (1170px, 1380px, 900px, 390px).

No production access, deployment, billing activation, or educational logic changes. Browser regression uses mocked Firebase and does not establish a new emulator-backed security acceptance result for this combined interaction. Final manual emulator acceptance is still recommended. Approval and activation intentionally are not atomic: a partially completed workflow preserves approval and requires recovery.
