# Admin workflow refinement plan

7 November 2026. Inventory of the existing account-management entrypoint and its directly imported services; not a full-repository security certification.

Scope correction: follow [the user-confirmed revised study](revised-study-scope.md). Admin manages users, teacher verification, account status and platform oversight. Teachers facilitate optional classrooms. Neither role creates or publishes core learning content. Earlier suggestions to add content-review navigation were incorrect and are superseded here.

## Already implemented

- `pages/admin-dashboard.html`: account filters, submitted-application queue, paginated accounts, selected account details, moderation reason and decision history. Currently one account-management page, not a full operational overview.
- `js/admin-workspace.js`: selection, pagination, loading/error state, auth-session generation and teacher-review mounting.
- `js/admin-accounts.js`: current admin check, bounded account/application/history reads and moderation operations.
- `js/teacher-application-review.js`: transactional actor check, expected application/profile version, route-specific review checks, account/application decision and audit writes, private evidence cleanup.
- `js/teacher-application-policy.js` and the mounted review panel provide shared review rules/UI. Existing admin unit/browser/emulator suites should be run before changing behavior.

## Next implementation sequence

Fixed-package acceptance: [three-role browser walkthrough](validation/cross-role-browser-local-2026-11-07.md) passed 10 actual UI/SDK/emulator checks with clean fixture removal. Core local admin approval/access flow is ready for review within that scope. Remaining gates are backend acceptance, real email-link checks, authorized release verification and scoped participant evaluation; do not expand admin scope to fill those infrastructure gaps.

Cross-role update: [verification/access acceptance](validation/cross-role-access-acceptance-2026-11-07.md) passed 226 emulator assertions and 30 guard tests. Admin local implementation has substantial coverage. Next work is final exact-package browser acceptance and documented external/backend gates, not new content-management features.

Overview update: [bounded administration snapshot](validation/admin-overview-2026-11-07.md) completed locally. On-demand submitted applications and own audit decisions; capped and accurately labeled, stale-safe and cleared on sign-out. Three unit tests, 82 browser viewport assertions and local query-permission checks passed. Next: integrated verification/access-change acceptance across roles.

Teacher-review interface update: [7 November polish](validation/admin-teacher-review-polish-2026-11-07.md). Labeled applicant facts, verification/decision fieldsets and route-specific checks passed 74 viewport assertions plus 14 policy/recovery tests. Admin remains sign-in-only with trusted account provisioning. Next: scoped platform-administration overview using permitted data.

Save recovery update: [7 November decision recovery](validation/admin-decision-recovery-2026-11-07.md) implemented locally. Exact audit-record confirmation, preserved unconfirmed forms and refresh-only recovery passed 70 viewport assertions plus targeted unit tests. Next: teacher-review interface clarity and scoped platform oversight. Content management remains excluded.

Layout update: [account-page refinement](validation/admin-layout-refinement-2026-11-07.md) completed locally. Fixed the unused sidebar offset, organized directory/details and improved selected-account navigation; 58 viewport assertions passed. Next: review committed-save versus refresh-failure messaging and uncertain-write recovery before adding further admin features.

Baseline update: [7 November admin review](validation/admin-baseline-refinement-2026-11-07.md). Three unit tests, 50 browser viewport assertions and 44 emulator permission checks passed. Added unsaved-decision protection and qualification-save navigation blocking. Next is the account page hierarchy/visual refinement; no content publication implementation is authorized by this update.

1. Establish admin baseline: run existing account-policy and workspace browser fixtures, then isolated permission tests. Record defects before redesign.
2. Organize the account workflow: distinguish pending applications from existing account access management, use clear selected-account context, preserve unsent decisions and handle stale/uncertain writes explicitly. Confirm existing behavior before adding code.
3. Refine overview and navigation using the established student/teacher design system. Show only measured real counts; label unavailable data. Do not fetch the entire learner history merely for dashboard decoration.
4. Validate reviewer decisions and cross-role effects: no self-granted admin privileges, stale review rejection, teacher approval/revision/access states and retained learner records. Sensitive details remain private.
5. Define bounded platform-activity monitoring and administrative recovery using actual available data and least-privilege access. Do not create a content-management section or grant curriculum/reward editing permissions. Infrastructure publication experiments are separate from this role's workflow.
6. Run final admin/teacher/student acceptance and targeted mobile/keyboard/readability checks on the resulting candidate.

Admin local refinement is authorized by the ongoing workflow request. Hosting, credentials, provider accounts, security configuration and billing remain outside this local refinement. No estimate or checklist implies the failed Workers transport is ready.
