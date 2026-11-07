# Priority 3: read-only production readiness audit

**Status: NO-GO for deployment in the current state.** Audited 7 November 2026 using read-only production metadata/public assets and educational catalog reads, followed by offline analysis. No student records were read, changed or created. No functions were invoked, App Check tokens minted, services enabled, billing linked, rules published, or deployments executed. Priority 4 was not started.

This report separates current production facts from local test evidence, recommendations, and assumptions. It does not authorize activation.

## Confirmed production facts and blockers

| Area | Verified fact | Readiness consequence |
|---|---|---|
| Project | `lakbaypanahon-1797e`, active; project number `831214660993` | Correct existing project; no replacement project needed. |
| Billing | `billingEnabled:false`, no linked billing account | Blocking: production Functions deployment requires Blaze/billing linkage. No change made. |
| Node runtime | Project/region runtime API lists `nodejs22` as GA for GEN_2 in `asia-southeast1` | Platform supports the requested runtime. The project is not otherwise ready to deploy it. Local tests used host Node 24; Node 22 package/runtime acceptance remains required. |
| Core APIs | Cloud Functions, Firestore, Authentication, App Check, reCAPTCHA Enterprise, Logging and Monitoring enabled | Existing application services are available. |
| Deployment APIs | Cloud Run, Cloud Build and Artifact Registry disabled | Blocking: required Gen 2 build/runtime services need separately approved activation. |
| Runtime identity | Default Gen 2 Compute service account GET returns 404; Compute API disabled | Blocking until an appropriate runtime/build identity is explicitly selected/provisioned and permission-tested. |
| Existing identities | App Engine default account and Firebase Admin SDK account exist; App Engine account has Editor | Existence does not prove least-privilege Gen 2 readiness. Do not silently reuse an overprivileged identity. |
| Deployer | Read-only `testIamPermissions` grants all checked project-level function create/update/delete/get, Run create/update, service enablement, service-account actAs, Hosting update, and rules release update permissions | No missing grant among these checked permissions. Future billing-account rights, selected identity bindings, build permissions and organization constraints are not fully certified. |
| Deployed Functions | v1 and v2 all-region listings both return no functions, with no unreachable regions | No existing Firebase callable reward endpoint was found. The browser still uses Firestore directly. |
| Cloud Run inventory | List returns 403 while Run API is disabled | Unknown inventory, not proof of zero services. Recheck before activation; no API was enabled merely to inspect it. |
| Firestore | Native mode, Singapore `asia-southeast1`, pessimistic concurrency | Matches proposed function region; good placement for server transactions. |
| Recovery | PITR and delete protection disabled | No recovery configuration was enabled. A current recoverable database backup has not been verified. |
| Secured policy | `learningSettings/securedAssessment` returns 404 | Expected pre-activation state, but must be created with approved settings during a later deployment. |
| Hosting | Live version `b984eba31379723a`, 575 files | Priority 2 remains the active release. Priority 3 is not deployed. |

Firebase documents that production Functions require the Blaze plan and supports Node.js 22. The region runtime API independently confirmed Node 22 availability for this project. [Functions deployment requirements](https://firebase.google.com/docs/functions/get-started), [runtime configuration](https://firebase.google.com/docs/functions/manage-functions).

The core deployment services requiring approval are Cloud Run, Cloud Build and Artifact Registry. IAM/identity provisioning and its required APIs must be approved for the chosen account strategy. Eventarc is also currently disabled, but this proposal uses HTTPS callables, not event triggers; do not enable unrelated event services automatically without reviewing the final CLI requirements.

## App Check: registered, not ready to enforce blindly

Verified:

- The current web app has a reCAPTCHA Enterprise App Check registration.
- App Check token TTL is 3,600 seconds; `riskAnalysis.minValidScore` is 0.5.
- The public key in the client's Bayani settings matches the key recorded in the App Check registration.
- **That configured key does not match either of the two keys returned by this project's current reCAPTCHA key listing.** Individual GETs for the configured key returned HTTP 400. The mismatch was checked by hashes without exposing credentials.
- Both listed project keys allow only the main `web.app` and `firebaseapp.com` hostnames. They do not allow all domains.
- Auth allows the main domains, localhost and the older release-review preview hostname. An Auth-authorized hostname is not necessarily a reCAPTCHA-authorized hostname.
- App Check service metadata reports Firestore/Auth/Firebase ML as unenforced. No Functions currently exist to enforce it on.

**Gate:** reconcile the configured key's ownership/existence and validate genuine production attestation before callable enforcement is activated. This mismatch is verified; whether the configured key could belong to another project or successfully attest was not tested. Do not equate matching client/registration strings with a working provider.

Missing/invalid App Check tokens are rejected by `enforceAppCheck:true`; valid students could therefore be blocked by an unusable key, a hostname mismatch, restrictive school/ad-blocking browsers, score rejection, or network failures. [Callable App Check enforcement](https://firebase.google.com/docs/app-check/cloud-functions).

Do not lower the score threshold or disable enforcement as an automatic workaround. Verify the corrected registration and main-origin token path first, using separately approved isolated acceptance. Test desktop, mobile and a representative school network. A preview domain would require a suitable approved provider-domain configuration; the existing listed keys do not authorize that sibling preview hostname.

Recommended later probe: with an approved disposable student and the secured policy still disabled, call the gated secured endpoint. A recognized `assessment/not-active` response demonstrates the request reached application logic after Auth/App Check validation, without creating an assessment or awarding XP. This was **not** executed during this read-only audit.

Enforcement should initially apply only to the four secured callables. There is no need to turn on project-wide Firestore or Authentication enforcement as part of this change.

## Hosting compatibility: two additional release gates

### Callable origin is blocked by the existing CSP

The active `connect-src` permits self, Google APIs, Google/reCAPTCHA and the Auth helper domain, but not the callable Functions origin:

```text
https://asia-southeast1-lakbaypanahon-1797e.cloudfunctions.net
```

The same omission exists in `functions/student-hosting-config.cjs`. A new client using direct Firebase callable URLs would be blocked by the production browser CSP even after Functions deployment.

Required approved change: add that exact origin to `connect-src` in the controlled release's generated Hosting headers, preserving all other security/cache headers. Do not broadly allow every Cloud Run or Functions hostname. No header or generator was changed in this audit.

### Do not upload the whole local Firebase configuration

Production `js/firebase-config.js` still exports `functions`. Production `js/ai-assistance-client.js`, imported by targeted practice, uses that export. The local configuration no longer exports it and the local helper uses a different `firebase-functions.js` module that is **not deployed**.

Blindly replacing the production configuration with the current local file would therefore break that existing import graph. This is a confirmed assembly incompatibility, even though isolated local testing passed with the local dependency graph.

Preferred scoped release: **retain the current production `js/firebase-config.js`, `js/ai-assistance-client.js` and their existing graph unchanged.** The new assessment client needs `app`, `auth` and `db`, which production already exports. The local configuration change is for emulator testing and is not necessary for production assessment behavior. Test the exact assembled release with that retained configuration before deployment approval; this mixed package has not yet been acceptance-tested.

Also exclude a pre-existing, unrelated keepsake-render exception-handling change in local `js/chapter-challenge.js`. Assemble its approved assessment additions on the production baseline rather than uploading that whole local file without review.

The earlier implementation file inventory described the local starting tree, not a clean diff against every current production dependency. This audit's fresh production comparison is the authority for release scope.

## Educational/reward compatibility

Read-only live catalog counts:

| Catalog | Active records |
|---|---:|
| Missions / mission quizzes / artifacts | 66 each |
| Chapters / chapter challenges / badges | 16 each |
| Eras | 4 |
| Main question bank | 1,320 |
| Practice questions | 687 |
| Chapter challenge questions | 165 |
| Daily challenges | 5 |

Offline checks against this fresh educational snapshot found:

- Every active mission has one active quiz and artifact, valid nonnegative integer XP, and a valid five-question selection with the current topic quotas.
- Each active chapter has one active challenge and badge.
- The authored correct answer grades correctly for all 1,320 main, 165 chapter and five daily questions, including existing game answer shapes.
- The current progression policy is version 1, 100 XP per level. No policy values changed.
- Full synthetic in-memory service runs using real catalog content for three representative missions succeeded with configured rewards. These were not real students and did not write Firestore.

These checks verify structural and grading compatibility, not independent historical/curriculum accuracy. No educational content was edited.

Existing learner records were deliberately not queried. Preservation is supported by the implementation's stable IDs, no mass migration/deletion, max-best-score logic and earlier emulator tests, not by a new production-wide balance reconciliation. Existing completions and earned timestamps remain in place; new server evidence does not retroactively certify pre-cutover claims.

Older clients cannot keep creating canonical rewards after the restrictive rules activate. They may still write allowed UI drafts or encounter a save denial; drafts cannot authorize server results. They should refresh. Already-open JavaScript cannot be forcibly replaced just by changing HTTP cache headers.

The new client includes an understandable restart notice: “Please restart this unfinished assessment. Your completed missions and earned rewards are still saved.” The quiz also explains when an old unfinished draft needs verified saving. It was verified locally; the exact production assembly and old-tab transition are still deployment acceptance gates.

## Exact proposed deployment inventory

This is the target scope, not an executable or deployment-certified package. Resolve the compatibility/header gates and test its exact hashes first.

### Hosting

Replace exactly these five current public assets:

```text
js/student-rewards-client.js
js/mission-assessment-client.js
js/quiz.js
js/chapter-challenge.js  [assessment changes only, production-baseline assembly]
js/daily-challenge.js
```

Add exactly:

```text
js/student-assessment-client.js
js/assessment-preview.js
```

Preserve all other 570 existing public file hashes, including production `firebase-config.js`, the AI/practice dependency graph, Priority 2 `mission-assessment.js` and `learning-draft.js`, content, styles, audio and images. Expected inventory after this patch: 577 paths. Change only the required Hosting `connect-src` origin; retain HTML `no-store`, JS/CSS `no-cache`, CSP script hashes and other headers.

`functions/student-hosting-config.cjs` needs a scoped header-generator correction or an equivalently reviewed release-only header patch. The source change is not implemented by this audit. Do not deploy from the repository root or a package containing unrelated teacher changes.

### Functions

Deploy only these four named functions in `asia-southeast1`, runtime `nodejs22`:

```text
startStudentAssessment
advanceStudentAssessment
resumeStudentAssessment
submitStudentActivity
```

Required runtime/source package:

```text
functions/index.js
functions/student-assessment.js
functions/assessment-callables.js
functions/student-rewards.js
functions/progression-policy.js              [unchanged helper dependency]
functions/assessment-shared/mission-assessment.mjs
functions/assessment-shared/daily-policy.mjs
functions/assessment-shared/progression-policy.mjs
functions/assessment-shared/practice-review.mjs
functions/assessment-shared/mission-review.mjs
functions/package.json                       [Node 22 declaration]
functions/package-lock.json
```

`functions/sync-assessment-policy.cjs` is a local build/parity gate, not an endpoint. Prepare an isolated reviewed Functions source directory with the dependency lock; do not upload every migration/build script from the working tree. Do not deploy `testStudentAuth` or `getLearningAssistance` accidentally through an unrestricted “all functions” command. They contain no reward writes, but are outside this release.

`server/assessment/server.mjs` remains retired locally and is not a Hosting/Functions deployment target. Do not deploy the standalone server.

### Rules/configuration

- Publish the reviewed `firestore.assessment.rules` candidate via an explicit isolated release configuration; never publish the unrelated working-tree `firestore.rules` wholesale.
- Add `learningSettings/securedAssessment` first with `enabled:false`, then enable only after all gates pass and approval covers that write.
- No existing catalog or learner document migration is required.
- Choose and bind runtime/build identities, approved operational settings and service activations before deployment. Do not assume the absent default identity will work.

## Security verification and legacy paths

The active rules source was fetched freshly during this audit and still hashes to:

```text
678be315fa0aecdbb09fc3cb88294c0f69493056e8c50389a254500234ac0496
```

It exactly matches the implementation's baseline. Running the scoped generator against that fresh source produces the current candidate byte-for-byte. Candidate hash:

```text
6b704af7ac7e6114851ce1a3e61ceaf2aaf2568587c4150bc51bafac90ae5849
```

The candidate disables client creation/update/deletion of canonical mission/chapter/daily completions, attempts and collectible ownership; disables profile reward updates; and denies direct access to all private assessment collections. Owner/approved-teacher reads and non-reward features remain. Overlapping generic matches were reviewed; none supplies an alternate canonical write grant in the candidate. The earlier real-emulator gate tested owner/other-user/private record denial and valid-looking paired exploit requests. This audit did not run live attack requests.

| Potential path | Current finding / cutover treatment |
|---|---|
| Deployed browser Firestore reward writer | Still active under current rules; close it with the restrictive candidate at cutover. |
| Old `submitStudentActivity` callable | No deployed instance found. Deploy only the secured issued-attempt handler under that name; raw payloads reject. Re-inventory immediately before activation. |
| Local legacy reward factory | Delegates to the secured handler; no old raw transaction implementation remains exported. |
| Standalone assessment server | Local startup is retired; not a deployment target. External/self-hosted endpoints outside this project were not inventoried. |
| `testStudentAuth` / `getLearningAssistance` | Source reviewed as non-reward paths; not deployed in this release. |
| Private evidence writes | Admin service only; authorization is enforced by the service because Admin bypasses client rules. |

Cloud Run inventory remains unverified while its API is disabled. Do not interpret the failed listing as a guarantee that no independently hosted service ever existed. Verify any external reward infrastructure with the operator before final release.

Public question keys remain readable by the approved design. Students can inspect educational keys; server grading secures the submitted result, issued identities and reward accounting, not unaided understanding or exam secrecy. Previously accepted legacy claims remain grandfathered and are not newly audited/certified.

## Performance, reliability and operational limits

No deployed assessment functions exist, so production callable latency/cold starts could not be measured read-only. Singapore function/database co-location is confirmed. Suggested pilot targets, **not measured facts**: warm answer-action p95 under 2 seconds; warm start/finalization p95 under 3 seconds; track cold-start outliers separately. Classroom-load acceptance is required before promising responsiveness.

The current implementation performs approximately 13 service calls for a five-question mission with three follow-ups. A new browser load can additionally try resuming an unknown legacy/local attempt ID before issuance. The client and default server timeouts are currently the SDK/platform defaults (about 70/60 seconds), not explicit tuned limits. [Callable timeout behavior](https://firebase.google.com/docs/functions/callable), [Functions runtime defaults](https://docs.cloud.google.com/functions/docs/reference/rest/v2/projects.locations.functions).

Offline instrumentation of the actual service against the fresh catalog, with synthetic saved prerequisites and no learner history, measured 656–695 approximate document reads and 20 writes per completed mission. These are planning counts, not billing telemetry or latency measurements. New learners with additional prerequisite reads, historical attempts/practice/review records, transaction retries, frontend reads and cloud drafts can increase them.

The same broad catalog/history context is read on each action/resume/finalization. History queries are bounded at 1,001 records per user/mission query; exceeding the reviewed bound fails closed rather than truncating. This is an operational limit, not unlimited history scalability. Index readiness and high-history behavior remain untested in production. Large read transactions can hold locks and experience contention. [Firestore transaction contention guidance](https://firebase.google.com/docs/firestore/transaction-data-contention).

Proposed pilot settings requiring approval and, where noted, a small tested configuration/source update:

| Control | Recommendation | Current implementation |
|---|---|---|
| Attempt TTL | 7,200 seconds (two hours), validate with teacher workflow | Supported policy field; no production value exists. Expiry requires restart, not reward loss. |
| New attempts/minute/student | 10 | Supported issuance policy only. Repeated identical request UUID does not create another attempt. |
| New attempts/day/student | 200 initially; monitor legitimate use | Supported issuance policy. Includes mission/chapter/daily starts, not every answer action. |
| Recorded unique actions/attempt | Retain 512 guard | Already implemented; repeated idempotent retries do not add unique actions. |
| Minimum instances | 0 for initial pilot | Avoid idle reservation charges; cold starts remain possible. |
| Maximum instances | Consider 2 per callable for pilot, then load-test | Code currently sets 10 per callable; four functions can have separate instance pools. Changing it needs approval/testing. Not a billing cap. |
| Concurrency | Consider explicit 8 per instance for pilot | Currently platform default; approval/testing needed. |
| Timeouts | Consider 30-second server / 35-second client with retry guidance | Currently defaults; do not change silently. Benchmark catalog/history operations first. |

The issuance counter is **not** an overall request-rate limiter. `resume` and other valid/invalid authenticated calls can still incur reads, and rejected starts may already have read context. App Check and maximum instances do not create a hard spend ceiling. Decide whether all-endpoint per-user throttling and stronger cost safeguards are required before enabling billing-backed production traffic; no such new enforcement was implemented in this audit.

Idempotent issuance/actions/submission, revision checks, real transaction atomicity and lost-acknowledgement restoration passed the local 28-test integration gate. They preserve accounting during failures, but do not make assessments work offline. Do not automatically issue a new paid attempt on an uncertain save. Keep the same request/attempt ID and recover its result.

## Cost estimate and assumptions

Cloud Functions deployment requires the billing change above even if usage later fits no-cost allowances. There is no AI inference or question-generation cost in this deterministic assessment service.

Read-only Cloud Billing catalog lookup returned these Singapore on-demand list rates:

| Resource | USD list rate | Catalog SKU |
|---|---:|---|
| Firestore Standard reads | $0.0369 / 100,000 | `ABBD-BED8-3752` |
| Firestore Standard writes | $0.1107 / 100,000 | `E500-6284-F2EA` |
| Cloud Run request-based CPU, Tier 2 | $0.0000336 / vCPU-second | `085C-A237-027A` |
| Cloud Run request-based memory, Tier 2 | $0.0000035 / GiB-second | `600C-3782-6708` |
| Request charge | $0.40 / million | Published request-based pricing; free allowances may apply. |

These region-specific catalog rates differ from a pricing page's default Iowa selection. The exact catalog responses are saved locally. [Cloud Billing catalog methodology](https://docs.cloud.google.com/billing/v1/how-tos/catalog-api), [Cloud Run pricing](https://cloud.google.com/run/pricing), [Firestore pricing/free quota](https://cloud.google.com/firestore/pricing).

Illustration only: 13 callable requests/session, one allocated vCPU, 256 MiB memory, average active time 0.5–2 seconds/request, 700 document reads and 20 writes/session; no retries, existing learner history or concurrency sharing. Gross estimates **before any free quotas/credits**:

| Mission sessions/month | Assumed workload | Assessment compute + document operations |
|---|---|---:|
| 1,000 | Small pilot | About **$0.51–$1.18** |
| 44,000 | 1,000 learners × 2 missions × 22 school days | About **$22–$52** |

These are not total-project quotes or guaranteed upper bounds. Add Auth/verification/network overhead, UI/draft reads, history growth, index reads where applicable, container/source storage, builds, logs, private-attempt storage, egress, retries, App Check/reCAPTCHA, and existing Hosting/AI/voice traffic. Cold starts and abuse can raise usage; shared CPU concurrency and unused no-cost allowances can reduce charges. Actual school usage is unknown and no billing account has been selected.

Firestore currently offers daily no-cost allowances; Cloud Run allowances are aggregated by billing account and location-sensitive credits. Do not assume they are all available to this application. reCAPTCHA has a no-cost tier up to 10,000 assessments/month; higher usage can incur charges and token TTL affects refresh frequency. It is not one new reCAPTCHA assessment per every quiz answer. [App Check Enterprise setup](https://firebase.google.com/docs/app-check/web/recaptcha-enterprise-provider), [reCAPTCHA pricing](https://cloud.google.com/security/products/recaptcha).

Choose a project budget and alert recipients before activation. Alerts-only budgets are notifications, not a hard charge cap; any supported spend-cap or automated response requires separate review/approval. Linking billing can also affect other already-enabled project services, which this assessment-only estimate excludes. [Google Cloud budgets](https://docs.cloud.google.com/billing/docs/how-to/budgets).

## Controlled deployment sequence — proposed, not executed

There is no atomic transaction across Hosting, Functions and rules. The safest cutover is a brief **fail-closed assessment-save window**, not continued use of permissive reward writers.

1. **Resolve approval gates first.** Approve billing/service activation, runtime/build identity, App Check reconciliation, exact scoped package/header corrections, operational settings and a maintenance window. Test the exact assembled release locally/under Node 22. Re-inventory production for drift.
2. **Take configuration snapshots and verify recovery.** Record active Hosting version/file map/configuration, ruleset/source, function inventory, relevant catalog/policy metadata, IAM/SA configuration, dependency/source hashes and rollout settings. Preserve the previous Hosting version and restrictive candidate. No current full learner backup/PITR recovery has been certified. If required, approve and verify a managed export/backup destination and its billable/storage implications separately; do not enable PITR, export data or create buckets without approval. Never plan a blanket database restore over later student work.
3. **Provision only approved infrastructure.** Enable the required APIs and bind tested runtime/build identities through the approved change. Do not reuse the broad App Engine Editor identity without a deliberate least-privilege decision. Keep debug/emulator environment variables out of production.
4. **Deploy gated secured endpoints.** Deploy only the four callables with Node 22, approved identity/resources and App Check enforcement. The protocol policy remains absent or `enabled:false`. Re-inventory names/revisions and verify the `submitStudentActivity` entry rejects legacy raw submissions. Do not deploy the standalone server or unrelated exports.
5. **Validate provider/readiness while gated.** Following separate live-test approval, use a disposable account to verify main-origin App Check, active Auth/profile validation and the expected disabled-protocol response. A provider/configuration failure stops the rollout; do not bypass enforcement to continue.
6. **Start the save pause; activate restrictive rules first.** Old tabs now fail closed on canonical writes. Their saved records remain readable and earned rewards remain intact. Freeze the accepted legacy population at this boundary. Read back the exact candidate hash and direct-write denials before proceeding.
7. **Publish the scoped Hosting release plus exact CSP origin.** Keep the compatible production Firebase configuration/AI graph, exclude unrelated chapter changes, and verify all 577 path hashes/security/cache headers against the reviewed package. The new client should show disabled/restart guidance while the protocol is gated. Tell active students to refresh after their current work is saved or wait for the window; do not promise old in-memory code can be forcibly upgraded.
8. **Enable for approved isolated acceptance, then normal traffic.** Only after endpoint/rule/header checks pass, set the approved protocol policy to enabled. The current policy has no UID canary allowlist, so enabling is global: run this during the controlled window, not claiming test-account-only activation. If a true allowlist pilot is desired, approve a small code/config extension first.
9. **Run bounded live tests.** Use disposable identities only: first pass/fail/retry/replay, all selected questions and follow-ups, prereqs, chapter badge, artifacts, daily reward, duplicate/stale/concurrent submissions, response interruption/reload, direct-write denials, private-record privacy, practice/collections and unchanged existing earned-record display. Register every test-owned document for guarded cleanup. Clearly distinguish seeded prerequisite fixtures from earned quiz results. Check narration text/device playback and Bayani integration without changing provider settings; any billable prompts need the relevant approval.
10. **Verify and reopen.** Confirm cleanup, exact runtime/rules/Hosting versions, no legacy reward writer, valid App Check, normal error/latency rates and preserved reward totals. Resume normal assessment entry only after acceptance passes. Monitor the agreed budget, contention/429s, provider rejection rates and latency.

Expected interruptions: assessment saving/start may be unavailable for a short window; old tabs need refresh; unfinished legacy quizzes can require restart. Lessons, narration, targeted practice and saved collections should remain readable. Current old-tab errors are generic save failures, not the new restart text; a clear maintenance announcement/holding release should be approved before the window. No announcement was sent or UI changed in this audit.

## Safe rollback

- Set the secured policy to disabled and stop assessment traffic if verification fails. Existing committed rewards/receipts remain intact.
- Disable/gate unhealthy Admin reward endpoints as necessary; client rules do not constrain Admin code.
- Keep restrictive canonical/private-record rules in place. **Do not restore permissive reward rules or the raw legacy callable.**
- Roll back to a tested secured-compatible function/frontend revision, or a prepared holding release that allows lessons/review while assessment saving is paused. There is currently no previous deployed secured Functions revision, so first-release recovery must include this holding/disable strategy rather than assume a working function rollback exists.
- Do not blindly restore the old Hosting quiz client: its writes will be denied under restrictive rules. Use the reviewed holding release for an understandable experience.
- Recover uncertain outcomes by request/attempt ID. Do not delete progress, reverse earned XP automatically, or restore a database snapshot over newly committed learner work. Any data repair needs separate approval.

## Decisions needed before deployment approval

1. Whether to link billing/upgrade to Blaze, which account/budget to use, and which dependent APIs may be activated.
2. Runtime/build service-account strategy and least-privilege roles; project-level deploy permission alone is insufficient.
3. App Check key reconciliation and domain/provider acceptance; no enforcement activation until legitimate access is verified.
4. Approval for the CSP correction, preserving production Firebase exports, scoped chapter assembly and exact-package retesting.
5. TTL/rate/resources/timeout/retention settings and whether broader all-endpoint abuse protection is a pre-release requirement.
6. Backup/recovery requirements, controlled save-pause/holding strategy and exact scope of disposable live acceptance.

Until those gates are resolved, the recommendation is **do not deploy**. No production change or Priority 4 work has been performed.

## Evidence files

- `priority-3-production-readiness-facts-2026-11-07.json`: current project, billing/services/IAM, active rules, Hosting hashes and catalog counts, including diagnostic limitations.
- `priority-3-readiness-permissions-appcheck-2026-11-07.json`: corrected permission check and project reCAPTCHA domain metadata.
- `priority-3-appcheck-readiness-2026-11-07.json` and `priority-3-appcheck-key-match-2026-11-07.json`: provider TTL/score, key mismatch and unverified individual-key/metrics requests.
- `priority-3-runtime-identity-readiness-2026-11-07.json`: Node 22 GA and absent default Gen 2 identity.
- `priority-3-readiness-rules-comparison-2026-11-07.json`: fresh active baseline and exact candidate generator match.
- `priority-3-catalog-compatibility-read-cost-2026-11-07.json`: offline selection/service compatibility and approximate read/write counts.
- `priority-3-live-catalog-grading-compatibility-2026-11-07.json`: 1,490 authored grading-key checks against the fresh catalog snapshot.
- `priority-3-singapore-pricing-2026-11-07.json` and `priority-3-firestore-singapore-pricing-2026-11-07.json`: read-only public pricing catalog responses.

Initial metadata queries contained one invalid IAM permission name and an unsuccessful individual-key lookup. Follow-up read-only checks resolved the permission check and established the key mismatch; the report does not misclassify those HTTP errors as absent user permissions. No services were activated to make an audit request succeed.
