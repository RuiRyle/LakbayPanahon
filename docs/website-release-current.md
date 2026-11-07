# Current website release handoff

## Prepared teacher workflow update — November 5, 2026

**Local-emulator follow-up:** firebase-config.js now supports the dedicated local launcher described in [local emulator guide](local-emulator-guide.md). Repository/default environment remains main Firebase; only the local emulator server supplies the demo configuration. Because public source files changed after the package below was prepared, rebuild/review a new package before publishing these latest changes. Do not treat the earlier package as containing the emulator switch.

The [live rules comparison](validation/teacher-workflow-live-rules-check-2026-11-05.json) now confirms the recorded baseline exactly matches the active Firebase source. The reviewed candidate is not active. The [matching publication procedure](teacher-workflow-publication-procedure-2026-11-05.md) and `functions/teacher-workflow-rules-release.cjs` are prepared; read-only mode is `--inspect`, and activation is a separate `--publish-reviewed` operation. No website/rules activation occurred during this check.

The latest teacher workflow is staged locally in `build/student-web-XA9sUT/public`: 31 HTML entry pages and 568 public files. The four separate teacher destinations are now explicitly included in the release allowlist. This package has not been uploaded and does not change the existing preview described below.

The offline [release review](validation/teacher-workflow-release-preparation-2026-11-05.json) verifies package/source hashes, generated Hosting security headers, all five teacher destinations and matching 129-check local rules evidence. The staged [HTTP check](validation/teacher-staged-package-2026-11-05.json) confirms those pages serve with CSP while private documents/rules/manifests are inaccessible. The [rules comparison](teacher-workflow-rules-review-2026-11-05.md) is restricted to deadlines, feedback, private support notes and controlled owner membership deletion. Its baseline is reconstructed and hash-matched to recorded publication evidence; no fresh live rules read is claimed.

Preview locally with `node tools/serve-student-web.cjs build/student-web-XA9sUT`. Revalidate offline with `node functions/prepare-teacher-workflow-release.cjs build/student-web-XA9sUT`. Candidate rules are staged beside the public directory as `reviewed-firestore.rules`, never inside it. Older deployment commands and publishers target earlier reviewed hashes and must not be replayed for this update.

Remaining release work: compare the active live rules to the recorded baseline, prepare the matching activation procedure, publish the reviewed rules and Hosting package within authorized scope, then perform hosted teacher/student acceptance. Latest UI/rules are locally tested, not deployment-certified. Human usability, actual print/PDF output and device/audio checks remain separate.

**Published preview:** [Open LakbayPanahon](https://lakbaypanahon-1797e--release-review-crwbjyeo.web.app), available until **7 November 2026, 23:55 Philippine time**. The approved seven-day preview now includes [teacher qualification applications](teacher-qualification-workflow.md), verified-email submission and private admin review. It runs the normal application against the existing Firebase project. The main live Hosting channel remains unchanged.

This file summarizes current work; older dated reports keep their original evidence. The website remains the full normal application, with independent student learning and optional approved-teacher support. No exploration/testing mode is enabled.

## Current implementation

- Student: normal learning route, adaptive recovery, original saved progression/rewards, optional classes, journal/museum/community activities and journey ending.
- Teacher: recoverable pending-account registration, approved sign-in, owned classes/codes, member reports, announcements and assignments.
- Administrator: teacher verification, student/teacher activation/deactivation and paired immutable decision records.
- Shared sign-in reads the current server profile and rejects a stale response after a session change. It routes approved accounts to their actual role workspace.

The [teacher permissions](validation/teacher-rules-publication-2026-10-31.json) and [administrator permissions](validation/admin-rules-publication-2026-10-31.json) are published and read back. This follow-up did not change those rules or any existing account.

## Registration/sign-in follow-up

Teacher registration now reuses the newly created Auth identity when its profile save fails, confirms a lost acknowledgement, blocks duplicate submits, prevents a different email being substituted during recovery, and protects existing approved/inactive/student profiles. An existing password is not changed by profile recovery. Name length, notice acknowledgement and password matching are checked in the handler. The page offers Sign In after the profile is confirmed.

The teacher checkbox describes account review and approval; it does not assert agreement to unpublished legal policies. An obsolete test-version phrase in student validation is removed. The existing minimum password policy is unchanged.

Evidence:

- 24 focused auth/registration checks, including 10 new teacher cases and all three role routes.
- [Teacher form browser check](validation/teacher-registration-browser-2026-10-31.json): 12 checks each at 390px and 1280px.
- [Student regression](validation/auth-release-regression-2026-10-31.json): 416 checks across 65 suites and all 17 browser fixtures pass.
- [Staged real-SDK check](validation/staged-role-auth-live-2026-10-31.json): 7 checks with release security headers, actual teacher registration, pending sign-in, normal student/admin/approved-teacher routing, approval/audit saving and sign-out. Three temporary identities and their owned records were removed. No existing account was changed.

The initial staged check exposed a test harness that used `eval` to enter the student frame, which CSP correctly blocked. The harness now uses native Chrome execution contexts. The product policy was not weakened. The initial failure/cleanup report is retained separately.

## Reviewed package and hosting

Package: `build/student-web-yI6aWc/public`, 27 entry pages and 558 files. Preview locally with:

```powershell
node tools/serve-student-web.cjs build/student-web-yI6aWc
```

The [deployment plan](validation/hosting-release-plan-2026-10-31.json) checks manifest/source hashes, extra files, private-file exclusions, exact Hosting configuration, inline-script CSP hashes and matching acceptance reports. No website upload is performed by that preparation command.

The [GET-only Hosting/Auth metadata check](validation/hosting-target-2026-10-31.json) found the default site `lakbaypanahon-1797e`, no release in its live-channel metadata, and authorized sign-in domains for localhost, firebaseapp.com and web.app. Configuration was not changed.

The user approved the seven-day Firebase preview publication. [Publication evidence](validation/hosting-preview-publication-2026-10-31.json) records version `61617779e456f0bd`, the package hashes and exact expiry. Its URL is publicly reachable and uses existing real Firebase accounts/data. Firebase CLI added its hostname to Auth authorized domains; the [read-only follow-up](validation/hosting-target-after-preview-2026-10-31.json) confirms that domain and the unchanged main live channel. No demonstration mode is enabled.

The [qualification update](validation/teacher-qualification-preview-2026-10-31.json) supersedes that first preview version: `ec229a7124654912`. It includes the current 27-page package and privacy/verification rules. [Ten hosted qualification checks](validation/teacher-qualification-live-2026-10-31.json) pass with temporary-identity cleanup. The email-claim fixture is set through trusted Auth administration; real-inbox delivery and genuine PRC/institution checks are not claimed. A daily expired-image maintenance command is prepared; an unattended operator schedule is not configured.

Hosted evidence:

- [48 GET-only HTTPS checks](validation/hosted-preview-assets-2026-10-31.json): all 26 HTML pages, critical scripts/styles and sample images match the reviewed package; required security headers and HTML cache policy match; six private paths return 404; root routing and a real MP3 byte range pass.
- [7 hosted real-SDK checks](validation/hosted-role-auth-live-2026-10-31.json): actual teacher registration/pending notice, student/admin/approved-teacher routes, an approval/audit transaction, and sign-out pass on the preview. Three temporary identities and four owned document paths were cleaned up. Existing accounts were unchanged.

## Remaining release work

**1 November priority update:** No teacher or supervised learner group is available yet. The [review kit](student-review-kit.md), current 13-target adult packet, printable student handout, anonymous observation template and first Q1.1 clarity proposal are prepared. The proposal is not published, and no human review or student outcomes are claimed. See [preparation evidence](validation/review-preparation-2026-11-01.md).

The bounded hosted checks above are complete. Next, use the preview for the already prepared history/Grade 5 and intended-learner review, real-phone/listening checks and optional AI/provider acceptance. The 13 recorded curriculum-depth findings remain human/content work; automated wording checks do not certify learning effectiveness or full DepEd coverage. Publishing to the main live channel remains a separate release decision.

Before broad learner rollout, establish the actual operator/support/privacy/account-assistance arrangements. Those undecided arrangements do not block continued engineering, and no school, support address, retention period or administrator identity is invented here. Provision a real administrator through trusted project setup as described in [administrator workflow](admin-workflow.md).
