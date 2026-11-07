# Teacher workflow logic hardening

Updated 6 November 2026. Work proceeds in priority order.

| Priority | Task | Status |
| --- | --- | --- |
| 1 | Prevent stale announcement/assignment edits overwriting newer records | Implemented and locally tested |
| 2 | Separate classroom mutation outcomes from refresh failures | Implemented and locally tested |
| 3 | Define and implement closed/withdrawn activity behavior | Implemented locally; see activity-lifecycle.md. Rules/frontend publication pending |
| 4 | Retrieve pending follow-ups beyond bounded dashboard/inbox snapshots | Implemented locally: cursor pages, exact class-scoped lookup, explicit snapshot counts |
| 5 | Connect practice, explanation and teacher-response stages in summaries | Implemented and locally tested; see review-learning-stages.md |
| 6 | Detect and explain duplicate review assignments | Implemented locally: draft publication warning and transaction revision guard; see duplicate-review-warning.md |
| 7 | Define membership scope and make report totals transparent | Implemented locally: activity reports state current roster, displayed/eligible counts, later joiners and unavailable-result meaning |

## Edit conflict protection

An editor retains a canonical version of the record it opened. The publication transaction compares that version with the current server record before updating. A changed record is rejected with a failed-precondition message, retaining the local text. This covers announcements, class goals and personal-review edits, including publish/unpublish actions. The version includes content and timestamp precision, so legacy records without timestamps and same-time content changes are covered. No new Firestore fields or rule changes are required. Reopen the latest record before explicitly resubmitting; no automatic merge or overwrite is attempted.

## Classroom action recovery

Publish/unpublish, classroom detail edits, archiving/restoration and invitation rotation/revocation now use separate write and refresh outcomes. A confirmed write followed by a refresh error displays a confirmed-save message and a read-only Check classroom status action. An ambiguous response blocks affected write controls and classroom switching until a status check completes. The check reads current state and does not replay the mutation. Unconfirmed classroom-name/description text is retained. State is page-session-local; reload protection is supplied by the existing beforeunload guard rather than durable offline recovery.

## Validation

- teacher-class-policy.test.cjs: six pure policy checks.
- teacher-publication-conflicts.cjs: 12 mobile/desktop assertions for stale editor protection, text retention, reopening current records and stale publish/goal actions.
- teacher-class-action-recovery.cjs: 16 mobile/desktop assertions covering confirmed writes, failed refreshes, lost responses, read-only recovery and preserved classroom text.
- Existing announcement, assignment, classroom and publication-recovery browser suites passed.
- Release build: build/student-web-tzQ1Ep, 33 pages, 572 files, zero missing/rejected references.

Tests are local with mocked Firestore or isolated emulators. No production account, learner record, Hosting release or rules were changed by these fixes. Production publication and external acceptance remain separate.

