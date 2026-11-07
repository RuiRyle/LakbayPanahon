# Student–teacher logic audit — 6 November 2026

Scope: class invitation and membership, publication, prerequisite access, class-goal and personal-review completion, explanations, feedback, recovery, and ended activities. Admin polish is outside this pass. No production accounts, records, rules or Hosting releases were changed.

## Verified fixes

1. **Creation retries cannot overwrite existing activities or announcements.** Both single-item and multi-student review creation check the destination IDs inside the transaction. An existing ID rejects the operation without writes. A batch collision cannot partially assign other students. Normal edits still require the version that the editor opened.
2. **Review completion keeps the first passing date.** Later passing retries still update the latest score but cannot turn an on-time completion into a late completion. The qualifying result must belong to the same student, mission and chapter, after assignment and within any ending cutoff.
3. **Impossible completion dates do not establish completion.** Future and nonpositive dates produce an unavailable result. Existing undated legacy completion remains visible for active class goals with unknown deadline timing; ended activities still require dated evidence.
4. **Missing evidence is not presented as student failure.** Unknown review or class-goal evidence shows Progress unavailable, suppresses definite aggregate completion counts, and asks for refresh instead of claiming a next unfinished task. Independently verified work remains available.

The create-only transaction reads need a matching rules adjustment: approved active teachers can get a nonexistent assignment/review/announcement ID. This does not permit reading another class's existing record or let students probe unused IDs. The permission follows the existing missing-record pattern used for teacher feedback.

## Checks completed

- 54 Node test entries passed, including publication concurrency/replay, atomic review batches, completion deadlines, class joining/session changes, prerequisites, reports, support policy and classroom return routes. Some entries execute multiple assertions.
- Student classroom browser fixture passed, including new missing-review and future-completion cases, join/leave, safe text, draft isolation, feedback revision checks, recovery and account isolation.
- Teacher browser fixtures passed at 390px and 1440px: 12 conflict assertions, 16 classroom mutation recovery assertions and 30 publication recovery assertions.
- 129 teacher/student integration checks passed against isolated Firestore rules, covering roles, ownership, invitation rotation/revocation, actual student-written attempts and rewards, feedback, archive/restore and removal/leave access revocation.
- Local lifecycle suite passed 27 checks covering closed/withdrawn history, timestamp forgery rejection, terminal immutability, retained guidance and membership revocation.
- Local private help suite passed 16 permission/lifecycle checks; private review and invitation suites also passed.
- Local publication-state suite passed, including new missing-ID reads and cross-class/student denial cases.
- Actual browser/Firebase SDK walkthrough passed 42 checks: teacher assigns work, student receives it, fresh review evidence, private explanations/help, teacher guidance, progress/report updates, activity closure/withdrawal, retained student history and mobile account settings.

The actual SDK walkthrough used synthetic saved quiz evidence; it is not proof of server-side grading or a human learner understanding the lesson. Its staged package preceded the final unavailable-state presentation refinement; that refinement passed the current-source classroom browser fixture. Benign browser view-transition aborts were filtered by the existing walkthrough; it reported no unexpected JavaScript exceptions.

## Release boundary

Publish the reviewed rules and matching frontend together. Deploying the new create-only transaction code against older rules will deny new publication because the transaction cannot read a missing destination record. Existing local activity-lifecycle queries also require their corresponding rules. This audit does not authorize publication.

After publication, repeat a bounded real-account teacher/student cycle and verify production indexes, email delivery, account/session persistence and error handling. Local fixtures and emulators do not establish production availability, AI-provider suitability, privacy operations or educational effectiveness. These remain separate release requirements. No claim of zero remaining defects is made.
