# Priority 3 local readiness corrections and release preparation

7 November 2026, Asia/Manila. Local preparation only. Production deployment remains **NO-GO** until the infrastructure, App Check and dependency-review gates below are approved and satisfied. No billing linkage, API activation, service-account creation, IAM grant, production configuration/rules write, live assessment invocation, learner-record write or Priority 4 work occurred.

## Completed corrections

- Restored the `functions` export in local `js/firebase-config.js`, including the existing Singapore region and loopback emulator connection. This restores compatibility with production's AI helper. The release preserves the actual production Firebase configuration and AI helper bytes instead of publishing unrelated local import changes.
- Added exactly `https://asia-southeast1-lakbaypanahon-1797e.cloudfunctions.net` to CSP `connect-src`. No wildcard Functions allowance, script relaxation or unrelated header change. Existing Firebase Auth, Google API/Firestore, reCAPTCHA, fonts, media and Bayani connections retain their original permissions.
- Prepared assessment App Check initialization using the existing Enterprise site-key setting and automatic refresh. When this module creates the App Check instance, it checks token acquisition before issuance and reports a readable error on failure. When Bayani already initialized the app, it preserves that instance; Firebase Functions SDK remains responsible for token attachment. No debug provider/token is present in the production module. Local emulator bypass remains loopback/demo-only.
- Bound the proposed production assessment functions to a dedicated `assessment-runtime` identity instead of silently using the legacy Editor account. This is source configuration only: the account does not yet exist and no IAM change occurred.
- Removed unused `firebase-functions-test` from the Functions development dependency/lock entries. Its declared Admin peer range stopped at version 13 and broke clean npm installation with the existing Admin 14. No repository test imports this SDK. Real emulator tests remain the security gate.
- Applied only compatible request-parser lockfile updates: `body-parser` 2.3.0 to 2.4.0 and `qs` 6.16.0 to 6.17.1. Firebase Admin stays 14.5.0 and Firebase Functions stays 7.4.0. The former fixes a maintainer-confirmed compressed-body denial-of-service issue; the latter fixes the query-serialization advisory. [body-parser advisory](https://github.com/expressjs/body-parser/security/advisories/GHSA-27r3-jxmh-p828), [qs advisory](https://github.com/ljharb/qs/security/advisories/GHSA-6pq8-jhm2-2vcw).
- Repaired an older route fixture's missing `learningNavigation` dependency, preserving its original successful/failed recovery assertions. No application navigation behavior changed.

No historical content, answer keys, score thresholds, rewards, unlocking requirements, narration, Bayani application code, or existing student records were changed.

## Exact source/configuration/test inventory for this follow-up

| File | Change |
|---|---|
| `js/firebase-config.js` | Restore the compatibility Functions export and emulator connection. |
| `js/student-assessment-client.js` | Explicit token check when initializing App Check; preserve pre-existing provider; readable failure. |
| `functions/student-hosting-config.cjs` | Narrow callable origin addition. |
| `functions/index.js` | Explicit proposed runtime service account. |
| `functions/package.json` | Remove unused conflicting test-only dependency. |
| `functions/package-lock.json` | Remove its dev-only tree and patch the two parsers above. |
| `functions/prepare-priority3-readiness.cjs` (new) | Deterministic local artifact assembly, baseline hash checks and public GET-only cache filling; no publish command. |
| `firebase.priority3-readiness-emulator.json` (new) | Isolated demo emulator configuration using the assembled Functions/rules artifacts. |
| `tests/priority3-readiness.test.cjs` (new) | Artifact hashes, exact overlays, CSP preservation, App Check transport behavior, dependency and rollback guards. |
| `tests/secured-browser-emulator.cjs` | Assemble-page mode, production AI import test, real SDK local App Check header probe. |
| `tests/easy-review-recovery.test.cjs` | Supply the missing navigation fixture dependency. |

This report, test logs, dependency advisory evidence and generated build artifacts are additional local evidence. The exact generated file hashes are in `build/priority3-release/manifest.json`. Existing unrelated working-tree edits were neither reverted nor included.

## Release artifacts and baseline preservation

`build/priority3-release/` contains the local candidate, not a deployed version:

- `hosting/file-map.json`: 577 paths, using the pinned active 575-file production map plus two additions.
- `hosting/uploads/`: seven exact gzip payloads, with content hashes; `hosting/public/` contains the assembled text assets used in browser verification.
- `hosting/config.json`: production Hosting configuration with only the exact callable CSP origin added. Cache revalidation remains unchanged.
- `functions/`: Node 22 package, lockfile, four callable exports, trusted service/adapters and five exact shared policy modules. Unrelated `testStudentAuth` and `getLearningAssistance` exports are excluded from this artifact entry point. No migration scripts, AI backend or standalone assessment server is packaged.
- `rules/firestore.rules`: secured candidate generated from the read-only production rules snapshot, not the unrelated root working-tree rules.
- `baseline/`: pinned Hosting configuration/file map and original rules for drift comparison, not for restoring insecure permissions.
- `policy/disabled-proposal.json`: inert JSON proposal (`enabled:false`), not a Firestore write.
- `rollback/`: protected rules, compatible Hosting map with reward submission paused, and four callable replacements that return unavailable without importing Admin or accessing records.

Hosting replacements: `js/student-rewards-client.js`, `js/mission-assessment-client.js`, `js/quiz.js`, `js/chapter-challenge.js`, `js/daily-challenge.js`. Additions: `js/student-assessment-client.js`, `js/assessment-preview.js`. All other **570 production paths remain pinned**, including Firebase configuration, AI helper, Priority 2 selection/draft modules, learning content and audio. The chapter artifact strips out the unrelated local keepsake-rendering fallback and retains production's existing block.

**Do not deploy `hosting/public/` as a complete directory:** this is a hash-map overlay, reusing unchanged production hashes through the project's existing controlled Hosting release process. Binary assets are retained by hash, not copied into this text-only test directory. The generated Firebase config deliberately has no Hosting directory deployment target. A later publisher must compare the fresh live version/file map/configuration, reject drift, reuse the pinned map, upload only approved payloads, verify the staged 577 hashes, and then release. No such publisher was invoked or auto-enabled.

Pinned production version: `b984eba31379723a`. Original rules SHA-256: `678be315fa0aecdbb09fc3cb88294c0f69493056e8c50389a254500234ac0496`. Secured rules SHA-256: `6b704af7ac7e6114851ce1a3e61ceaf2aaf2568587c4150bc51bafac90ae5849`. These are the freshly read baseline from the preceding same-day audit; they are **not a promise that production cannot subsequently change**. Repeat metadata/rules inventory before any future deployment. Candidate changes are confined to canonical reward writers, profile reward authority, secured policy read access and private assessment denials. Unrelated teacher/profile/draft/practice/read permissions remain as in that baseline.

The legacy callable factory routes through the secured service, raw score/XP/question-list requests cannot authorize rewards, and the standalone server stays retired. Production's earlier v1/v2 inventory contained no deployed callables. Any new or externally hosted reward endpoint discovered at future preflight must be reconciled before activation. Rules do not constrain Admin; gate/replace faulty Admin endpoints explicitly.

## Billing and services: prepared requirements, not activated

The prior production audit verified no linked billing account. To deploy later, an authorized billing administrator must select/create a billing account with a valid payment method and link this existing project through Firebase's Blaze upgrade flow. This requires billing-account linking rights and project billing-management rights; existing project deploy permissions alone do not establish those rights. No project replacement or student migration is needed. [Firebase deployment requirements](https://firebase.google.com/docs/functions/get-started).

Required Gen 2 runtime/build APIs missing in the audit: `run.googleapis.com`, `cloudbuild.googleapis.com`, `artifactregistry.googleapis.com`. Existing required services include `cloudfunctions.googleapis.com`, `firestore.googleapis.com`, `identitytoolkit.googleapis.com`, `firebaseappcheck.googleapis.com`, `recaptchaenterprise.googleapis.com`, Storage and Logging. Dedicated account provisioning also needs `iam.googleapis.com`; verify Service Usage permissions for any approved activation. Enable `iamcredentials.googleapis.com` only if the selected deployment/impersonation workflow needs it. HTTPS callables do not require introducing Eventarc triggers or Compute workloads. Do not indiscriminately enable every previously disabled API.

Blaze is usage billing, not an assessment subscription fee. Linking billing also makes eligible usage in other enabled project services billable. Cloud Build execution, source/container storage, Artifact Registry, request processing, Firestore operations/storage/indexes, logs, egress and reCAPTCHA can incur charges. No new model inference is used in deterministic grading.

Current published no-cost allowances include Firestore 50,000 reads/day, 20,000 writes/day, 20,000 deletes/day and 1 GiB stored data for its eligible free database. Backup/PITR/restore and TTL deletion do not share free usage. Cloud Run request-based pricing includes request and compute credits; availability is aggregated across the billing account and region-priced credits must not be treated as a Singapore spending guarantee. [Firestore pricing](https://cloud.google.com/firestore/pricing), [Cloud Run pricing](https://cloud.google.com/run/pricing).

Illustrative gross usage from the audit: 13 requests, 700 reads and 20 writes per successful session, one allocated vCPU/256 MiB, 0.5–2 seconds active time/request. With the saved Singapore SKU rates this is approximately **US$0.51–1.18 per 1,000 sessions**, or **US$22–52 for 44,000 sessions**, before no-cost allowances and excluding storage, builds, Auth/verification overhead, existing AI/voice/Hosting use, retries and history growth. These are assumptions, not measured production costs or a cap. Attempt startup/resume currently rereads substantial context and larger histories increase consumption.

Enterprise reCAPTCHA offers a no-cost assessment tier, with charges beyond its allowance. Current pricing lists 10,000 free assessments and the next tier at US$8 through 100,000, subject to account aggregation and current billing terms. Token caching/refresh means one quiz answer does not necessarily create a new reCAPTCHA assessment. [App Check provider setup](https://firebase.google.com/docs/app-check/web/recaptcha-enterprise-provider), [reCAPTCHA pricing](https://cloud.google.com/security/products/recaptcha).

Before billing approval, select an expenditure budget and alert recipients/thresholds, review existing project traffic and decide abuse controls. Alerts and `maxInstances` are not hard spending caps. No budget was created.

The proposed start counters do not throttle every advance/resume/submission call. Context/history reads on these endpoints remain a possible cost and latency amplifier. Per-mission history queries fail closed above their 1,000-record bound; no silent truncation or automatic record deletion is proposed. Default server/client callable deadlines remain approximately 60/70 seconds, not a measured responsiveness guarantee. Classroom-scale cold starts, contention and indexes still need hosted acceptance and an approved operational/retention decision. No offline client reward fallback exists.

## Runtime and deployment identities

Proposed runtime: `assessment-runtime@lakbaypanahon-1797e.iam.gserviceaccount.com`, explicitly named in the candidate. Provisioning and grants await approval. No downloaded service-account key, Editor/Owner role, Token Creator role or billing-management permission is needed by assessment runtime code.

The source requires transactional catalog/progress reads, private evidence/result creation and profile/progress updates, plus `firebaseauth.users.get` to check revoked/disabled identities through `verifyIdToken(..., true)`. A proposed strict custom runtime role contains:

```
datastore.databases.get
datastore.entities.get
datastore.entities.list
datastore.entities.create
datastore.entities.update
firebaseauth.users.get
```

These map to the used Firestore transaction/query/commit and Auth methods; no delete is performed by the service. Validate this proposed custom role against actual production SDK/organization policy before activation. Emulators do not simulate IAM. Practical predefined alternatives are `roles/datastore.user` plus `roles/firebaseauth.viewer`, which grant more permissions than this strict list. The identity proposal file identifies those alternatives; it is not an IAM policy applied to production. Admin bypasses client rules, so runtime scope and service authorization remain essential. [Firestore IAM method permissions](https://firebase.google.com/docs/firestore/security/iam), [Firebase Auth roles](https://docs.cloud.google.com/iam/docs/roles-permissions/firebaseauth).

Keep build and runtime accounts separate. The selected build account needs Logging Writer, Artifact Registry Writer scoped to the build image repository, and Storage Object Viewer scoped to approved source/upload buckets, following Google's build guidance. The deployer needs function build/deploy, Hosting/rules release and `iam.serviceAccounts.actAs` on the chosen identities. Relevant Google-managed service agents retain their own documented service-agent roles; do not grant those roles to the application account. Exact resource names, build identity selection and organization constraints require the approved infrastructure setup/preflight. [Functions build process and permissions](https://docs.cloud.google.com/functions/docs/building).

## App Check verification and remaining limits

Local tests confirm token acquisition logic with controlled provider responses, missing-token rejection, existing-provider preservation and **real Firebase SDK attachment of `X-Firebase-AppCheck`** using an isolated CustomProvider and intercepted loopback probe. That proves transport, not successful production Enterprise attestation or real score acceptance. The intercepted probe never reaches a production endpoint.

The preceding audit found that the configured production key string matches the frontend setting but does not match either key returned by this project's reCAPTCHA key listing. That remains unresolved; it is not proof that a cross-project key can never work. A real supported production registration/key/domain/score/TTL configuration must be verified before enforcement. Test the main `web.app`/`firebaseapp.com` origins and intended browsers/school networks using an approved isolated account; preview hosts require their own provider-domain consideration. Keep rollout policy disabled while checking; a future protected endpoint returning `assessment/not-active` can demonstrate Auth/App Check passed without creating an attempt.

Do not enable global Auth/Firestore App Check enforcement as part of this release. The candidate functions have enforcement prepared in code but have not been deployed. Production key/provider/domain changes and any attestation assessment charges require approval. Physical devices, production IAM/indexes, provider availability, paid AI responses and real narration playback were not newly verified.

Public educational keys remain readable by the approved architecture. Server verification secures issued-question identity and reward authority, not unaided understanding or exam secrecy. No new public-key migration is included.

## Test evidence

Final verification: **204 Node.js 22 unit tests passed; 28 Auth/Functions/Firestore integration tests passed; all 11 standalone browser regression fixtures passed. Zero failing tests remain in these final runs.** A final seven-case artifact-integrity rerun also passed after adding the inert role/README files; these seven are included in the 204-case suite, not extra unique coverage.

Node 22.23.4 was downloaded locally from nodejs.org, checked against its official SHA-256 manifest, and used by the final Functions emulator (`Using node@22 from host`). No global Node installation was changed. A clean candidate `npm ci --omit=dev --ignore-scripts` succeeded without legacy-peer overrides. The final emulator config loaded only the four reviewed callables from the actual assembled package and its protected rules; the student browser served the assembled production-compatible text assets.

All three original defects remain addressed in the candidate: raw mission reward claims are rejected, chapter badges require trusted prerequisite/challenge evidence, and grading binds to server-issued selected questions rather than the full question bank or caller-chosen IDs. The 28 integration cases cover legitimate/failing/retry/replay paths, duplicate/concurrent transactions, interrupted commits, stale revisions, forged payloads, private records, legacy completion/best-score preservation and adaptive/follow-up behavior. The real page covers refresh and lost-response recovery. Production remains on its previous release until a separately approved cutover.

Evidence:

- `priority-3-readiness-node22-unit-2026-11-07.log`: 204/204.
- `priority-3-readiness-final-package-emulator-2026-11-07.log`: final patched-package 28/28, Node 22 and only four endpoint definitions.
- `priority-3-browser-emulator-2026-11-07.json`: actual assembled HTML/SDK flow and local App Check header probe.
- `priority-3-readiness-package-install-2026-11-07.log`: clean install and remaining advisory count.
- `priority-3-readiness-*-browser.cjs.log`: mission, storage-blocked mission, chapter, daily, Bayani, story, practice hints, review, artifacts, achievements and achievements layout. Gallery layout fixtures include desktop/mobile checks.
- `build/priority3-release/manifest.json`: 236 generated artifacts, source-file hashes, exact overlays and inactive status.

The actual browser still records the existing ViewTransition opt-in `InvalidStateError`; it did not prevent loading, restoration, grading or saving and was not changed under this scope. Emulator logs include expected permission-denied attack cases and shutdown/connection-reset diagnostics; those are not failed acceptance assertions. This is not a claim of a clean production console.

Initial failures included the conflicting unused test SDK, the old route fixture's missing dependency and a new rollback test double using the wrong `HttpsError` constructor. These were corrected without weakening assertions; unsuccessful attempts are not counted as passing runs.

Final dependency audit after the narrow patches: **zero critical, zero high, six moderate entries**. The remaining entries are `gaxios`, `gcp-metadata`, `google-gax`, `rimraf`, `glob` and `minimatch`, largely one inherited chain under the optional Firestore API package's older `google-gax` subtree. The root advisories concern glob cancellation and minimatch pattern amplification; the six entries do not represent six independent confirmed application exploits. Assessment code does not intentionally accept student filesystem patterns, but transitive reachability has not been proven absent. Do not suppress advisories or force incompatible overrides to obtain a green audit. Review a compatible upstream dependency remedy or obtain an explicit documented risk decision before production. No wider Firebase SDK upgrade was performed. Evidence: `priority-3-readiness-dependency-audit-2026-11-07.json` and its before-patches counterpart. [glob advisory](https://github.com/advisories/GHSA-3g3m-2fjr-6pw4), [minimatch advisory](https://github.com/advisories/GHSA-g3hv-75wg-m249).

Reproduction:

```powershell
node functions/prepare-priority3-readiness.cjs --download
# Use checksum-verified Node 22 first on PATH, then install the candidate lockfile locally.
npm.cmd ci --omit=dev --ignore-scripts --prefix build/priority3-release/functions
$env:PRIORITY3_PACKAGE_BROWSER='1'
firebase.cmd emulators:exec --only auth,functions,firestore --project demo-lakbaypanahon --config firebase.priority3-readiness-emulator.json "node --test tests/student-security.test.cjs"
```

The emulator config and test harness require the demo project/loopback targets. The browser host substitutes only the demo project name in the pinned production Firebase configuration and serves a local environment module; neither change is in Hosting artifacts. Its HTTP emulator host intentionally does not enforce production CSP. CSP scope/preservation are checked separately against the exact configuration; hosted CSP/provider acceptance remains a later gate.

## Controlled deployment and protected rollback: not executed

1. Obtain explicit approval for billing/API/IAM actions, operational settings, dependency disposition, backup strategy, activation window and isolated live acceptance. Freshly compare active Hosting/configuration/rules/functions/catalog with the pinned baseline; stop on drift. Verify recoverable backup rather than assuming PITR, which was off in the audit.
2. Provision the approved build/runtime identities and APIs under the selected billing account. Do not use emulator/debug environment settings in production. Deploy only the four named gated callables with protocol still disabled; ensure no raw legacy writer is available.
3. Verify real Auth and App Check from approved production origins before enabling saves. No insecure fallback should be activated to make this probe pass.
4. Announce a short assessment-save pause. Publish restrictive rules first to freeze direct legacy reward claims. Old tabs may now receive permission errors until refreshed. Existing earned progress remains readable; lessons/review/narration continue where existing rules allow them.
5. Release only the seven reviewed Hosting payloads and narrow CSP using the exact hash-map process. Verify file/config hashes and fresh caching behavior. Do not publish unrelated local Firebase/AI/chapter-card changes.
6. Only after those gates, create/enable the approved rollout policy. Proposed, unapproved values are 7,200-second attempt expiry, 10 starts/minute/student and 200 starts/day/student. Current code limits 512 actions/attempt and defaults to 10 instances/callable. These are not a total request limiter or classroom-load benchmark. Decide pilot instance/concurrency/timeouts and broader abuse protection separately; do not silently alter learning/reward rules. The current policy is global, not a UID canary switch.
7. Run separately approved isolated production acceptance: pass/fail/retry, main/follow-up separation, prerequisite denial, badge/artifact eligibility, concurrent and repeated submissions, lost acknowledgement/reload, direct-write/private-record denials and actual provider/network checks. Distinguish seeded prerequisites from legitimately exercised paths. Remove only approved disposable test identities/records; never real learner data.
8. For an incident, disable the policy and gate/redeploy the prepared deny-only Admin callables. Retain protected rules and compatible frontend, optionally publish the holding reward facade. Confirm endpoints are paused before reopening ordinary reads. Resolve uncertain transactions by receipt; retain all committed progress/rewards.

Never restore the old permissive rules, raw reward callable or old client-only assessment authority as rollback. Do not restore a database snapshot over later student work or revoke rewards automatically. Unfinished legacy quizzes may need restarting; the new client states that completed missions and earned rewards remain saved. Old running JavaScript cannot acquire that notice until refreshed.

## Remaining approval gates

- Blaze account/payment/budget, required API activation and dedicated identity/IAM provisioning.
- Production App Check key/registration resolution and successful attestation before enforcement/activation.
- Final dependency risk review or separately approved compatible dependency remediation beyond the narrow parser patches.
- Actual operational limits/retention, backup and cutover plan, fresh release drift checks and isolated hosted acceptance.
- Separate explicit production deployment/activation approval. No Priority 4 work is included.
