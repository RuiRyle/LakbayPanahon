# Cross-role verification and access acceptance

7 November 2026 (Asia/Manila). Local emulator permission/integration acceptance using synthetic identities and the current `firestore.rules`. No production request, deployment, billing, provider account or Workers experiment change.

All three suites ran sequentially against loopback `127.0.0.1:8180` in isolated `demo-lakbay-teacher`. Each resets/seeds that test project; they do not reset the running classroom website's separate `demo-lakbay-local` data. Current local rules were loaded into the synthetic project before execution.

| Suite | Result | Evidence |
|---|---|---|
| `teacher-qualification-emulator.cjs` | 53 passed | [Qualification](cross-role-qualification-2026-11-07.json) |
| `admin-workflow-emulator.cjs` | 44 passed | [Administration](cross-role-admin-2026-11-07.json) |
| `teacher-workflow-emulator.cjs --qualification-regression` | 129 passed | [Classroom](cross-role-classroom-2026-11-07.json) |

Total: **226 local emulator assertions**. Protected-page guard unit suite additionally passed 30 assertions. No application defect surfaced in this pass; no application or Rules fix was made merely to obtain passing results.

## Confirmed boundaries

- Teacher cannot forge email verification, self-approve or use a stale/edited application approval for classroom access.
- Complete approval pairs account/application/audit/review updates. Qualification revision requests, resubmission and decline remain consistent with access.
- School-affiliation approval verifies identity/institution without incorrectly requiring PRC licensure; licensed/endorsed routes retain their specific checks.
- Admin status changes require matching audit records. Audit history is immutable; client self-promotion/admin creation, role/XP/email manipulation and curriculum editing are rejected.
- Deactivation revokes protected access. Reactivation retains learner records. Teacher access to a learner remains constrained by class ownership and current membership.
- Joining uses class-specific invitations. Code rotation/revocation, removal, leaving and archiving affect access; personal learning progress remains.
- Teacher feedback/private follow-up does not grant extra XP or permit student-score edits. Neither teacher nor admin becomes a core content editor.

## Important scope limit

These suites test Rules and cross-role data operations through local REST fixtures; they are not a single newly executed browser journey with admin, teacher and student sessions. Some classroom scoring fixtures exercise the existing legacy client protocol. They do not certify the held secured assessment transport or alter its NO-GO finding. Earlier current-source admin browser and two-role SDK results are complementary evidence, not interchangeable with hosted acceptance.

## Remaining finish line

1. Final authenticated all-role walkthrough on the exact selected package/environment, including real UI teacher approval and the teacher's next sign-in. Local component/Rules coverage is strong; do not substitute it for that integrated check.
2. Actual verification/reset email delivery and link redemption in the intended environment remain unverified.
3. Accept a supported secured-assessment backend and verify concurrency/recovery/resource bounds before student deployment. The current Workers transport remains NO-GO; no billing or infrastructure decision was made here.
4. Reconcile final implementation documentation with the supplied study, then complete scoped participant evaluation (functionality/usability/acceptance). No long-term superiority claim is required.

Admin account access, qualification review, recovery, layout and bounded overview now have local implementation and recorded regression evidence. Continue with concrete acceptance gaps rather than expanding to content management or repeatedly adding speculative features.
