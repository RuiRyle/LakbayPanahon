# Clear separation of applications and account access

Teacher Applications now labels categories in terms of the next task: Not submitted, Ready to review, Changes requested and Decided. A compact page-purpose strip explains reviewing qualifications and links to Accounts. Accounts has its own purpose strip explaining access management and linking back to Teacher Applications. Duplicate workspace mode controls are hidden.

Account status labels use Pending access, Activate access and Deactivate access rather than approval language. A selected teacher gets a contextual summary: qualifications approved and the activation step, no submission yet, submitted for review, or review needs attention. The link opens that same teacher and correct application category. Qualification details/recovery remain in a collapsed disclosure in Accounts; qualification decision controls are not duplicated in the primary account workspace. Full verification, confirmation, stale-record, audit and uncertain-save services are unchanged.

Local changes: `js/admin-workspace.js`, `css/admin-workspace.css`, `tests/admin-workspace-browser.cjs`. No query or backend changes. Category links carry a validated category query parameter across real page navigation.

Validation: 260 synthetic browser checks, 42 separate-page navigation checks, 15 focused data/recovery/rules tests and local build passed (37 pages, 608 files, zero missing/rejected references). Responsive synthetic captures refreshed at 1170, 1380, 900 and 390px without viewport overflow. Browser fixtures are mocked Firebase and do not replace full live-emulator acceptance.

Updated emulator frontend on port 4174 reuses the running local Auth/Firestore/Functions data; no reseeding. No main Firebase access, deployment, billing activation, grading or reward changes. These changes are local and have not been pushed in this turn.
