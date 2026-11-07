# Priority 2 controlled deployment and live verification

Status: deployed and verified within the scope below. No Priority 3 work was performed.

## Release

- Production: https://lakbaypanahon-1797e.web.app
- Firebase project/site: `lakbaypanahon-1797e`
- Released version: `b984eba31379723a`
- Released: 7 November 2026, 01:22:51 Philippine time (`2026-11-06T17:22:51.299Z`).
- Previous/rollback version: `629e90f8a8b53fb4`.
- Exactly two deployed paths changed: `/js/mission-assessment.js` and `/js/learning-draft.js`.
- All other 573 deployed file hashes, all 575 path entries, and the Hosting configuration were preserved.
- Active Firestore ruleset remained `7b56c656-fb38-44a3-9b69-38942be9a8c3`; both its identity and source hash were checked before and after publication.

The deployed source SHA-256 values are:

| File | SHA-256 |
|---|---|
| `js/mission-assessment.js` | `128880f98452c64fd902ecd434464e4c0ba03cb2e3fae21f1d0a85ab56c2e4e6` |
| `js/learning-draft.js` | `692d59242f6bf09cb36d5dd660d71f79442e705c5b0b973cedc1bfb0d1a83b75` |

No extra application dependency was required: transactional draft persistence uses the existing Firebase 12.4.0 Firestore SDK. No functions, rules, indexes, Auth configuration, database schema, lesson/question content, answer key, or unrelated frontend file was deployed.

## Production readiness and controlled process

Read-only preflight found an existing main-channel release and the older release-review preview. The main production channel was used; the preview was not promoted or changed.

The working tree contains unrelated changes and some local modules differ from production. A whole-repository deployment would therefore exceed the approved scope. The release reused the existing production file hash map and configuration, substituting only the two approved files through Firebase Hosting's version/populate/upload/finalize/release pipeline with the existing Firebase CLI login. This is implemented in `functions/priority2-hosting-release.cjs`; it targets Hosting only and contains no Firestore mutation endpoint.

The preparation phase saved production version metadata, every original file hash, and active rule source privately in `backups/priority-2-hosting-before-2026-11-07.json`. Publication checks baseline/version/source drift, rejects unexpected unchanged-file upload requirements, checks the finalized version's complete file map/configuration, and checks that another deployment has not advanced the main channel before release. The previous version is retained as the rollback target; no rollback was necessary or executed.

An initial attempt to reconstruct a conventional staging directory stopped safely when Firebase-reserved `__/firebase/init.*` responses did not reproduce their stored hashes. Nothing was published from that incomplete staging attempt. Reusing the existing Hosting hash map preserved these reserved entries exactly. No content was guessed or regenerated.

Production risks identified before release were concurrent deployments, unrelated local changes, unavailable initial draft reads, additional transactional read latency, and already-running old tabs. Baseline guards and a two-path hash comparison addressed deployment scope; operational limits remain documented below.

## What the corrections do

The shared adaptive selector now prioritizes topic need and nearest available difficulty before applying unseen-question preference within that pool. Used items remain excluded, limited banks still fall back or return null, and main quiz counts/quotas/difficulty steps remain unchanged.

Learning draft saves and cleanup compare the existing document version inside Firestore transactions. A stale page cannot overwrite or delete a newer observed version. Current-session saves, restoration, and cleanup retain the existing document schema. Conflicts use the existing status area to request reopening; an unavailable initial baseline fails safely rather than adopting a later draft without checking.

Detailed implementation and local regression coverage remain in [the implementation report](priority-2-adaptive-fixes-2026-11-07.md).

## Live verification

The final hosted-production run passed **12 checks** using one disposable student identity. Its prerequisites were explicitly synthetic fixtures belonging only to that identity; quiz attempts and their rewards were then submitted through the actual deployed browser modules and production Firestore rules.

| Area | Observed result |
|---|---|
| Deployed adaptive selection | With live mission practice questions, seen easy questions from the identified weak topic were selected ahead of unseen unrelated items. |
| Incorrect follow-up evidence | Follow-up mistakes persisted the topic for review while leaving the main quiz score unchanged. |
| Draft save | Actual deployed module saved under the unchanged production rules. |
| Independent sessions | A second browser frame restored the first frame's answers and repeated-mistake evidence, then saved newer state. |
| Stale overwrite/cleanup | The older frame could neither overwrite nor delete the second frame's newer draft. |
| Reopening | Actual page navigation followed by reopening restored the latest saved state; current-version cleanup succeeded. |
| Cleanup-only race | An older instance's cleanup preserved newer work even without first attempting a stale save. |
| Failed quiz | Main score 0, no completion reward, total XP 0. |
| First passing quiz | Main score 100, configured reward 50 XP, total XP 50. An incorrect follow-up did not reduce this main score. |
| Completed quiz retry/replay | New passing retry awarded 0 additional XP; total remained 50. Same-attempt replay also preserved the total. |
| Unlocking | The next mission was unavailable before its prerequisite passed and available afterward through the actual deployed access module. |
| Lesson narration | Hosted lesson loaded; the narrator's utterance text matched the displayed paragraph verbatim. |
| Bayani AI | Hosted page reached ready state and returned an actual provider reply to one bounded smoke prompt per final full run. No provider configuration changed. |

Rows group some assertions, so this table is more detailed than the check count. The test is an assisted engineering exercise using existing answer keys, not a student-learning-effectiveness study. The scored quiz/follow-up checks use deployed modules and real transactions; this is not a claim that a human clicked through every main/follow-up screen.

No real student account or existing student-owned record was used as a test fixture or targeted for writes. The live tests changed only newly created disposable accounts and their owned documents. Chapter badge award behavior was covered by existing local regressions and unchanged deployed reward code; a new production chapter badge was not earned during this walkthrough.

The first live run stopped because its fixture assumed a nonexistent `chapter1-mission1` identifier. The fixture was corrected to the existing `chapter9-mission1`; its temporary identity was cleaned up. A lesson page's automatically saved story draft required one additional owner/version-guarded cleanup after an earlier run; that removal was verified and the harness now registers that draft before navigation. No application defect or unrelated production correction resulted from either test-harness issue.

The final full run removed its temporary account and **86 owned documents**. Additional read-only checks confirmed no remaining profiles, Auth accounts, drafts, attempts, progress, artifacts, or chapter progress for the three recorded disposable identities used in the extended checks. Earlier short-run cleanup completed through the existing harness. Real user records were not reset.

## Hosted content, caching, and boundary checks

`functions/verify-priority2-hosting.cjs` passed:

- Current main channel points to `b984eba31379723a`.
- Full file-map comparison confirms exactly two changed hashes and no additions/deletions.
- Both public JavaScript responses match the approved local source hashes.
- JavaScript retains `Cache-Control: no-cache`; conditional revalidation requests returned current verified bytes (HTTP 200).
- Login, quiz, story, and Bayani pages return HTTP 200, the preserved CSP, and HTML `no-store` caching.
- Firestore rules and private backup paths return HTTP 404 on Hosting.
- No named `sw.js`/`service-worker.js` asset was present in the deployed manifest. This is not a universal assertion that every possible service worker registration was inspected.

The release is atomic at Hosting version level. New/reloaded pages receive current compatible assets. An already-open document retains its imported modules until reloaded; HTTP caching cannot forcibly replace running JavaScript. Refresh open tabs before continuing, especially when using several sessions. No unrelated automatic reload UI was introduced.

## Automated checks

Immediately before release, the relevant adaptive/draft/assessment suite passed **78 tests, zero failures**. After release, Bayani/narration/journey compatibility suites passed **85 tests, zero failures**. Total: **163 automated tests passed**. Exact commands are in the implementation report. The seven mocked browser suites passed during the approved implementation; they were not all repeated in this deployment turn. Real hosted checks above provide the production-specific evidence.

## Evidence and tooling

| Artifact | Purpose |
|---|---|
| `priority-2-deployment-preflight-2026-11-07.json` | Initial read-only channel and asset inspection. |
| `priority-2-hosting-plan-2026-11-07.json` | Guarded release scope, baseline, hashes, configuration, and rule identity. |
| `priority-2-hosting-publication-2026-11-07.json` | Published version, release time, and exact changed paths. |
| `priority-2-hosted-verification-2026-11-07.json` | Full post-release manifest/rules/configuration and HTTPS/cache checks. |
| `priority-2-production-live-2026-11-07.json` | Final 12-check production walkthrough, scoring, review, unlocking, and actual Bayani reply. |
| `priority-2-production-live-bayani-2026-11-07.json` | Earlier successful full walkthrough retained as evidence. |
| `priority-2-cleanup-verification-2026-11-07.json` | Independent read-only cleanup confirmation. |
| `priority-2-additional-cleanup-2026-11-07.json` | Confirmed removal of the earlier disposable story draft. |
| `priority-2-production-live-initial-fixture-2026-11-07.json` | Initial fixture assumption failure with completed cleanup. |

New local-only tooling: `functions/priority2-hosting-release.cjs`, `functions/verify-priority2-hosting.cjs`, and `tests/priority2-production-live.cjs`. The existing `tests/teacher-workflow-live.cjs` gained an exact production-origin configuration and named-frame evaluation helper. These tools/tests/reports/backups were not uploaded to Hosting.

## Remaining limitations

- Independent browser frames exercised separate draft instances against real Firestore; simultaneous physical devices were not tested. Delayed transaction contention was covered by local regression adapters, not forced on the production network.
- Human listening, voice pronunciation, and physical-device audio playback were not verified. Narration text/module compatibility passed.
- Existing old tabs must be refreshed. Clients running old code or deliberately modified clients do not gain server-enforced concurrency protection from these client checks.
- Transactional saves require connectivity and introduce extra reads. Production quota and latency under classroom load have not been benchmarked. When the initial version cannot be checked, reopening when connected is required for a safe baseline.
- Concurrent divergent answers are not merged. The stored version is preserved and the stale session is asked to reopen.
- AI reply availability does not certify historical accuracy, provider audience eligibility, moderation, or learning effectiveness. No such configuration was changed here.
- No end-to-end production chapter badge or every-mission walkthrough was performed. Preservation is supported by the two-path deployment manifest, unchanged rule/code hashes, relevant local regressions, and bounded live scoring/unlocking checks.

Priority 2 deployment is complete within this scope. Priority 3 remains unstarted pending separate approval.
