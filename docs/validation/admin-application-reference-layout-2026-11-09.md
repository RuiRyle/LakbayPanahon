# Teacher Application reference layout

9 November 2026. Local reference-based UI refinement; no production access.

Implemented the reference's applicant-list/detail hierarchy, applicant avatar/identity and current-status card, qualification table, supporting-document panel, factual information-availability summary, and saved decision-history preview with a complete-history link. The application workspace hides duplicate mode-switch controls and account activation controls; Accounts remains available through navigation. Back to list and the selected applicant are preserved. Existing verification fields, reason, final submit, confirmation, stale revision checks and uncertain-save recovery remain in place.

Approve, Request changes and Decline controls select a proposed decision and focus the reason. They do not submit without verification or bypass the final confirmation. The summary describes recorded information as Provided/Not recorded, explicitly distinguishing it from independent verification. Evidence uses the existing private viewer; no invented document names, file sizes or successful verification marks.

Changed `js/teacher-review-panel.js`, `js/admin-workspace.js`, `css/admin-workspace.css` and `tests/admin-workspace-browser.cjs`. All **182 local browser-fixture checks passed**, including applicant identity, summary truthfulness, hidden access controls and non-writing decision shortcuts. Existing authorization, audit, stale-save and recovery checks remain passing. Accepted Stage 0 validation and scoped whitespace checks passed.

Actual Chrome captures at 1380/900/390px use synthetic mocked Firebase records and have no horizontal overflow. Desktop was visually inspected:

- [Desktop application review](admin-application-reference/applications-1380.png)
- [Tablet application review](admin-application-reference/applications-900.png)
- [Mobile application review](admin-application-reference/applications-390.png)

The screenshot reference includes education/experience fields, multiple document uploads and revision/reviewed queue tabs that are not supplied by the current submitted-queue implementation. Those are not fabricated or presented as working features. Actual submission time is not inferred: the identity card labels an available application timestamp as Updated; otherwise it says unavailable. History preview uses already-loaded account decisions, not an unverified claim of a complete qualification-event chronology.

No new backend query, permission, production record, billing, deployment, accepted Priority 3 artifact, grading, reward or progress change. No push. This is ready for visual review of the implemented supported layout; it is not a claim of pixel-identical reproduction or new production acceptance.
