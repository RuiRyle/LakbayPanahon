# Teacher and administrator regression follow-up

Administrator combined browser fixture: PASS at 390 and 1280 pixels with synthetic Firebase records and actual application controllers. Includes qualification review, separate activation, cancellation/draft preservation, duplicate moderation submission, stale decisions, uncertain-save and activation recovery, decision history, snapshot pagination, read failure and sign-out cleanup. Evidence: admin-workspace-browser-2026-10-31.json (its verifiedAt records this run; filename is historical).

Fixtures now load the current shared decision/administration modules and await asynchronous confirmation-dependent actions. Pending-state assertions remain synchronous. Current Decision Records pagination replaces the obsolete ten-article assertion.

Teacher source fix: after the discard gate, sidebar navigation dispatches a temporary same-origin link through the shared transition handler instead of directly assigning location. Syntax check passed. Full teacher page-navigation acceptance remains unverified: the attempted HTTP browser test produced no final browser result. This is not a passing navigation report.

Teacher combined fixture progresses through class creation, draft cancellation, switching, and student roster/report links, but still fails at the check-in summary assertion. It is not release acceptance. The combined fixture adapts real document navigation into in-place refresh for synthetic testing; it does not certify actual document navigation.

No production records, billing, or deployment changed. Rebuild the running local package before testing source changes through the main launcher.
