# Priority 3 local pilot preparation: results and open load gate

7 November 2026, Asia/Manila. **Local cleanup and preparation are complete; the simultaneous 30-student save-acceptance gate has NOT passed. Production remains NO-GO.** No billing, APIs, IAM, service accounts, live App Check settings, deployed code/rules, student progress or rewards were changed. All write-based tests used `demo-lakbaypanahon` on loopback. Priority 4 was not started.

## Release cleanup and exact manifest

Verified that `hosting/uploads/27f13e8fd4c4aeeca8c5bfa91ca36cb2809c5a4f0198271edb322859a96852ea.gz` was absent from all values in the approved Hosting map before removing it. The original manifest and verification are retained under `build/priority3-audit/manifest.before-pilot-cleanup.json` and `pilot-cleanup-before.json`.

The local builder now removes only unreferenced content-addressed gzip files in its generated upload directory; it rejects unexpected directory entries. A regression assertion requires exactly seven referenced payloads. No recursive deletion or source asset removal was performed.

- New manifest SHA-256: **`1b77328bf8ef9952a849e520965c9627a79e9ffea90df40693c2ef942c74a911`**.
- Old manifest: `7d686adfff404dcbc7fed66721425cfa8d58216a4d9e8277f032037d6c49899d`.
- **235 generated artifacts**, down from 236; seven Hosting payloads; 577 proposed Hosting paths, 570 unchanged production paths.
- Comparing inventories: the obsolete gzip is the sole removed artifact; every retained artifact hash is unchanged. The seven served update records and final Hosting map are unchanged. Manifest source hashes changed only for the builder and artifact test updated by this task.
- The release is still `activation:false`, local-only, and requires a fresh production preflight. The manifest itself has no self-hash entry; its external digest above is the review identity.

Fresh read-only production comparison at **13:26:22** confirmed active Hosting version `b984eba31379723a`, all 575 baseline file hashes, baseline Hosting configuration and active rules still match. Manifest source/artifact drift lists are empty. Protected rules remain SHA-256 `6b704af7ac7e6114851ce1a3e61ceaf2aaf2568587c4150bc51bafac90ae5849`. No deployment occurred. Evidence: `priority-3-final-blocker-production-check-2026-11-07.json`.

Protected rollback was revalidated by tests: restrictive rules are retained, the holding facade throws a readable unavailable error, and all four deny-only callable replacements import no Admin writer. The baseline permissive rules are not the incident rollback. Runtime reward/scoring source, client assessment modules, dependencies and educational content were not changed in this task.

## Successful regression, policy and legacy checks

Under local checksum-verified Node 22.23.4:

| Gate | Result |
|---|---|
| Full relevant unit/artifact suite | **204 passed, zero failed**. Includes cleanup integrity, protected rollback, policy parity, adaptive selection, drafts, Bayani and narration checks. |
| Actual Auth/Functions/Firestore HTTP security suite and assembled browser | **28 passed, zero failed** against the cleaned release artifacts. |
| Separate policy/legacy scenarios using actual catalog, emulator Auth/Firestore and trusted adapter/core | **Six scenario checks passed**, described below. These are not six additional `node:test` cases. |

The separate scenarios verified exact 7,200-second issuance TTL; three new starts accepted in a fixed server minute and the fourth rejected; stable request replay still succeeds at the quota; expired unfinished attempts are rejected without XP/deletion; a **seeded** daily count of 60 rejects another new issuance; and legacy replay preserves XP 777, best score 100, completion timestamp and artifact-earned timestamp at their original values. The daily-cap check did not exercise 60 actual quizzes. Existing regression cases cover failures/retries, replay, concurrent submissions, interrupted commits, stale revisions, unlocking, badge eligibility, grade types and receipt recovery.

Logs/evidence:

- `priority-3-pilot-unit-2026-11-07.log`: 204/204. The earlier targeted 45-case rerun is a subset, not extra unique coverage.
- `priority-3-pilot-acceptance-2026-11-07.log`: separate scenarios followed by the actual 28-case HTTP/browser suite.
- `priority-3-pilot-policy-legacy-checks-2026-11-07.json`: six explicit outcomes.
- `priority-3-browser-emulator-2026-11-07.json`: assembled page, refresh/lost-response recovery and SDK transport. The existing ViewTransition warning remains unrelated and was not changed.

These passing gates do not override the load failures below.

## Thirty-student load tests: important failure findings

### Dataset and test scope

The harness uses the earlier same-day **educational-only** catalog snapshot: 66 missions, 16 chapters, 1,320 questions and related public learning catalogs. It creates 30 separate synthetic Auth identities and profiles, with explicitly seeded valid prologue prerequisites. Seeding is not a claim that the prologue itself was exercised. No live learner data is copied.

Students start together without thinking time. Ten answer correctly, ten make two main mistakes, ten make three; failed attempts are intended to retry correctly. Checks retain five unique questions/topic quotas, compare adaptive topic and nearest-difficulty choices against the shared policy, verify weak-topic review difficulty, replay delayed actions, resume issued answers and reject stale revisions. The client-side harness admits at most **16 in-flight calls per endpoint** as an aggregate `2×8` hypothesis. It does not emulate two actual Cloud Run processes, cold starts or server-side enforcement. Harness-generated retries reuse the same identifiers; they are not a claim that production automatically retries on that exact schedule.

### HTTP stress run — failed / incomplete

The first attempt correctly failed because the test students lacked prologue completion. That fixture error was corrected without weakening prerequisites.

The corrected HTTP burst subsequently failed under local worker/transaction pressure. Its captured record contains **436 completed call attempts: 46 timeouts and ten expected revision-conflict denials**. Some calls were still pending when the failed harness was stopped. A total of 142 emulator-runtime processes was observed on the host during the buildup; the emulator did not reproduce a bounded pair of Cloud Run replicas. The run was stopped so its CLI could clean up its demo workers. It is **not** a successful end-to-end class test or a trustworthy production latency forecast.

Evidence: `priority-3-pilot-http-stress-2026-11-07.json` and `.log`. The initial missing-prerequisite fixture result is retained separately.

### Bounded trusted-adapter run — save contention reproduced

A second run removed Functions HTTP-worker spawning from the test path. It invoked the **actual packaged callable adapter**, verified real emulator Auth tokens, and used actual Firestore transactions in one Node process. App Check bypass was confined to the guarded demo harness. This was not a mock store, but it also was not an HTTP/Cloud Run benchmark.

| Captured endpoint attempts | Count | Local p95 service time | Unexpected failures in captured sample |
|---|---:|---:|---:|
| Start | 30 | 1.78 s | 0 |
| Advance, including follow-ups/action recovery | 350 | 1.06 s | 0; ten intentional stale-revision denials |
| Resume | 10 | 0.84 s | 0 |
| Submit attempts, including retries | 33 | 21.68 s | 33 unavailable errors |

All 30 issuances and main/follow-up progression reached the save stage with five-question/adaptive checks intact. **The class did not complete successfully.** The 33 submit entries are captured request attempts, not 33 unique students. Because the parallel harness fails on a rejection, some operations remained pending during cleanup; later client-terminated errors are fixture shutdown diagnostics. This run did not verify every student's final balance or successful retry-after-save outcome. Do not infer either duplicate XP or universal progress loss from it.

Logs show Firestore transaction lock timeouts. The failing runs are preserved rather than replaced by a green regression log: `priority-3-pilot-adapter-stress-2026-11-07.json` and `.log`.

### Minimal controls narrow the cause, but do not certify production

Without importing assessment or reward code, two transactions read separate user records and write separate records. The point-document case committed both. Replacing point reads with filtered queries on a shared collection caused **both transactions to abort with code 10 / Transaction lock timeout**, even though users differ. This reproduced with an empty collection, an unrelated existing record, and existing matching records. Each diagnostic transaction had `maxAttempts:1` and a barrier forcing overlap; it is not a production retry-policy simulation.

The final controls used a separate **local emulator** database named `pilot-control`, leaving the default-database acceptance suite isolated. No production database was created.

This demonstrates that the observed query/write contention can occur without LakbayPanahon code and is not explained only by Functions worker pressure. The assessment service does perform history queries and canonical writes within a transaction, so it exercises this pattern. It does **not** establish that production Firestore will fail identically, nor prove that every production index/transaction path is adequate. Firebase documents transaction differences in the emulator, potentially slow lock release, and the lack of compound-index enforcement. [Official emulator limitations](https://firebase.google.com/docs/emulator-suite/connect_firestore).

Evidence: `priority-3-pilot-lock-controls-2026-11-07.json` and `.log`. The query controls are observed failure patterns, not extra passing application tests. The separate security suite still passes; functional assertions alone do not establish class-scale availability.

## Evaluation of proposed pilot limits

| Proposal | Supported conclusion / recommendation |
|---|---|
| Two-hour attempt TTL | Exact issuance and expired-attempt behavior pass locally. Retain as a proposal; no production setting changed. Daily server-midnight expiry remains separate. |
| Per-student new issuance limit | 3/minute and seeded 60/day boundary checks pass with recovery IDs preserved. These are more conservative than the inert release JSON's 10/minute and 200/day. That JSON remains unchanged; selecting different production numbers requires explicit approval and artifact/configuration review. |
| All-endpoint UID throttling | Still **not implemented or load-validated**. The issuance counter does not bound advances/resumes. A proposed 60/minute, burst-20 limiter needs an approved local design/test step; school IP alone must not be the classroom hard cap. |
| Minimum instances zero | No local evidence justifies paying for warm instances. Keep the cost-conscious proposal, but real Cloud Run cold-start latency has not been measured. |
| Two maximum instances per callable | Not validated by the Functions emulator. Keep as a provisional ceiling, not a proven 30-student capacity claim. Do not increase it to hide an unresolved query-lock result. |
| Concurrency eight | The 16-slot admission test did not pass the final-save stage. No tested numeric replacement is justified. Investigate the query/transaction test gap before endorsing this production setting. |
| Timeouts | Do not simply lengthen student waits to declare success. Captured submit p95 already exceeds the proposed responsive-save target. Recheck transaction scope/index behavior and recovery under an appropriate controlled test before tuning deadlines. |

**No operational settings, runtime options or reward architecture were changed in response to the failed stress test.** A local-only diagnosis/plan for transaction query scope, emulator behavior and distributed throttling can be separately approved. Any proposed correction must preserve trusted grading, prerequisite rechecks, idempotency, progress/reward atomicity and legacy records. Production measurement, if later chosen, needs explicit isolated-test/infrastructure approval; this task does not authorize it.

## Dependency risk and App Check deliverables

- `priority-3-dependency-risk-assessment-2026-11-07.md`: six affected production nodes, two underlying advisories, reviewed reachability, conditional low likelihood for these endpoints, potential availability impact, in-range update limitations, current/planned mitigations and a proposed exception ending no later than 7 December 2026. **The owner has not accepted that exception.** No force/override or package change was made.
- `priority-3-appcheck-repair-procedure-2026-11-07.md` and `priority-3-appcheck-repair-proposal-2026-11-07.json`: select the existing restricted SCORE key with SHA-256 `4dd79a7261ebeccc1a451e448dbac7f3ba1e246733d573b1cd759ec92bb41d3a`, created 27 October at 04:09:37Z, subject to owner confirmation. Exact public key/resource, App Check `siteKey` field mask, matching frontend setting, fresh timestamp precondition, readbacks, partial-failure handling and verification requirements are prepared. No live key/configuration/frontend change or attestation occurred.

## Exact local changes in this task

Modified:

- `functions/prepare-priority3-readiness.cjs`: generated-payload cleanup only.
- `tests/priority3-readiness.test.cjs`: require seven map-referenced payloads.
- `build/priority3-release/manifest.json`: regenerated hashes/inventory.

Removed: the single obsolete gzip named above. Every retained release artifact has its previous hash.

Added test files: `tests/priority3-pilot-load.cjs`, `tests/priority3-lock-control.cjs`, `tests/priority3-pilot-checks.cjs`. Added documentation/evidence includes this report, dependency risk assessment, App Check repair procedure/proposal, emulator logs and result JSONs. A GET-only preparation helper under `build/` read key metadata/configuration timestamps to populate the inert proposal. These are not Hosting/Functions release additions.

## Remaining blockers and approvals

1. **Newly observed local load gate:** synchronized class saves have not passed. Approve a focused local diagnostic/design step before any assessment-runtime or query-scope correction; do not treat this report as production capacity certification.
2. Owner decision on the time-limited dependency disposition or a separate compatibility remediation plan.
3. Owner-confirmed App Check key selection, followed only under separate production-configuration approval by the narrow repair and real attestation verification.
4. Existing Blaze/API/build-runtime IAM/backup/monitoring requirements and a fresh approved release preflight.
5. Separate explicit approval for all production configuration, Functions/Hosting/rules publication, rollout activation and isolated live acceptance. No production action is included here.

Billing remains unlinked in the fresh metadata check. Existing progress is untouched. **Awaiting approval; no Priority 4 work.**
