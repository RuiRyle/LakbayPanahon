# Priority 3: local secured reward implementation

Scope: the six approved decisions in the [implementation plan](priority-3-secure-implementation-plan-2026-11-07.md). **Local implementation and emulator testing only. Production remains unchanged and the production security gaps remain until a separately approved cutover. No Priority 4 work was performed.**

## Corrections

| Original defect | Local correction | Evidence |
|---|---|---|
| Mission completion/XP could be claimed through direct client writes | New authenticated callable service issues assessment attempts, controls question identities/adaptive sequence, grades answers and verifies prerequisites. The scoped rule candidate denies canonical client writes and profile reward updates. | Real Auth/Functions/Firestore tests reject the original valid-looking forged paired request and accept legitimate server results. |
| Chapter completion/badges could be claimed without required work | The server checks all existing active chapter missions and grades the issued chapter challenge. Completion and badge creation share one transaction. Direct chapter/badge claims are denied. | Premature issuance/direct claims fail; legitimate challenge game types and repeated badge requests pass. |
| Legacy callable graded the entire bank rather than the selected five | The legacy export now routes exclusively to issued-attempt submission. Raw scores/question lists cannot be submitted to it. The server selects and grades exactly the configured five questions from the larger bank. | Real callable tests issue five from a larger bank, grade those five, reject arbitrary IDs/raw payloads, and preserve topic quotas. |

All three are addressed in local code and the local rules candidate. This is not a claim that production has been secured or deployed.

## Runtime architecture

The shared service lives in `functions/student-assessment.js`. `functions/assessment-callables.js` performs callable authentication, revoked/disabled token verification, and error mapping. `functions/index.js` exposes:

- `startStudentAssessment`: owner-bound issuance with a stable request UUID;
- `advanceStudentAssessment`: revision-checked answer/backtrack/follow-up actions;
- `resumeStudentAssessment`: filtered owner-only state/result restoration;
- `submitStudentActivity`: finalization by issued attempt ID/revision only.

Production callables enforce App Check. Only the Functions emulator disables that requirement, while still requiring actual Auth-emulator identity tokens. Profile role/status is checked inside every service transaction. No client flag can enable privileged server writes.

The old reward function's raw submission implementation has been removed. Its exported factory delegates to the same secured handler. The standalone `server/assessment/server.mjs` entry is retired and throws before credentials/database startup, preventing activation of a second legacy authority through that launcher. Older pure scaffolding tests remain useful but are not counted as proof that it is the active service.

The browser facade no longer grades or writes canonical rewards. It sends answers and issued-attempt identifiers through the Functions SDK. Scores, reward amounts, completion flags, arbitrary question sets, and client-owned drafts cannot authorize rewards.

### Adaptive flow and content

The Functions package contains exact packaged copies of the browser's pure selection, review, daily, and progression policies. `sync-assessment-policy.cjs --check` detects drift; the only import extension adjustment is the server `.mjs` reference in mission review.

- Initial mission selection remains five questions with existing topic quotas and available difficulty rules.
- Server answer actions apply the existing correct/wrong difficulty steps and quota-preserving next-question swap.
- Changing an earlier answer clears later answer/follow-up evidence. Stale revisions cannot overwrite newer attempt state.
- Follow-ups remain up to three existing practice questions, with Priority 2 weakness/difficulty preference before novelty, configured difficulty order, and graceful exhausted-pool handling.
- Wrong follow-ups affect review topics but not the main score or passing threshold.
- Targeted practice remains non-rewarding. Its existing review evidence influences support/difficulty selection without establishing an assessment pass.
- Chapter grading supports existing choice, matching, trade simulation and evidence-decision answer shapes.
- Daily selection, grading, Philippines date and streak checks use server time.

No historical content, answer key, authored XP amount, passing threshold, badge requirement, chapter count, or lesson/narration asset was changed. Synthetic questions in emulator fixtures are test data only.

### Transaction and replay protection

The Admin store adapter buffers writes until reads finish. Finalization reads the profile, prerequisites, catalog/policy, private attempt, canonical completion, ownership and history in the transaction, then queues the writes. A failed commit cannot leave a partial completion/reward.

First passing completion adds only the configured mission/daily XP. Chapter completion adds its badge and no chapter XP. Stable completion/ownership IDs and transaction retries prevent duplicate awards. Concurrent different eligible missions retain both increments through the shared profile read/update.

Submission and action retries reuse identifiers. Same-request replay returns the committed result with current XP/level; conflicting UUID reuse or stale revisions is rejected. Issuance is idempotent as well. Expiry, content-digest changes, disabled/revoked identities, incomplete/unissued answers and unsupported payload fields fail closed.

The actual browser test drops a successful save response after the server committed, then reloads the page. The page restores the saved result without another XP award. A separate real transaction test injects a create collision during commit and confirms no partial XP, progress, ownership or attempt result remains before a safe retry.

## Existing students and rules

Existing valid canonical records remain readable and usable as prerequisites. They suppress a second XP award. Replays retain the earlier earned timestamp and maximum saved best score; existing XP and ownership are not recalculated, revoked, reset or mass migrated. Missing eligible ownership can be backfilled after a valid pass without more XP. Malformed/conflicting records fail rather than being automatically repaired.

Legacy records are historical records, not retroactively certified evidence. Any inaccurate claim saved before a future cutover remains grandfathered under the user's preservation decision. After cutover, clients cannot create a new legacy-shaped completion to exploit that compatibility.

`firestore.assessment.rules` is the **separate local candidate**, based on the exact recorded production rule source (SHA-256 `678be315fa0aecdbb09fc3cb88294c0f69493056e8c50389a254500234ac0496`). It blocks client canonical reward/attempt/completion writes, profile reward updates and all direct access to private server evidence. Existing owner/approved-teacher reads, bounded profile changes, cosmetics, drafts and non-reward practice remain available.

The existing `firestore.rules` working-tree file has unrelated pre-existing changes and was not edited by this implementation. Root `firebase.json` and `.firebaserc` were not changed. Nothing was published.

New private structures for future attempts only:

- `serverAssessmentAttempts`: issued content, answers, revision, digest and committed receipt;
- `serverAssessmentRequests`: issuance request-to-attempt binding;
- `serverAssessmentHistory`: selection history;
- `serverAssessmentUsage`: bounded issuance counters.

The proposed `learningSettings/securedAssessment` policy is **seeded only in the demo emulator**. Its enablement, operational limits and expiry values have not been written to production. Test thresholds are not approved production settings.

Existing unfinished client-only drafts are not imported as trusted evidence. The student page explains when a fresh verified attempt is needed, while retaining saved completions/rewards. New server-owned attempts restore across reloads. Priority 2's draft version protections remain unchanged.

The explicit exploration preview has a separate read-only catalog grader. It never writes canonical records or calls the reward service for mission/chapter previews. It is not a production fallback. Daily rewards always require verified saving.

## Exact implementation files

The [SHA-256 manifest](priority-3-implementation-manifest-2026-11-07.json) records the exact implementation/test/configuration files. Files changed or added for this implementation are:

**Functions and server entry:**

```text
functions/student-assessment.js
functions/assessment-callables.js
functions/student-rewards.js
functions/index.js
functions/sync-assessment-policy.cjs
functions/assessment-shared/mission-assessment.mjs
functions/assessment-shared/daily-policy.mjs
functions/assessment-shared/progression-policy.mjs
functions/assessment-shared/practice-review.mjs
functions/assessment-shared/mission-review.mjs
functions/build-trusted-assessment-rules.cjs
server/assessment/server.mjs
```

**Browser integration:**

```text
js/student-assessment-client.js
js/student-rewards-client.js
js/mission-assessment-client.js
js/assessment-preview.js
js/quiz.js
js/chapter-challenge.js
js/daily-challenge.js
js/firebase-config.js
```

`firebase-config.js` only extends the existing loopback-only emulator project allowlist to include the dedicated demo test project. The production Firebase project/configuration is unchanged. No CSS/HTML redesign or framework was introduced.

**Local security/configuration:**

```text
firestore.assessment.rules
firebase.assessment-emulator.json
```

**Tests and fixtures:**

```text
tests/student-assessment-emulator.cjs
tests/student-security.test.cjs
tests/secured-browser-emulator.cjs
tests/secured-assessment-client.test.cjs
tests/mission-flow.test.cjs
tests/fixtures/assessment-api-browser.cjs
tests/mission-quiz-browser.cjs
tests/chapter-challenge-browser.cjs
tests/daily-challenge-browser.cjs
tests/student-artifacts-browser.cjs
tests/student-achievements-browser.cjs
tests/priority3-collection-audit.cjs
```

Documentation/evidence: this report, approved-plan status annotation, implementation manifest, unit/emulator/browser logs and report, and refreshed offline `docs/validation/web-release-local.json`. The dependency audit reports no missing or rejected references. Private build/emulator artifacts are not web release assets. No package dependencies or billing settings were changed.

## Legacy test repair

The old 10 failing security fixtures are replaced by the current-contract release gate in `tests/student-security.test.cjs`, which imports the comprehensive Auth/Functions/Firestore suite. This is a contract update, not a declaration that the old browser-authority tests passed:

- Missing browser dependency/old direct-write fixtures now exercise authenticated callable success plus direct-write denial.
- Raw caller-supplied UUID/question fixtures now obtain server-issued attempts; raw legacy payloads must fail.
- Required progression/assessment policy and valid avatar catalog documents are seeded locally.
- Profile changes include the required server timestamp; protected fields still fail.
- Other-user reads, unfiltered queries, canonical writes and forged paired claims remain denied.
- Legitimate server results, exact reward amounts, concurrency, prerequisites, matching/trade/evidence grading and saved ownership remain positively tested.

Pure mission selection/review tests remain in `mission-flow.test.cjs`. Browser-grading transaction mocks were replaced by actual emulator transaction tests. Older UI fixtures use an explicitly labelled callable fixture adapter; they are not represented as security tests. The real student page separately uses actual Firebase SDKs and real emulators, including refresh/lost-response recovery.

## Verification results

Final results: **176 unit tests passed, zero failed; 28 Auth/Functions/Firestore integration tests passed, zero failed. Total: 204 automated tests passed.** The final integration gate includes the actual browser flow, committed-response loss/reload recovery, all original exploit denials, real commit-failure atomicity, configured follow-up difficulty, targeted-practice reinforcement, progress privacy and cosmetic-rule assertions. The last complete gate finished successfully and stopped the emulators.

Reproduce the actual security release gate locally:

```powershell
node functions/sync-assessment-policy.cjs --check
firebase.cmd emulators:exec --only auth,functions,firestore --project demo-lakbaypanahon --config firebase.assessment-emulator.json "node --test tests/student-security.test.cjs"
```

The suite refuses non-demo/non-loopback targets. Auth identities and all seeded data exist only in the emulators. Emulator processes shut down after the command.

Evidence:

- `priority-3-unit-regressions-2026-11-07.log`: 176 passing unit checks, including Bayani, narration, policy parity, progression, drafts, review and transport idempotency.
- `priority-3-secured-emulator-acceptance-2026-11-07.log`: final complete emulator release gate.
- `priority-3-browser-emulator-2026-11-07.json`: real HTML/SDK/callable page flow, mid-quiz refresh, lost-response refresh and exact saved balance.
- `priority-3-secured-emulator-complete-2026-11-07.log`: earlier 26-case complete gate, including actual failed-commit rollback and targeted-practice parity.

All eleven relevant standalone browser fixtures passed in their latest runs: mission quiz, storage-blocked quiz, chapter challenge, daily challenge, student review, practice hint evidence, Bayani AI, story, artifact collection, achievement collection and achievements layout (desktop/mobile gallery/exhibit). The UI-only fixtures do not independently prove server authority; the emulator gate does. **No failing tests remain in these final runs.**

Initial failures were not hidden: three early assertion/fixture assumptions were repaired; the real browser exposed an unsupported App Check import which was fixed; static-import stripping and missing callable mocks in old UI fixtures were updated. A concurrent Chrome startup timed out and passed when rerun alone. One filtered Windows command interpreted `|` as a pipe and did not run the intended tests; the final unfiltered gate covers them. No security assertion was relaxed to accept a forged reward.

The real browser report records an existing view-transition opt-in `InvalidStateError`. It did not prevent assessment, restoration or saving. This unrelated animation warning was not changed as part of the reward work and remains a limitation, not an unreported clean-console claim.

## Production requirements and remaining limits

Before any activation, obtain separate approval for the exact Functions/Hosting/rules/configuration package and isolated production acceptance. Required checks:

1. Read current production rule/function/Hosting baselines and inventory every reward-capable endpoint. Reject unrelated working-tree changes and stale baselines.
2. Confirm Functions billing/runtime, service-account permissions and deployment readiness. No upgrade or paid activation has been performed. Local emulation used host Node 24 while the configured Functions runtime is Node 22; Node 22/deployed runtime acceptance is still required.
3. Verify production App Check token acquisition and enforcement with the existing web app/provider. The client uses the existing App Check site key from Bayani settings without requiring AI to be enabled; this integration must be checked in production. Emulator App Check bypass is not production proof.
4. Approve concrete attempt expiry/rate limits and retention policy. No automatic production attempt cleanup is configured. History queries are scoped by user and mission with a bounded result limit; high-volume history/index behavior needs production readiness review, not silent truncation.
5. Publish the compatible service/frontend and restrictive rules within the approved save cutover window, with readiness gating. Never fall back to browser rewards if the service is unavailable. Active old tabs may require refresh/restart of unfinished assessments.
6. Run bounded isolated hosted checks after approval, including actual mobile/audio checks if required. No live student/account mutation tests or actual paid AI/voice calls were performed here.

Public educational answer keys remain readable by the approved design. The correction secures result/reward authority and question-set identity; it cannot prove unaided understanding or exam secrecy. Existing pre-cutover claims are not retroactively audited or certified.

The server now records assessment answers as students advance. More network round trips and contention/read costs are possible compared with browser-only grading. Classroom-load latency and quota behavior are not benchmarked by these fixtures. Network failure preserves server answers/receipts; the browser reports retry/reopen guidance instead of granting local rewards.

No physical multi-device test was performed. Real transaction concurrency, stale revisions, independent browser restoration and profile accumulation were tested locally. Production network, provider App Check, indexes, credentials, limits and deployment health remain separate acceptance work.

Rollback must retain restrictive canonical rules and disable/gate unhealthy Admin reward endpoints. Revert only to a secured-compatible service/frontend, or pause assessment saving while lessons/review remain available. Do not restore permissive reward rules or overwrite learner data with a database snapshot. Preserve committed receipts and resolve uncertain requests by attempt ID.

**Local work only. Await separate approval before production deployment or Priority 4.**
