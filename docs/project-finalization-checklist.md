# Current project finalization checklist — 10 November 2026

Reconciled against the accepted 9 November local baseline and subsequent changes. Old unchecked entries in the large student checklist are historical evidence, not an additive count of missing features. Preserve the owner's earlier successful three-role walkthrough and reopen the flows affected by new changes.

**Active direction:** finish integrated local delivery. Billing and deployment remain deferred; this checklist does not authorize either.

**10 November follow-up:** The [current local classroom core](validation/classroom-final-local-2026-11-10.md) now passes ten actual SDK/browser/trusted-grading checks: joining, second-class denial, separate solo/class completion, zero duplicate XP, teacher result, guidance and read acknowledgement. The extended edge cases listed below remain open; the core join/submission path no longer lacks integration evidence. Temporary data cleanup is verified and a new local backup is recorded. Broad teacher/admin regressions are the next priority.

## Existing foundation

- [x] Student lessons, missions, quizzes, adaptive recovery, progress and rewards implemented; local secured grading/replay evidence recorded.
- [x] Teacher classes, invitations, assignments, private help, feedback/reviews and reporting implemented; prior teacher/student interaction acceptance recorded.
- [x] Administrator qualification review, separate account activation, decision records and uncertain-save recovery implemented; earlier local acceptance recorded.
- [x] Local backup/restore and endpoint startup checks have dated passing evidence. Persistence requires explicit backup/restore.
- [x] Classroom-submission changes pass 26 focused local checks and the My Class mocked browser check.
- [x] Local join-rule mismatch repaired; 18 local checks and My Class/dialog fixtures pass. A real signed-in join against the restarted runtime remains separate.
- [x] Shared dialogs and Decision Records redesign implemented; focused browser fixtures pass. Broad teacher/admin regression is not yet passed for these changes.

Evidence: [9 November review](validation/final-local-finalization-review-2026-11-09.md), [backup/restore](validation/local-backup-restore-review-2026-11-09.md), [earlier teacher/student acceptance](validation/teacher-student-local-review-2026-11-07.md).

## Required local engineering finish

- [ ] **1. Verify joining on the actual current local runtime.** Back up an existing session before restart. Use matching frontend/backend/rules. Verify teacher code → student confirmation → membership/roster, reject a second class, then test leave/removal and preserved personal progress. The [join repair](validation/class-join-repair-2026-11-10.md) fixes the secured local rules missing reservation permissions. The user's browser URL/exact error remains unconfirmed; no local website/hub endpoint was reachable during the last probe.

- [ ] **2. Verify separate classroom submissions with both local roles.** Teacher publishes → student joins → old solo completion stays unsubmitted → student takes a fresh assignment-linked quiz → teacher sees the class result → feedback reaches student. Include revised assignments, closure, removal/rejoin, solo/class cache isolation, duplicate submission and zero duplicate XP. [Source implementation and limits](validation/classroom-submissions-2026-11-10.md). The matching-runtime round trip remains open; no progress reset is required.

- [ ] **3. Resolve teacher/admin regression failures and freeze a matched build.** Shared dialogs changed confirmation timing. Focused student checks pass, but the attempted broad teacher fixture stopped at dashboard-formation assertions and the admin fixture at quick-action geometry after view switching. Determine actual product defects versus stale assertions, fix and rerun. The old passing reports do not certify later edits. Include destructive-action Cancel, unsaved edits and Decision Records filter/detail/history/export. [Recorded limits](validation/themed-dialogs-2026-11-10.md).

- [ ] **4. Complete final lesson/activity coverage.** Structural checks and bounded scenarios exist, but a complete current-catalog interactive sweep is not recorded. Verify remaining lesson activities, images, explanations, quiz/practice routes, chapter continuation, locks and ending. Reuse valid evidence rather than rerunning everything. Content mapping alone does not establish teaching adequacy.

## Required feature and study acceptance

- [ ] **5. Resolve actual Bayani acceptance.** The local launcher does not run AI. Mocked tests do not establish working genuine responses, historical accuracy, recommendation quality or suitability for intended minors. Resolve the provider/account/data-handling decision and perform a genuine response review before marking AI support fully accepted. Do not silently switch the existing connection or activate paid services.

- [ ] **6. Record subject review and participant evaluation.** Obtain actual history/Grade 5 reviewer findings and the study's functionality, usability, satisfaction and acceptance results. Observe learner understanding of instructions, feedback and next steps; fix demonstrated issues. Do not invent participants, approval or learning gains. Use the [prepared playtest procedure](validation/grade5-student-playtest-plan.md) and agreed study scope.

## Delivery and real-user boundaries

- [ ] **7. Assemble the final local handoff after changed flows pass.** Include launch commands, runtimes, account/environment distinctions, backup/restore procedure, accepted build/source hashes, results and known limits. Verify final restore again only if relevant storage/launcher changes invalidate earlier evidence. A static page or old frozen package is not the full secured system.

- [ ] **8. Close operating requirements before public student use.** Assign the operator/support contact, retention and school/guardian arrangements, final notices and a verified data-request/removal process. Real email delivery/link redemption, device/audio/print and intended hosted authentication/security behavior need their own evidence where relevant. Export alone is not a deletion service. These requirements do not authorize inventing a policy or deploying now.

**Deferred:** production backend/attestation/permissions, coordinated cloud rules/frontend release, public email/domain behavior and monitoring/recovery. Revisit after an explicit release decision. Historical cloud/Workers NO-GO reports do not invalidate accepted local operation.

## Next action

Complete items **1 and 2 on the same current local build**, then resolve item 3 before declaring the revised application locally finalized. Avoid expanding features or repeating broad redesigns while these concrete gaps remain.

This reconciliation read checklists and current change/evidence records. It did not run a new full suite, access learner records or publish anything. No completion percentage or raw count of historical unchecked boxes is asserted.
