# Duplicate review publication safeguards

Updated 6 November 2026.

New published personal-review rounds and publishing existing drafts check server records in the receiving class before writing. A published review for the same student and mission requires explicit confirmation for an additional round. Closed, withdrawn and draft records do not trigger the warning. Passing practice alone does not close a review. Editing an already published review does not create another round.

Cancel preserves instructions and sends no write. Failed checks prevent submission. Intentional new rounds retain the earlier review and explanations. Current membership is checked inside new-round transactions. Existing stable retry IDs and uncertain-save verification remain in place.

## Concurrent submissions

The app reads classReviewPublicationState/{classId} before checking existing reviews. Every review creation/edit/status change in the updated client transactionally compares and advances its revision alongside the review write. If another tab or device changed reviews in between, the stale submission is rejected with a request to check again. Transaction retries retain the original revision and cannot silently reuse an outdated confirmation. The state document is never a held lock, so failed or abandoned forms do not leave a classroom locked.

This coordinates updated application clients. It is not a global uniqueness constraint: intentional rounds are allowed, and older clients or direct authorized API writes that bypass the publication protocol are not serialized by it. Deploy matching frontend/rules together and retire old clients. No automatic merging or deletion occurs.

## Stored state

classReviewPublicationState/{classId}: classId (string class reference), revision (positive integer increasing by exactly one), updatedAt (server timestamp). Only the owning approved teacher can get or create/update this state for an active class. List and delete are denied; students have no access. No learning content or student data is stored here.

## Report scope

Activity reports describe current active members in the loaded roster, show displayed and eligible recipient counts, exclude former members, and explain that later joiners are included for shared class goals. A personal review with a former member has no current eligible recipient; it is not described as an empty classroom. Unknown results are not zero scores. This is a current-membership snapshot, not a historical enrollment-at-publication report.

## Validation

- teacher-review-publication.test.cjs: creation, cancellation, intentional round, saved draft publication, intervening revision, failed reads and changed membership.
- teacher-review-publication-emulator.cjs: rules compilation, owner access, exact revision increments, stale updates, student access and mismatched class rejection.
- Existing responsive conflict and save-recovery browser suites passed.

No production deployment. The frontend requires the matching publication-state rules, in addition to the earlier lifecycle rules awaiting publication.
