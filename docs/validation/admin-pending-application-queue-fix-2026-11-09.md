# Pending teachers in the application workspace

9 November 2026. The Teacher Applications Pending tab previously queried only `teacherApplications.status == submitted`. Pending teacher profiles without a submitted form therefore appeared in Accounts but not this tab.

The Pending tab now merges submitted forms and pending teacher profiles by user ID. Each query is bounded to 26 documents; the merged page contains at most 25 unique IDs. Both queries resume after the last displayed ID, preserving pagination without dropping overlapping records. Missing counterparts are fetched only for displayed rows. Authorization and session checks remain mandatory, and failed reads fail the queue load instead of implying a missing form.

Rows show the actual stage: qualifications awaiting review, application not submitted, changes requested, declined, approval needs recheck, or approved qualifications awaiting activation. Profile names/emails fill available identity gaps. The detail view explains missing applications and exposes separate account-access navigation. No approval or activation permissions changed.

Changed: `js/admin-accounts.js`, `js/admin-workspace.js`, `js/teacher-review-panel.js`, `css/admin-workspace.css`, `tests/admin-overview.test.cjs`, `tests/admin-workspace-browser.cjs`.

Validation: 190 synthetic browser checks passed across desktop/mobile, including pending profiles without forms; 42 page/compass navigation checks passed; 15 focused tests passed, including union pagination, stages, duplicate prevention, missing-form handling, failed reads, authorization, recovery and unchanged rules. Local build passed (37 pages, 607 files, no missing/rejected references). Accepted Stage 0 validation passed, protocol disabled.

Screenshots refreshed in `admin-application-final/` at 1380, 900 and 390px. Browser tests use mocked Firebase. No production records were inspected or changed, no fresh live-emulator security acceptance is claimed, and nothing was deployed. The fix does not establish the status of any particular production account.
