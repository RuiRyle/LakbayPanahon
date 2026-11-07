# Bounded Workers REST transport proof

7 November 2026. **NO-GO for the current transport on Workers Free; hosted pilot and production remain NO-GO. Blaze stays on hold.** A narrow REST adapter runs all four existing assessment methods in local workerd without importing the Firestore SDK/gRPC graph or rewriting educational logic. However, the final clean harness run passed nine of ten test groups: concurrent duplicate submissions exhausted transaction retries and returned `UNAVAILABLE`. One request made **105 Firestore REST calls**, exceeding the documented Free-plan subrequest allowance. No security checks were removed and retry limits were not raised to hide this result. Adapter changes stopped at this finding.

No account, deployment, billing activation, IAM/rules/production configuration change, production request, real credential, student record or Priority 4 work was used. Experiments are isolated in `experiments/priority3-workers-transport`. Existing emulator fixtures seed a pinned educational snapshot. Stage 0 and its manifest remain unchanged; see [integrity evidence](priority-3-workers-transport-integrity-2026-11-07.json).

## What ran

Wrangler 4.158.0 / local workerd with Node compatibility, Node 22 fixture runner, demo Firestore at localhost:8180 and Auth at localhost:9099. The Worker imports the unchanged earlier service copy and its shared educational modules. The accepted core's `createAssessmentService` receives a new store implementing `run/get/list/stamp/create/set/update`.

The store uses HTTP `beginTransaction`, `batchGet`, `runQuery`, `commit` and `rollback`. Reads use the same transaction; writes queue until reads finish. `create` retains an absence precondition; `update` retains an existence precondition and update mask; timestamps are Firestore server transforms. History timestamps retain `toMillis()` and original serialized timestamp values. Query limits and document IDs remain those used by the core. Unsupported value types and unsafe integers fail closed. Only `ABORTED` retries the complete callback, at most five attempts. Other/unknown commit outcomes return an error rather than blindly issuing another reward.

Firebase documents [Firestore REST access](https://firebase.google.com/docs/firestore/use-rest-api). Production service-account OAuth is a separate requirement, not implemented by the emulator administrative header used here. This bounded adapter supports the assessment core's current types/queries; it is not a general Firestore SDK replacement.

The Worker graph contains isolated Admin Auth and App Check modules, but no Admin Firestore, Google gax, gRPC or Firebase Functions imports. It calls Auth `verifyIdToken(token, true)` and App Check `verifyToken` before creating the assessment service. No `FUNCTIONS_EMULATOR` exception bypasses those checks. Auth tokens are synthetic emulator tokens. App Check uses a generated RSA-signed fixture and a fixed test public key loaded from ignored local state; unlike the earlier probe, callers cannot supply a verification key. The test-only SDK key-fetch override is not a production JWKS design and must not be deployed.

Core grading, adaptive selection, progress, XP, artifacts, badges and receipts were not modified. The prior compact-catalog authority prototype was not replaced or ported in this round. This proof exercises the core's legacy transactional query path, not an integrated Workers compact-catalog/DO backend.

## Final test results

See [results JSON](priority-3-workers-transport-results-2026-11-07.json) and [emulator execution log](priority-3-workers-transport-tests-2026-11-07.log).

| Test group | Final result |
|---|---|
| Missing/invalid Auth; missing/invalid/foreign-audience/expired signed App Check | PASS: six denials before any Firestore requests |
| Start, advance, resume, submit; adaptive five-question selection; server marking; receipt replay | PASS: two incorrect answers score 60; expected 45 XP; issuance replay, result recovery and `replayed` flag preserved |
| Stale revision and same action UUID recovery | PASS |
| Four simultaneous duplicate submissions | **FAIL: bounded transaction retries exhausted; `UNAVAILABLE` returned** |
| Daily and chapter assessment grading | PASS: daily XP and exactly one chapter badge, no chapter XP inflation |
| Expired unfinished attempts; all four operations with protocol disabled | PASS: fail closed, no XP |
| Auth account disabled after issuance | PASS: rejected |
| Lost loopback HTTP response after submit committed | PASS: resume and same-attempt submit recover the committed result; one XP award |
| Disabled student profile, foreign attempt access, changed content, forged XP input | PASS: rejected |
| Existing completed progress/artifact timestamps and XP | PASS: XP 777 and timestamp 1000 ms preserved; no repeat reward |

The final harness exits nonzero because the concurrent-delivery assertion fails. The later tests still run and pass, and the local runtime/emulators are stopped. The failed concurrent group exits before its final XP/artifact assertions; do not claim that this particular failed run independently proved all reward invariants under retry exhaustion. Earlier functional runs passed that group, but the final result is authoritative for readiness.

Earlier harness issues were corrected without changing core logic: the initial replay assertion omitted the existing `replayed: true` flag, and the fixture mixed Timestamp/application cleanup instances from two installed SDK copies. One intermediate run had ten passing functional groups but failed cleanup; it is not represented as a clean suite pass. The final run exposed actual contention variability rather than a fixture issue. First/second-run JSON artifacts retain the earlier findings.

Lost response coverage is loss of the outer HTTP acknowledgement after a successful commit. It does not prove all ambiguous Google commit-response, process-crash or cross-database publication recovery cases. Those remain unverified.

## Measured operations and resource observations

Final bounded suite, **not a 30-student classroom or daily traffic measurement**:

| Operation | Requests | Successful responses | Read units | Committed write units | Firestore REST calls | Transaction attempts | ABORTED retries | Largest REST calls/request |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| startStudentAssessment | 18 | 11 | 529 | 30 | 202 | 12 | 0 | 20 |
| advanceStudentAssessment | 50 | 48 | 2,376 | 47 | 719 | 50 | 0 | 15 |
| resumeStudentAssessment | 9 | 3 | 115 | 0 | 57 | 8 | 0 | 15 |
| submitStudentActivity | 13 | 8 | 1,315 | 28 | 521 | 28 | 16 | **105** |
| **Total** | **90** | **70** | **4,335** | **105** | **1,499** | **98** | **16** | **105** |

Deletes: zero. Reads count point responses, returned query documents and minimum one read for empty queries, including failed transaction attempts. Writes count writes in confirmed commits; failed callbacks/commits are not added as committed writes. Seed data, integrity assertions, Auth operations, health and metrics requests are excluded. These are instrumented document-operation estimates, not production invoice/index-entry/Rules billing. Auth SDK network calls and future OAuth/JWKS traffic are **not included** in REST subrequest counts. Total Worker subrequests would therefore be at least the recorded REST count.

Earlier contention runs reached 27 and 48 REST calls in one request; the final run reached 105 despite the same five-attempt bound. Returning all concurrent responses successfully in one local run is insufficient to establish a safe upper bound. The backend's database transaction workload is materially different from a single counter increment.

Local inspector profiling succeeded using the WebSocket inspector endpoint. The final [sampling profile](priority-3-workers-transport-cpu-2026-11-07.cpuprofile) contains 662 samples over about 21.16 seconds of elapsed workload. It includes network wait, idle and runtime activity; it does **not** provide trustworthy Cloudflare-billed CPU per request. Wall duration is not CPU time. The longest final request took about 11.31 seconds under contention.

The final inspector snapshot reports 10,066,772 bytes of used V8 heap (about 9.60 MiB), 18,944,000 allocated V8 heap bytes, 1,547,544 embedder heap bytes and 1,707,529 backing-storage bytes. This is a snapshot, not peak whole-isolate memory. Test metrics retention and inspector instrumentation also affect it. No hosted CPU, peak memory, cold-start, latency or Free quota enforcement test was run.

## Workers Free assessment

[Current Workers limits](https://developers.cloudflare.com/workers/platform/limits/) list 100,000 requests/day, 10 ms CPU/request, 128 MB memory, 50 subrequests/request and six simultaneous outgoing connections. Network waiting is excluded from billed CPU. Local workerd did not enforce the hosted Free limit: the 105-call request completed locally with an error, rather than proving that workload can run on Free.

The observed subrequest budget is already unacceptable before adding real Auth/OAuth/key discovery or catalog authority validation. CPU remains unproven; RSA verification, parsing, adaptive selection and receipt validation cannot be removed to fit. Heap observations are encouraging but cannot certify the 128 MB limit.

As a request-volume illustration only, sixty mission assessments at roughly thirteen calls each plus thirty daily and thirty chapter assessments at three calls each is about 960 backend calls before resumes/retries. Doubling that for recovery is about 1,920, below the daily request allowance. This does not model unbounded retries, attacks, browser Firestore traffic or CPU; daily request volume is not the blocking dimension demonstrated here.

No new daily Firestore projection is justified. Prior compact-authority estimates of 31,992 routine reads / 34,570 publication-day reads came from a different integrated Node prototype and cannot be claimed for this unoptimized Worker path. A production-compatible transport plus compact authority would need its own integrated classroom measurement.

## Compatibility limitations and effort

The narrow core/store boundary avoids a major grading rewrite. The remaining production work is significant: supported real Auth/JWKS/OAuth flows, exact callable/CORS/error behavior, token caching without weakening revocation, query/type conformance, retry/deadline/subrequest budgeting, ambiguous commit recovery and the existing compact authority's coordination requirements. The local entrypoint has fixture trust, administrative emulator access and exposed metrics; it is not deployable code.

Planning estimate, not authorization: roughly **one to three engineer-weeks** to validate and harden this transport/security integration, depending on whether bounded retries/admission can meet Free limits. This excludes restricted-editor UI, durable publication/rollback implementation and hosted acceptance. A small further experiment could investigate retry budgeting and same-request client recovery, but it must preserve all transaction reads and receipt semantics. No such optimization was implemented after the failure. If safe operation requires an impractical transport rewrite or cannot fit the Free limits, keep the architecture on hold and reassess a supported Node host under a separately approved credential/budget model.

**Recommendation:** the REST mechanism is locally feasible for individual operations, but **the current Workers Free backend is NO-GO**. Stop at this bounded proof and wait for approval. Do not proceed to publication/DO implementation, hosted tests, account creation, deployment or Blaze activation.
