# Unified teacher application review desk

Replaced the four competing detail cards with one cohesive review area. Qualifications, Documents and History use accessible tabs; the submitted-information checklist stays alongside them on desktop and below them on smaller screens. Existing section content, private evidence controls and complete-history navigation remain available. Decision buttons, verification, confirmations, permissions, audit records and save recovery are unchanged.

Tabs support click, Left/Right arrows, Home and End, with selected state, roving keyboard focus and linked tab panels. A short fade/slide runs when a panel opens. System and in-app reduced-motion preferences disable it. Applicant changes retain the existing restrained entrance treatment and compass page navigation.

Implementation: `js/admin-workspace.js`, `css/admin-workspace.css`. Regression coverage: `tests/admin-workspace-browser.cjs`.

Validation: 252 synthetic browser checks and 42 navigation checks passed. The 15 focused data/recovery/rules tests passed during implementation. Final local build passed with 37 pages, 607 files and no missing/rejected references. Stage 0 validation passed, protocol disabled. Screenshot rerun succeeded after the prior automatic approval-review usage-limit failure; no approval check was bypassed.

Submitted/unsubmitted captures at 1170, 1380, 900 and 390px reported no viewport overflow; capture checks verify system reduced-motion behavior. Additional settled desktop captures: `admin-application-final/desk-documents-1170.png` and `desk-history-1170.png`. Default qualifications capture: `admin-application-final/applications-1170.png`.

Browser fixtures use synthetic mocked Firebase and do not constitute fresh live-emulator security acceptance. No production data, security rules, billing, deployment, educational logic, rewards or student progress were changed.
