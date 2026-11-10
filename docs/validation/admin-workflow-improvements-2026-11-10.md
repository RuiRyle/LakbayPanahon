# Focused administrator workflow improvements — 10 November 2026

Implemented clearer state-specific next steps for submitted, missing, changes-requested, declined, approved-active, approved-incomplete and approved-inactive teachers. Corrected guidance that still forced all approvals through a separate manual Accounts step despite the guided Approve & Activate workflow.

The review form now locks while the asynchronous confirmation is open, rejects duplicate submits and rechecks session/root validity after confirmation before writing. Qualification approval remains saved if activation fails. Receipt-only checks resolve ambiguous activation without replay; a stale or denied activation offers refresh/history review instead of a misleading activation retry.

Added an administrator-authorized lookup of the immutable teacherApplicationReviews record paired by event ID with an account audit. It validates account, actor, reason, allowed decision and positive revision before displaying an exact qualification outcome. Missing/unreadable/mismatched reviews retain a generic outcome; no approval/decline is inferred from account status. Decision details and CSV include workflow and application revision; search includes resolved workflow/outcome labels. Existing access audit records and server checks are unchanged.

## Validation

- **23 connected checks passed**: actual browser, Firebase SDK and local Auth/Firestore Rules; synthetic teacher submission, changes requested/resubmission, decline/resubmission, approval/activation, one confirmation under duplicate submission, distinct qualification/access audit IDs, approval independently preserving pending access, authorized paired-audit resolution, approved teacher dashboard access, teacher denial from admin service, student moderation with preserved XP, stale-version rejection and exact decision rendering. Desktop/tablet/mobile screenshots included. Test-created profiles, applications, audit records and Auth identities were cleaned up without errors. Task-owned emulators were stopped.
- **25 focused unit tests passed**: decision receipt recovery, paired-audit trace validation, permissions/session rejection, overview queries and qualification policy.
- Guided recovery browser fixtures passed at 1280px and 390px: canceled/duplicate confirmation, session change while dialog open, partial activation, activation-only retry, uncertain/missing/late receipts, stale recovery and state-specific next steps.
- Existing decision-view browser fixtures passed at 1440px/390px; reference decision browser fixtures passed at 1440px/900px/390px.
- Local build passed: 37 pages / 616 files, zero missing/rejected references.

## Failed / remaining checks

The admin review rules regression reports **base rules still equal the accepted snapshot** as failed. Read-only investigation shows existing classroom-assignment submissionVersion changes in `firestore.assessment.rules`. The previously reported `js/student-assessment-client.js` integrity difference contains classroom-assignment context/recovery changes. Neither file was edited in this admin pass. Do not treat these working sources as a validated unchanged Priority 3 candidate. This blocks project-wide release acceptance, not the observed connected admin workflow result. The connected run used a local separate-activation overlay generated from the current working rules, not a claim of accepted-candidate integrity.

Fault injection uses synthetic browser service doubles; the connected run does not claim process-crash or every network ambiguity was reproduced against Firestore. Email verification was a synthetic emulator flag, not email delivery. No production access, real records, deployment, billing, grading or reward logic changes.

Changed source: `js/teacher-review-panel.js`, `js/admin-accounts.js`, `js/admin-decision-view.js`, `js/admin-workspace.js`, `css/admin-workspace.css`. Added tests: `tests/admin-decision-trace.test.cjs`, `tests/admin-guided-recovery-browser.cjs`, `tests/admin-connected-final-local.cjs`. Connected evidence: `admin-connected-final-2026-11-10.json`; screenshots: `admin-reference-final/decision-records-1440.png`, `decision-records-900.png`, `decision-records-390.png`.

Recommendation: focused admin workflow ready for manual local acceptance; overall project release still NEEDS FIXES for the separate accepted-source integrity discrepancy.
