# Dashboard-to-guidance workflow refinement � 6 November 2026

Implemented the first priority: make the teaching dashboard lead to a specific student action and preserve context while reviewing learning evidence.

## Changes

- Needs your guidance now supports paging through every follow-up in the loaded snapshot, four cards at a time. Previously only the first four were reachable.
- Classroom and question/explanation filters reuse the snapshot without additional database reads. The existing six-class and 100-record-per-collection snapshot limits remain explicit; paging is not a claim to load the entire database.
- Each request provides Reply/Review and a secondary View learning evidence link carrying the student and return-request context.
- Student Progress identifies the selected private request, focuses its reply field, links to evidence, and provides a return route to the exact request. Missing requests get an honest unavailable/changed message. Switching classrooms clears stale follow-up context.
- Sent help replies immediately display the new saved text and next step. Explanation counts update after guidance is sent.
- Unsent teacher guidance is protected when leaving the page or refreshing its inbox. Cancellation retains the text.

## Validation

Dashboard browser checks cover queue paging, classroom isolation, explanation filtering and preserved evidence-link context at mobile and desktop sizes. The actual Firebase SDK/emulator walkthrough verifies request ? evidence ? same request ? new private guidance, including the updated queue count. Release packaging checks pass. Detailed browser evidence is in class-teaching-browser-2026-11-06.json.

No schema or permission changes in this refinement; no production records modified and nothing deployed. The earlier avatar-catalog rule change remains awaiting live publication.

## Remaining priorities

1. Classroom workspace organization and consistent classroom context across teaching destinations.
2. Assignment-planning clarity: objective, recipients, readiness and chronological prerequisites before publication.
3. Progress evidence: distinguish low score, inactivity, unavailable records and actual improvement.
4. Consistent states and interactions across pages, followed by bounded production acceptance after publication.

Existing features should be audited and connected before adding duplicate controls or new pages.

## Additional priorities completed in this pass

- Classroom workspace: selected-class navigation provides Overview, Students, Activities and Announcements links with the same class ID and a current-page indicator across the teaching destinations. It does not require extra data queries.
- Assignment planning: the selected lesson's learning objective and class-goal/personal-review purpose now appear outside the collapsed detailed preview. Existing readiness, recipient, deadline and chronological-lock behavior remains available and was regression-tested.
- Progress clarity: individual summary completion counts now use distinct completed missions in the current catalog, matching the journey view rather than counting duplicate or retired progress rows. A regression case verifies this.
- Consistency: private guidance refresh/navigation now protects unsent text; published replies and counts reflect successful saves in place. Existing announcement, classroom, activity, progress and publication-recovery suites passed at mobile/desktop sizes.

The earlier remaining-priorities list describes the starting order. This pass addressed the local refinements above; production publication and external acceptance remain outstanding. The current build is build/student-web-clSzEV (33 pages, 572 files, zero missing or rejected references). No production release was performed.

Final save-safety detail: private reply submission captures the text once and keeps that field read-only while the write is pending. The pending form also participates in navigation protection. This prevents displayed guidance drifting from the text actually submitted. The browser acceptance runner now fails on unexpected JavaScript exceptions; known native cross-document ViewTransition abort diagnostics remain reported separately.
