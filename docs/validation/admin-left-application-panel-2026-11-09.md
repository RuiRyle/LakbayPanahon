# Teacher Applications left-panel completion

9 November 2026. Completed the focused left-panel refinement; the right-side review layout and Firestore query implementation were not changed in this pass.

## Changes

- Rounded navy list container, compact gold-selected status tabs, and an explicitly page-scoped loaded-record count on the selected tab.
- Search icon and “Search name or email” placeholder; search uses applicant names and emails rather than application-status text. Search scope remains visible.
- Compact full-card applicant buttons with name, email, actual-stage badge, opening arrow, gold selected border, hover and keyboard-focus styling.
- Independently scrolling populated list with accessible controls above and a single-row pagination footer below. Previous/Next buttons retain their accessible names and disabled states.
- Specific loading/error text, read-only Retry action, and correct CSS hiding for filtered-out cards. Retry buttons are excluded from applicant search counts.

Implementation files: `css/admin-workspace.css`, `js/admin-workspace.js`. Regression coverage: `tests/admin-workspace-browser.cjs`.

## Validation

- 212 synthetic browser checks passed across desktop/mobile, including independent list scrolling, footer containment, scoped count, actual visual filtering, restored search results, applicant selection, failure/retry and existing review/recovery behavior.
- 42 separate-page/compass checks passed.
- 15 focused data/recovery/rules tests passed.
- Local release build passed: 37 pages, 607 files, no missing/rejected dependencies. Accepted Stage 0 validation passed with protocol disabled. Scoped whitespace validation passed.
- Populated full-page and left-panel screenshots captured at reference size 1170 × 760, plus 1380px desktop, 900px tablet and 390px mobile widths. No viewport overflow reported.

Reference-size close-up: `admin-application-final/applications-left-1170.png`. Full page: `admin-application-final/applications-1170.png`. Equivalent `-left-900` / `-left-390` images show responsive panels.

The initial capture attempt in the preceding turn was blocked because automatic approval review could not complete due to a usage limit; it did not execute. The resumed capture succeeded through the normal approval path.

Browser fixtures use synthetic mocked Firebase; these results do not claim a new live-emulator security acceptance run or confirm any production account's status. No deployment, billing activation, real student data access, backend/query changes, assessment or reward changes occurred. Ready for visual acceptance of the left panel.
