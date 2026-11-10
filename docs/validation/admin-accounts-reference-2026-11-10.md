# Accounts reference implementation — 10 November 2026

Local implementation follows the supplied Accounts Management reference: navy/gold landscape banner, All Accounts / Teachers / Students role navigation, compact search/status/role/reset/refresh toolbar, account identity rows with role/status/created-date columns, selected-row highlight and an adjacent account-details panel. Tablet and mobile stack the panels; mobile rows preserve identity, role, status and the selection action.

Existing moderation form, teacher-qualification context, decision history, confirmation and uncertain-save recovery remain available. Change status opens and focuses the original form; View history opens the existing audit records. No unsupported bulk selection, deletion, overflow actions, global totals or numbered last-page controls were added.

`loadAdminAccounts` now accepts all roles (bounded to student/teacher using a role query) and all statuses while preserving administrator authorization, document-ID cursor pagination and the 26-document query / 25-record page bound. Search remains explicitly limited to the loaded page. Missing creation timestamps display Not recorded; no dates are fabricated.

Changed source: `css/admin-workspace.css`, `js/admin-workspace.js`, `js/admin-accounts.js`. Updated regression: `tests/admin-pages-browser.cjs`.

Validation:
- 87 real-page/navigation and Accounts browser checks passed across 1380px, 900px and 390px using mocked Firebase with synthetic records. Includes role tabs, all-role pagination, search visibility/reset, selected details, status form focus and history controls.
- Existing administrator workspace browser suite: 262 checks passed.
- Overview / decision recovery / review rules / teacher application policy: 23 tests passed.
- Accepted Priority 3 integrity validation: valid.
- Local release build: 37 pages, 608 files, zero missing or rejected references.

Screenshots: `admin-accounts-reference/accounts-1380.png`, `accounts-900.png`, `accounts-390.png`.

Screenshots use synthetic browser fixtures, including a deliberately hostile display name shown as literal text to verify safe rendering. No production data or writes. No deployment or billing. Final manual emulator acceptance remains recommended, particularly for the expanded all-role query in the real local Firestore environment.
