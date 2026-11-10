# Admin baseline and unsaved-decision protection

7 November 2026 (Asia/Manila). Local-only account-management refinement. No hosted release, production mutation, billing, Workers transport or content-publication implementation.

## Baseline and correction

The existing admin unit suite passed 3 tests, and the initial browser baseline passed 21 checks at each of 390px/1280px. Source inspection confirmed that account switching, queue/filter refresh and pagination cleared unfinished moderation/qualification forms without discard protection.

`js/admin-workspace.js` now captures a baseline of the selected account's form values after its review UI loads. Account switching, filter/queue refresh and pagination ask before discarding changed values. Cancelling preserves the selection and draft. Navigation is refused while the qualification form is saving; browser unload requests confirmation for an unsaved decision or in-progress operation. Successful decisions reset the dirty baseline before refreshing. Auth/page lifecycle cleanup remains authoritative and does not preserve sensitive data across accounts.

No decision is autosaved; checkbox changes count as unsaved edits. Browser unload prompts remain subject to browser/user-interaction restrictions and cannot guarantee recovery after process termination. This change does not implement ambiguous-write reconciliation or protect a draft after an authenticated session is revoked.

## Verification

- `node tests/admin-accounts.test.cjs`: 3 passed.
- `node tests/admin-workspace-browser.cjs`: 25 checks at each of 390px/1280px passed (50 viewport assertions). Includes cancelled refresh, unload protection, qualification draft preservation and save-time navigation blocking alongside all baseline checks. [Browser evidence](admin-workspace-local-2026-11-07.json).
- `node --check js/admin-workspace.js`: passed.
- `tests/admin-workflow-emulator.cjs`: 44 permission/integration checks passed against loopback Firestore with current local rules in isolated `demo-lakbay-teacher`. The test resets/seeds its synthetic project, separate from the running website's `demo-lakbay-local` classroom data. No production credentials were used.

The permission suite covers current admin access, audit/account atomic pairing, identity/reason requirements, role/XP/email restrictions, self/admin-account protection, immutable audit records, deactivation/reactivation preserving progress and denial of curriculum writes or student quiz-result enumeration. These are local rule checks, not a hosted acceptance result. In particular, the simple moderation unit helper is not the whole teacher-qualification approval contract; current application review remains required by its separate service/rules.

## Next bounded task

Refine the account-management page hierarchy: clearly separate submitted teacher applications from existing-account access management, make selected-account context and empty/error states clear, and use the established navy/gold design system. Keep current bounded queries and guards; do not introduce invented dashboard totals or privileged publication paths. Account review/read/write recovery under unknown outcomes needs separate coverage before production sign-off.
