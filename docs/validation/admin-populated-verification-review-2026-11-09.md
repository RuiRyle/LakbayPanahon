# Final populated administrator verification

9 November 2026. **Recommendation: NEEDS FIXES against the latest acceptance criteria.** Visual design frozen. Final local package `build/student-web-2tWwzX`; preview on port 4174. No deployment/billing/production activity.

## Blocking requirement

Latest criterion 5 requires qualification approval and account activation to remain distinct actions. Actual browser verification observed a pending teacher's account become **active immediately when qualification approval was saved**, with no separate account-activation submission. `js/teacher-application-review.js` explicitly couples those writes in one transaction, and the current qualification Rules/tests enforce that behavior. Review and moderation have separate forms/records, but that is not independent initial activation.

The final acceptance runner deliberately exits nonzero for this mismatch while finishing all other checks and cleanup. It is not an unresolved harness error. Decoupling this behavior requires a coordinated verification/Rules/security-contract change; it was not silently implemented during a verification pass that must preserve those boundaries and the accepted Priority 3 candidate.

## Passed checks and fixtures

- **64 actual browser checks passed**, including populated matrix states and 1440/900/390px screenshots, keyboard focus, request changes, revision-2 resubmission/approval, confirmations, account search, student restriction/reactivation, teacher deactivation/denied access, audit history and real account pagination without duplicate rows.
- Created actual local Auth/profile fixtures for active/inactive students and pending/active/inactive teachers. Four synthetic teacher applications represented submitted, approved, declined and needs_changes. Inspected each application's detail view. Added **27 directory-only synthetic profiles** to force real pagination beyond 25; these were not represented as login accounts.
- **106 responsive UI assertions passed**, including loading/errors, reset filters, mode separation, cancellation, stale records, page/history pagination, and fault-injected uncertain saves/late commits.
- **97 local permission assertions passed**: 53 qualification + 44 admin, isolated `demo-lakbay-teacher`. Unauthorized users, forgery, self-promotion, protected fields and audit mutation/deletion checks remain denied.
- **12 policy/overview/receipt unit checks passed**. Accepted Stage 0 integrity validation passed.
- Actual walkthrough cleanup succeeded: only owned disposable profiles, applications, audit records and Auth identities were deleted. Existing local session accounts/records were not reset.

## Confirmed defect fixed

A duplicate status form submission while busy could display a second confirmation, although the task guard already blocked a second transaction. Added an early busy guard in `js/admin-workspace.js`. New regression failed before the fix and passed afterward: exactly one confirmation and one transaction. No other application behavior or visual design changed.

Intermediate fixture correction: adding approved-verification fields with a replacement REST PATCH omitted the synthetic profile's role/status. Fixed the fixture to retain its original fields, then reran all four populated states. The final run completed; no cleanup or harness error remains.

## Screenshots and evidence

`docs/validation/admin-populated-final/` contains actual captures at desktop/tablet/mobile widths. Key populated captures: `matrix-overview-1440.png`, `matrix-teacher-applications-900.png`, `matrix-existing-accounts-1440.png`, `matrix-detail-approved-390.png`, `matrix-detail-declined-900.png`, `matrix-detail-needs_changes-1440.png`, and `administration-1440.png`. Native dialog text is recorded in `admin-populated-verification-2026-11-09.json`. Responsive results are in `admin-populated-responsive-2026-11-09.json`.

## Limits and final disposition

Uncertain-save and late-commit UI coverage uses injected transaction/receipt faults, not real ambiguous Google commit/crash scenarios. Snapshot counts remain bounded and own-actor records use document order. Search remains current-page only. Recovery remains session-scoped; no live infrastructure-health monitoring is claimed.

Accept the visual foundation and the verified existing workflows, but **do not mark the administrator requirements fully accepted** until the explicit activation-separation requirement is resolved and tested. No protected assessment, grading, XP, badge, reward, student-progress, accepted candidate or production changes were made.
