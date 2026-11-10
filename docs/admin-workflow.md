# Administrator account workflow

## Current study-aligned navigation (10 November 2026)

The scope authority is [Revised study scope and role boundaries](revised-study-scope.md). Administrator functions are user management, teacher verification, account-access decisions, bounded saved-activity oversight and decision recovery.

| Page / entry | Actual behavior |
|---|---|
| Overview | Shows bounded loaded queues and the signed-in administrator's saved decisions; opens the relevant review. Counts are not database-wide totals. |
| Teacher Applications / Teacher Verification | Reviews submitted qualifications. Approve & Activate confirms one guided operation, with separate audited qualification and activation transactions. Changes requested and decline preserve reasons. Missing submissions cannot be approved. |
| Accounts / Account Access | Finds student and teacher accounts through bounded role/status queries, current-page search and pagination. Selected accounts expose access changes, confirmation, required reasons and saved history. Teacher activation still requires approved current qualifications. |
| Decision Records | Searches/filters/exports the loaded administrator-owned snapshot. Saved actor, status, timestamp and reason are audit evidence; current profile identities are explicitly labelled as current. |
| Administration | A task hub with four real destinations: Teacher Verification, Account Access, Decision Records, Account History & Recovery. It does not present service-health or privileged-security management as clickable capabilities. |
| Account History & Recovery | Opens Accounts so the operator can find the affected account. An actual uncertain decision must be reconciled with its saved receipt before another write. Contextual controls remain visible only when a selected or uncertain decision exists. |

Administrative activity monitoring means supported saved decision records, not live service-health monitoring. Security boundaries and environment are informational facts. No public role promotion, user deletion, curriculum editing, XP/grade edits or infrastructure/billing controls are offered.

The sections below preserve earlier implementation/publication history; dated validation evidence is not a claim of current deployment or a replacement for current local acceptance.

**Qualification update:** Teacher activation now requires the [submitted qualification review](teacher-qualification-workflow.md), including a verified-email submission and recorded identity, institutional and route-specific checks. Use **Review Submitted Applications**. The older identity checkbox alone cannot grant teacher access; the account-status tool can reactivate an already qualified account.

Open `pages/admin-dashboard.html` using an active, trusted administrator account. The workspace manages student/teacher application access and teacher verification. It does not grant administrator roles, change curriculum, alter rewards/grades, or delete accounts and learning records.

## Review and account management

The initial view is the pending-teacher queue. Filter teachers or students by pending/active/inactive status; account lists load 25 at a time. Select a profile to review its current status and recorded decisions.

Activating a teacher requires the administrator to confirm identity/eligibility verification. Every activation, deactivation or declined request requires a 5–500 character reason. The actual verification is a human responsibility: the checkbox records the administrator's confirmation and is not automatic identity verification. Declining a pending request sets application status to `inactive` and records the reason. A later verified activation remains possible.

The save uses a transaction and checks the reviewed role, status and profile update time. A changed profile requires a fresh review. The transaction atomically changes application status and creates an immutable `accountModeration` entry. Direct status writes without the matching entry are denied. These changes preserve saved student progress and teacher classes.

Status controls application access; it is not Firebase Authentication account deletion or disabling. Protected operations check active status in Firestore rules. Existing page guards check fresh profiles on page load/restoration, while rejected reads/writes remain denied by rules. A screen already loaded is not retroactively erased when another administrator changes access.

Recorded decisions are paginated in document order, with actual server timestamps shown in Philippine time. Reasons are administrator-only. No reason field is copied into a student's profile. Profiles contain only the moderation actor, event identifier and times needed to link the last decision.

## Administrator provisioning

The website deliberately has no public administrator signup or role-promotion button. A trusted Firebase project owner must provision the designated administrator:

1. Create or identify the intended Firebase Authentication identity through the project's trusted account setup process.
2. Set up its exact `users/{Auth UID}` profile with the intended name/email, `role: admin`, `status: active`, and a creation timestamp through Firebase Console or a trusted administrative script.
3. Sign in through the normal website login. Do not store passwords in source files or choose an existing student/teacher to promote without an explicit operator decision.

No existing account was promoted, deactivated or otherwise modified during this implementation. The live check bootstrapped and removed only its newly created synthetic administrator. Actual operator/admin ownership remains a deployment decision; this implementation does not invent an operator or credentials.

## Permissions and evidence

The administrator rules are [published and read back](validation/admin-rules-publication-2026-10-31.json). The [review](admin-rules-review.md) changes exactly four scopes from the published teacher baseline: `activeAdmin`, `validModeration`, `accountModeration`, and the added administrator permissions in `users`. Other rule scopes are preserved.

- [44 local administrator permission checks](validation/admin-workflow-emulator-2026-10-31.json): paired immutable audits, role separation, verification, account reactivation, preserved progress and denial of role/XP/email/deletion changes.
- [57 teacher/student regression checks](validation/admin-teacher-regression-2026-10-31.json): existing class and reporting rules still work.
- [Browser checks](validation/admin-workspace-browser-2026-10-31.json): 20 checks each at 390px and 1280px, including account/history pagination, safe text, stale profile rejection, offline recovery and session cleanup. Uses actual modules with mocked Firestore.
- [Real-SDK check](validation/admin-workflow-live-2026-10-31.json): temporary identities exercise actual published approval/status/audit rules. Learning progress is seeded synthetic data, not an earned quiz result. Cleanup is recorded in the report.
- [Student regression](validation/admin-student-regression-2026-10-31.json): 407 checks across 65 suites and all 17 browser fixtures pass. Focused administrator policy/shared-guard checks also passed (33).

Current reviewed local package: `build/student-web-yhD8uT/public` (26 entry pages, 550 files). Preview with `node tools/serve-student-web.cjs build/student-web-yhD8uT`. The application uses the normal Firebase project and original student progression. Test fixtures are isolated checks and are not a product testing mode.

The [seven-day Hosting preview](website-release-current.md) is now published with bounded HTTPS/assets and all-role Auth checks. Main-channel rollout, actual operator/support/privacy arrangements and human administrator/teacher usability review remain separate release work. This updates the earlier local-only acceptance scope without claiming human acceptance.
