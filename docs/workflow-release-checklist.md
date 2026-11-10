# Student, teacher and administrator completion checklist

## Current reconciliation — 10 November 2026

Latest core classroom acceptance: [ten real local integration checks pass](validation/classroom-final-local-2026-11-10.md), including the actual join confirmation, fresh assignment-linked trusted result, no duplicate XP, teacher reporting, guidance and acknowledgement. Cleanup and backup are recorded. Extended lifecycle/network edges and the broad teacher/admin regression failures remain open. No production release occurred.

Use the [current project finalization checklist](project-finalization-checklist.md) as the active finish list. The accepted 9 November foundation remains valid within its scope. Later one-class enrollment, dialogs, Decision Records and separate classroom submissions require their specific regression checks. Current signed-in join/submission integration and broad teacher/admin regression remain open. Deployment and billing remain deferred. Older queues below are historical and must not be counted as an additive backlog.

## Active local finalization status — 9 November 2026

The owner has confirmed the three-role interactions work and explicitly deferred deployment. **Do not continue hosting setup, create accounts/credentials, or repeat approved UI redesigns.** Preserve the reported manual acceptance. The older ordered queue below is historical where superseded by this section.

The current finalization audit is [recorded here](validation/final-local-finalization-review-2026-11-09.md). Twenty-four focused suites passed: 175 TAP assertions and 15 custom assertions, with no failures. These cover student sessions/recovery, teacher policies/onboarding, administrator decisions, exports and AI-client boundaries. They are not a fresh browser run of every page.

| Requirement | Current evidence | Remaining local work |
|---|---|---|
| Connected Student/Teacher/Administrator workflow | Owner reports successful manual walkthrough; local browser/Rules evidence retained | Reopen only for a reported defect or relevant change |
| Assessment grading/replay/rewards | Local secured browser and backend evidence; latest signed HTTP regression passed | Preserve accepted core; no new reward implementation |
| Administrator review and separate activation | Final local acceptance plus fresh policy/recovery tests passed | Session-scoped recovery and page-scoped search remain disclosed limits |
| Local persistence | Backup/restore verified separately | Back up before stopping; no automatic persistence guarantee |
| Independent learning and optional classroom | Implemented policy and prior interaction evidence | Preserve independence; avoid classroom requirements for personal progress |
| AI assistance | Client/request/parser regression passed | Live generated responses and study-specific recommendation quality are not verified by these tests |
| Content/evaluation | Existing content validation passed; study scope recorded | Subject-review and participant-evaluation completion require actual reviewer evidence |
| Every lesson in the final catalog | Bounded browser and content checks available | Full final-catalog browser coverage is not claimed; owner walkthrough scope was not itemized |
| Real email and hosted behavior | Deferred external acceptance | Not a reason to deploy during local finalization |

No confirmed functional failure was found in this focused audit, so no speculative application changes were made. This is a locally accepted working foundation, not an assertion that all study deliverables or future release gates are complete.

Evidence reconciled 7 November 2026 (Asia/Manila). This is the consolidated remaining-work queue, not a declaration of production readiness. Existing dated validation reports remain the evidence for their particular builds and environments.

## Current decision

9 November 2026: the owner has chosen **no billing**. Complete the integrated local delivery first using Auth, Firestore and secured assessment Functions emulators. A public deployment of the complete secured application remains unverified; static hosting alone does not close that requirement. The [managed-backend decision](managed-backend-decision.md) is historical planning, not the active billing direction. Workers/hosted pilot remain NO-GO.

Immediate queue: verify `node tools/start-local-emulator.cjs --secured`, complete an authenticated student learning/reward journey on that same package, rerun all-role acceptance, then implement and verify local persistence/backup. Preserve existing running sessions. Real email delivery, optional AI availability, content review and participant evaluation remain separate open items. Local completion must not be described as public deployment readiness.

Study scope correction: [revised study requirements](revised-study-scope.md) govern this queue. Independent student learning is primary; classrooms are optional; teachers monitor/facilitate; admins manage accounts, verify teachers and oversee platform activity. Core content creation/editing/publication is outside both dashboard roles. Earlier planning that assigned it to admin was incorrect.

Student and teacher features have substantial implemented coverage. Stop adding speculative features and repeated visual redesigns; prioritize reproducible defects and acceptance gaps. Admin requirements and local UI may be prepared independently. Secured assessment/reward integration still requires accepted backend evidence.

The current Workers REST transport is **NO-GO**. Its final concurrent submission group failed and one request used 105 Firestore REST calls. Earlier successful runs do not supersede the final result. Hosted acceptance, production deployment, billing and infrastructure/security changes are not authorized by this checklist. Stage 0 and the isolated experiments remain unchanged.

## Evidence already available

| Area | Evidence status | Scope and limit |
|---|---|---|
| Adaptive selection, stale draft protection, failed/passing quiz rewards, replay and unlocking | Recorded bounded production pass | [Priority 2 report](validation/priority-2-deployment-report-2026-11-07.md). Disposable synthetic identity; does not certify the newer secured backend or every screen. |
| Teacher/student interaction, invitations, membership and private support | Recorded local acceptance | [Interaction acceptance](validation/teacher-student-acceptance-2026-11-06.md). Synthetic quiz evidence; not a grading or learning-effectiveness study. |
| Secured assessment transport | Failing final local proof | [Transport review](validation/priority-3-workers-transport-review-2026-11-07.md). Hosted pilot/production remain blocked. |
| Restricted publication authority | Historical infrastructure experiment, outside admin workflow | [Authority review](validation/priority-3-workers-restricted-authority-review-2026-11-07.md). Does not establish an admin CMS requirement or authorize its implementation. |
| Assignment prerequisite policy, review evidence chronology, hint evidence and targeted routes | Fresh local unit pass | 21 assertions across the four suites listed below. No Firebase traffic. |

## Ordered remaining work

Status vocabulary: **blocked** requires an architecture/external decision; **unverified** needs current evidence; **recorded pass** has dated evidence and needs rerun only after relevant changes. A historical pass is not a current production guarantee.

| Order | Work item | Status | Required acceptance evidence |
|---|---|---|---|
| 1 | Decide and accept the secured assessment backend | Blocked | Supported identity/attestation and transport, bounded resource use, concurrent duplicates, lost acknowledgements and ambiguous commits, one reward, preserved historical progress; integrated measurement on the chosen architecture. Do not silently revert to browser grading. |
| 2 | Run a current student local browser journey | Unverified for final candidate | Lesson completion, fail, feedback, targeted practice, retry, resume/reload, unlock, level/reward and game ending. Each saved result and next action must match actual state. Record exact source/build and failures. |
| 3 | Run a current two-role classroom journey | Recorded local pass; final candidate rerun pending | Create two classes, verify unique invitation ownership, join only the intended class, post announcement, assign whole-class learning and individual review, request help, give guidance, student sees it, archive/leave revokes access. |
| 4 | Check assignment lifecycle edge cases | Policy subset passed; integrated states unverified | Locked mission points to an earlier prerequisite without bypass; completed mission clearly offers review; draft/closed/withdrawn and deadlines have accurate actions/history; private assignment invisible to other students. |
| 5 | Check account recovery and teacher onboarding | Unverified for final candidate | New teacher has clear application/pending/approved/rejected states; unauthorized dashboard access denied; password reset and verification delivery checked separately on authorized real setup; expired session preserves safe unsaved text and offers recovery. |
| 6 | Fix targeted usability defects | Unverified for final candidate | 390px and desktop, keyboard focus, readable lesson/quiz feedback, long names/messages, empty class, loading failure/retry. Fix observed issues rather than redesigning all pages again. |
| 7 | Complete scoped content and participant evaluation | External review pending | Verify selected content with subject reviewers separately from application content permissions. Evaluate functionality, usability, satisfaction and acceptance with selected participants. Long-term retention or superiority studies are not required by the supplied study; do not claim them without evidence. |
| 8 | Integrate admin and run all-role acceptance | Pending | Approved admin scope below, least-privilege access, audit events, recovery and cross-role regression on the accepted backend. |

## Admin implementation boundary

Prepare page organization and existing-code inventory after the student/teacher local acceptance pass. Use existing services where suitable; an attractive screen is not proof that its privileged action is safe.

| Admin responsibility | Required behavior before acceptance |
|---|---|
| Teacher applications | Review submitted revision, approve/reject with reason, prevent stale decisions, show status consistently to applicant, audit reviewer/action/time. |
| Account access | Enforce current role/status on privileged operations; prevent accidental self-lockout; retain audit trail. Never expose provider credentials or raw database administration in the browser. |
| Role boundary | No core lesson/question creation, editing or publication in the admin or teacher dashboard. Maintain existing curriculum/reward write restrictions. |
| Operational overview | Show real failures and pending work with timestamps and unavailable/empty distinctions. Avoid fabricated counts or treating missing data as zero. |
| Audit and recovery | Trace operation IDs and outcomes without exposing tokens or student answers; uncertain outcomes require reconciliation, not blind reward or publication retries. |

## Fresh local verification

9 November update: [secured local launch smoke](validation/local-secured-launch-review-2026-11-09.md) passed all four endpoint denial checks and authenticated catalog grading/resume/replay. Full browser study flow and persistence remain open. The endpoint readiness guard still needs a fresh-launch verification.

9 November browser follow-up: [result recovery review](validation/local-study-browser-review-2026-11-09.md) records the fixed server-attempt reference bug, passing and failing quiz-result reload, unchanged XP and explicit retry. Ten three-role browser checks passed on `build/student-web-SwUlGX`. Remaining engineering acceptance includes new-student lesson interactions/first unlock, classroom regression against the protected rules, and backup restore. Study content review and participant evaluation remain external work; no public deployment readiness is claimed.

9 November continuation: [backup/restore](validation/local-backup-restore-review-2026-11-09.md) passed, including preserved account login and XP 40 and endpoint readiness before serving the restored website. Six classroom browser/SDK checks passed against restored protected rules. A fresh synthetic student's direct-call catalog test passed first completion, replay at XP 40 and next-mission issuance. Remaining: full lesson interaction walkthrough, broader final classroom edge-case acceptance, content/subject review, participant evaluation and final delivery handoff. Snapshot backup is manual; no automatic continuous persistence is claimed.

Executed separately with Node on 7 November 2026; all exited zero:

- `node tests/assignment-readiness.test.cjs`: 4 passed.
- `node tests/adaptive-review-evidence-dates.test.cjs`: 11 passed.
- `node tests/practice-hint-evidence.test.cjs`: 1 passed.
- `node tests/learning-topic-navigation.test.cjs`: 5 passed.

The initial combined `node --test` invocation could not spawn subprocesses under the sandbox (`EPERM`). Running each suite directly succeeded; this was a runner restriction, not an application failure. These tests do not establish current browser, emulator integration or production acceptance.

The existing `node tests/story-browser.cjs` browser regression also passed after allowing the local headless Chrome process (the first sandboxed launch returned `EPERM`). Covered: interactive lesson, previous/next, completion/layout, load and empty-scene retry, session recovery, hostile navigation/text and unsafe image URLs. This is a synthetic story fixture, not the complete student journey or authenticated Firebase acceptance.

## Finish rule

Provider artifact update: [7 November packaging/identity review](validation/node-provider-packaging-identity-review-2026-11-07.md). Official pinned packager generated one ZIP; extraction passed module isolation, 16 transport tests and six grading/replay checks on Node 22. Identity/Free secret isolation, hosted security/quotas and operational gates remain unaccepted. No keys, accounts, deployment or billing action was taken.

Standalone Node 22 update: [7 November review](validation/node-standalone-node22-review-2026-11-07.md). Clean locked installs, zero outside-package initialization modules, 16 transport tests and all 18 full proof groups passed on Node 22.23.4 with NODE_PATH unset; both 30-user waves passed. Provider-generated artifact/Linux/runtime identity/hosted/quotas remain open. No deployment, credentials or billing action was taken.

Node transport follow-up: [7 November local validation](validation/node-adapter-validation-2026-11-07.md) passed after experimental credential-header hardening. Seventeen adapter/package tests, actual web-SDK start/resume and 18 full proof groups passed; both 30-user waves saved successfully. Accepted service/Stage 0 remain unchanged. Node 22, standalone packaging, real credentials/attestation and hosted/free-quota readiness remain open; no deployment/billing approval is implied.

Auth link update: [7 November checks and final gates](validation/auth-links-and-final-gates-2026-11-07.md). Eight emulator code-redemption/password checks passed and the temporary identity was deleted. Real email delivery, hosted action links and expiry remain unverified. Next substantive gate is the secured-backend decision, followed by authorized real-environment Auth/release checks and scoped study evaluation; no additional dashboard feature is implied.

Fixed-package browser update: [7 November three-role walkthrough](validation/cross-role-browser-local-2026-11-07.md) passed all 10 actual browser/SDK/emulator checks on `build/student-web-EYkZzj`, with tracked synthetic fixtures cleaned. Teacher UI submission, admin UI approval, subsequent teacher access, independent student dashboard and deactivation/login denial were exercised. This closes the specifically scoped local three-role approval/access walkthrough; it does not close assessment/backend, real email or hosted release gates.

Cross-role access update: [7 November acceptance](validation/cross-role-access-acceptance-2026-11-07.md). Qualification (53), admin (44) and classroom (129) emulator assertions passed, plus 30 auth-guard unit assertions. This establishes local permission/data-flow coverage, not a newly executed three-role browser journey or secured-backend acceptance. Remaining: exact-package all-role walkthrough, actual email delivery/link redemption, backend decision and scoped participant evaluation.

Admin overview update: [7 November snapshot](validation/admin-overview-2026-11-07.md). On-demand bounded queue/own-decision view implemented with timestamp, partial labels and stale recovery. Eighty-two browser viewport assertions, three unit tests and local query checks passed. This is administrative oversight, not live service-health/usage monitoring. Next: integrated admin/teacher/student verification/access acceptance.

Teacher-review panel update: [7 November polish](validation/admin-teacher-review-polish-2026-11-07.md). Structured applicant details and verification/decision steps implemented locally; 74 viewport assertions and 14 policy/recovery tests passed. Sign-in-only admin provisioning boundary recorded. Next: bounded platform oversight, without content management.

Admin decision recovery update: [7 November review](validation/admin-decision-recovery-2026-11-07.md). Confirmed saves remain distinct from refresh failures; unconfirmed outcomes offer read-only receipt checks and block repeat submissions. Seventy browser viewport assertions and nine unit tests passed. Cross-reload recovery remains a documented limit; deployment/backend readiness is unchanged.

Admin layout update: [7 November refinement](validation/admin-layout-refinement-2026-11-07.md). Responsive directory/detail hierarchy and selection guidance implemented; 58 browser viewport assertions passed, local package references valid. Next: admin save/refresh outcome recovery. Deployment remains held.

Admin baseline update: [7 November review](validation/admin-baseline-refinement-2026-11-07.md). Existing account-management baseline verified locally; unsaved moderation/qualification decisions now have discard protection. Three unit tests, 50 browser viewport assertions and 44 permission checks passed. Next: account page hierarchy and visual refinement. This does not close final all-role/backend acceptance.

Account update: [7 November onboarding/recovery review](validation/account-onboarding-recovery-review-2026-11-07.md). Registration/policy/auth suites passed 66 assertions; reset recovery passed 3 new tests; unified setup/application and login startup browser checks passed within their documented scopes. Added local protection against overlapping password-reset requests. Actual email delivery/link redemption remain unverified. Next: [existing admin workflow baseline and refinement](admin-workflow-refinement-plan.md).

Teacher/student interaction update: [7 November local review](validation/teacher-student-local-review-2026-11-07.md). Current two-role browser/SDK walkthrough passed 42 checks; invitation, classmates and private support/review permissions also passed. The current key classroom modules matched served source. This refreshes order 3 local evidence; it does not establish hosted/backend acceptance or actual email delivery. Next: account onboarding/recovery checks, then admin code/service inventory.

Student component/browser regression update: [7 November local review](validation/student-journey-local-review-2026-11-07.md). Seven suites passed, including all 18 broader page/viewport cases after repairing a missing real dependency in the mission fixture. Full authenticated journey and final backend acceptance remain pending; this does not close order 2 by itself.

Proceed from student/teacher refinement to admin implementation once local journey defects are fixed or explicitly recorded as backend-blocked. Release to students only after the secured backend gate, final integrated acceptance and authorized operational checks pass. Keep learning-effectiveness conclusions separate from engineering completion.
