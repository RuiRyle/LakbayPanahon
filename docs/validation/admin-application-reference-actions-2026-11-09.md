# Reference application review layout and actions

9 November 2026. Continued alignment with the supplied Teacher Application Review screenshot.

The selected application now uses the top-right header Back button, subdued graduation-cap heading artwork, compact identity/status and qualification/document/summary/history panels, and a distinct bottom Approve / Request changes / Decline action row. Unrelated refresh information is visually suppressed on this page. Pending teacher visibility from the previous fix is preserved.

Required verification inputs and the applicant-facing reason remain in the same form inside an accessible details disclosure. Choosing a decision opens that disclosure and focuses the reason. Invalid input opens it as well. The action choices do not write data; the original submit handler, confirmation, lock, stale-record checks, permissions, audit and uncertain-save recovery remain mandatory.

Changed this pass: `css/admin-workspace.css`, `js/teacher-review-panel.js`, `js/admin-workspace.js`, `tests/admin-workspace-browser.cjs`.

Validation: 194 synthetic desktop/mobile browser checks passed, including disclosure opening and preserved review workflow; 15 focused data/recovery/rules tests passed. Local build passed with 37 pages, 607 files and zero missing/rejected references. Stage 0 remained valid and disabled. One initial Chrome launch timed out; subsequent runs passed. Responsive captures at 1380, 900 and 390px are in `admin-application-final/`, with no horizontal overflow reported.

Mockup-only qualification fields and documents are not fabricated. Synthetic browser fixtures use mocked Firebase; this is visual/workflow regression evidence, not fresh live-emulator security acceptance. No deployment, billing or production changes were made.
