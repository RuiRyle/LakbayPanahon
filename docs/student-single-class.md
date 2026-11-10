# One active classroom per student

Updated 10 November 2026: the renewed Firebase login works. The scoped one-class rules are now published and read back. The one existing active membership received its reservation; no multiple-class students were found and no memberships or learning records were deleted. [Publication evidence](validation/student-single-class-publication-2026-11-10.json).

The exact released candidate passed six Rules API checks without compilation issues, and 11 local client checks pass. The candidate preserves three unrelated teacher-rule additions that exist only locally; they were excluded from this publication. Frontend Hosting was not deployed. Use the updated local frontend for joins; old hosted code does not yet write the required reservation and will fail closed until updated. Real signed-in joining/concurrent-tab acceptance remains separate from synthetic/local verification.

The preparation and blocked-login notes below are historical; the later publication evidence supersedes their activation status. Existing membership reconciliation and reservation seeding are complete for the inspected database.

Students may learn independently or belong to one class. To change classes, leave the current one first. Leaving preserves personal lessons, quizzes, XP and collections. Archived class memberships continue occupying the slot until the student leaves or the teacher removes membership. No existing membership was deleted by this work.

The join client queries the student's server memberships and rejects a different active membership. Joining uses one transaction to read/write `studentClassSlots/{uid}` and the deterministic membership record. An existing reservation cannot move while its former membership exists. Leaving and teacher removal delete membership as before; an unused reservation can then be replaced at the next join. Concurrent transactions contend on the same reservation document.

The candidate Firestore rules require a paired reservation for membership creation and a paired membership for reservation writes. Students cannot write another student's reservation or delete their own occupied reservation to bypass the limit. These rules have not been compiled/evaluated or activated: the Rules API check stopped because the stored Firebase CLI credentials expired. Run `firebase login --reauth` interactively before the remaining steps. No credential was printed or changed.

## Completed checks

- 11 client tests pass: existing invitation/session validation, duplicate join, another membership, stale initial query, paired writes and joining after leave/removal.
- My Class Chrome regression passes with mocked Firebase: join/leave, assigned work, prerequisites, error recovery and session isolation.
- JavaScript syntax and scoped whitespace checks pass.

## Required before activation

1. Reauthenticate the existing Firebase CLI session.
2. Inspect existing `classMembers` and prepare an owner-reviewed migration. Seed `studentClassSlots/{uid}` for every student with one existing active membership. For students with multiple existing memberships, have the student/operator identify which to keep; do not pick or delete memberships automatically. The UI keeps existing class cards accessible so students can leave extras. A reservation cannot retroactively discover arbitrary legacy membership documents; this reconciliation is necessary to close that bypass before claiming database-wide enforcement.
3. Compile/evaluate the candidate: `node functions/verify-single-class-rules.cjs --verify`. Prepared synthetic cases cover paired reservation, occupied-slot denial, released-slot reuse and ownership. Add new membership/concurrency integration checks against the reviewed release as appropriate.
4. Compare active rules with local source and publish only the reviewed single-class scopes, with backup and drift protection. Do not overwrite unrelated live rule changes.
5. Verify first join, rejection of a second class (including simultaneous requests), leave/rejoin, teacher removal, denied direct membership writes and preserved progress. Rebuild/deploy frontend if using Hosting.

Until the new rules are activated, the new local client will fail closed when attempting its reservation write against old rules. Existing class reading and leaving do not require this new collection. Do not describe the prepared client as an activated release or switch to a weaker client-only fallback.
