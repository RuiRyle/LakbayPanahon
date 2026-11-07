# Priority 3 concurrent-save diagnosis and proposed correction

7 November 2026. **Diagnosis and design only. Production remains NO-GO.** No assessment/reward implementation, transaction options, security rules, dependencies, runtime limits or release artifacts were modified. Only a diagnostic test harness and this report were added. All write-based work used isolated demo Auth/Firestore emulators. No Priority 4 work occurred.

## Conclusion

The most likely cause of the reproduced cross-student save failures is an interaction between an unnecessary transactional history query and the emulator's query/write locking behavior. `submit` calls `loadAttempt`, which rebuilds the full learning context, including a filtered query of `studentQuizAttempts`. The same transaction then creates a new document in that collection. Different students have different document IDs, but the emulator reproduces lock contention for this query/write pattern even when filters identify different users.

This is supported by controls without assessment code. It is not proof that production Firestore will behave identically, and it does not excuse the unnecessary application read scope. Same-user profile/completion contention is separately legitimate and must remain transactionally protected.

Recommendation: approve a focused local correction to separate issuance-time adaptive history from submission-time authoritative verification. **Do not implement an external unvalidated history snapshot as reward evidence, increase instance limits, remove prerequisite reads or restore client rewards.** The correction below is a proposal requiring approval and tests, not a proven implemented fix.

## Current transaction and authority

`functions/student-assessment.js`:

- `assessmentStore` invokes the Firestore SDK transaction with its existing defaults. Its adapter buffers every create/set/update until the callback finishes reading. Source-level calls that enqueue writes before later reads do **not** issue Firestore writes early. No read-after-write ordering violation was identified.
- `transact` reads the user's active student profile and secured policy. `loadAttempt` reads the deterministic owner-bound private attempt, validates ownership/expiry, then calls `context`.
- `context` checks chapter/era/mission identity and prerequisites; loads catalog questions and practice; reads deterministic private history; queries canonical quiz attempts, practice sessions and review events to compute learning support. User-history queries are already bounded and filtered by **both UID and mission**, not unfiltered scans. Nevertheless, they are repeated on submit, resume, answer advance and duplicate recovery.
- `submit` grades the issued five questions and separately diagnoses follow-ups. It reads deterministic canonical completion, progression policy, collectible eligibility query and deterministic ownership. It atomically creates first completion/XP, saves the canonical quiz attempt, merges private history and stores the result on the issued attempt.
- Issuance UUID maps to a private owner/request record. Action UUIDs/revisions protect answers. Submission's idempotency receipt is the result on that issued attempt. There is no need for a new unrelated receipt collection to resolve this failure.

Different users do not write the same profile, completion, private attempt or history document. Catalog and policy documents are shared **reads**, not a shared global reward counter. The issue is therefore not a single global XP document. Same-user distinct rewards intentionally share the profile; same-mission rewards also share canonical completion/ownership/history and must serialize or retry.

The adaptive history fields returned by `context` (`mastery`, `seen`, `previous`, `seenAdaptive`, attempt numbering) are consumed when issuing an attempt and are snapshotted into its private state. Final grading and reward eligibility do not use a newly computed `ctx.mastery`. `nextMain`/`nextFollowup` use attempt-held state plus catalog policy. This makes recomputing history on submit unnecessary for reward correctness. Existing private-history merge on commit is different: it is a deterministic document read/update that must remain atomic to prevent lost history.

Another unnecessary cost: `loadAttempt` rebuilds full context even when an attempt already has a committed result. Duplicate submission therefore performs catalog/history queries before returning its existing receipt. Recovery should not depend on current catalog availability after a valid committed result, subject to continued account authorization and sound receipt validation.

## Reproducible measured comparison

Harness: `tests/priority3-save-diagnostic.cjs`. It invokes the **unchanged packaged service** against actual demo Firestore transactions. Synthetic students have valid seeded prologue prerequisites; main questions/follow-ups are answered through server-issued service methods before the measured save wave. Preparation is sequential to isolate save concurrency. Auth emulator creates identities; timed core saves exclude HTTP/Auth-token verification and Functions worker startup. No outer retry is added to the measured wave; normal SDK transaction retries remain enabled. All calls settle before balance checks and serial recovery.

The earlier HTTP worker burst is retained as earlier evidence but is not used to estimate production capacity. A Functions emulator can spawn many workers and does not reproduce two Cloud Run instances with concurrency eight. These measurements also are not production latency promises.

| Save wave | Successful responses / requests | Distinct results committed in wave | p50 | p95 | Retried transaction callbacks |
|---|---:|---:|---:|---:|---:|
| Sequential, five students | 5/5 | 5 | 0.306 s | 0.335 s | 0 |
| Five simultaneous students | 5/5 | 5 | 3.475 s | 8.114 s | 6 |
| Ten simultaneous students | 10/10 | 10 | 9.922 s | 17.959 s | 26 |
| Thirty simultaneous students | 5/30 | 5 | 19.696 s | 22.098 s | 113 |
| Same student, same attempt submitted three times | 3/3 | 1 | 3.332 s | 3.704 s | 2 |
| Same student, two distinct passing attempts | 2/2 | 2 | 2.181 s | 3.760 s | 1 |

All 25 terminal failures in the thirty-student wave were gRPC **10 ABORTED / Transaction lock timeout**. They were not expected revision conflicts, grading failures or prerequisite denials. The 113 callback retries include unsuccessful retries; they are not 113 separate student reward events. No per-callback error classification was instrumented, so do not describe that count as a precise count of particular abort messages.

After the wave settled, all 25 failed attempts succeeded on a serial retry with the same attempt/revision. Recovery p95 was **0.344 s**. Every tested student ended with exactly 45 XP, one completed mission at best score 100 and the expected artifact. Duplicate same-attempt requests stored one committed attempt result; separate passing attempts stored two results but paid only one mission reward. The result objects may each report the receipt's original XP amount on replay; that is not another balance credit.

Additional fresh-emulator controls:

- Two passing attempts scoring 100 and 80 for one student both returned successfully, with two callback retries, final best score 100 and XP 45.
- Concurrent mission and daily completions for one student returned successfully, with one callback retry, both canonical completions saved and final XP **55 = 45 + 10**. This demonstrates no lost profile increment in this tested path.
- An injected real commit collision (`ALREADY_EXISTS`) failed atomically: no XP/completion/result was partially saved. Retrying the unchanged attempt succeeded. Deliberately discarding the committed result and resubmitting returned the saved receipt with unchanged XP 45. This is a lost-acknowledgement simulation, not a physical network disconnection; previous browser tests cover HTTP response loss separately.

Evidence: `priority-3-save-diagnostic-2026-11-07.json` / `.log`, and `priority-3-save-diagnostic-extra-2026-11-07.json` / `.log`. Both diagnostic runs completed. Completion of diagnosis is **not** a passing thirty-student load gate.

## Controls separating emulator behavior from application behavior

Two-user minimal tests force overlapping transactions using a barrier, with `maxAttempts:1` **only for the diagnostic controls**, not for assessment transactions:

| Minimal control | Result |
|---|---|
| Read distinct documents, write those distinct documents | Both committed; about 37 ms combined in first run. |
| Filtered queries for distinct users, write the queried collection | Both aborted with lock timeout; about 2.06 s. |
| Same filtered-query pattern, write a different collection | Both committed; about 24 ms. |

The second run reproduced the same distinction. There is no assessment, XP, question grading or reward function in those controls. Earlier empty/existing-result controls also reproduced the query/write behavior. The correlation is specific enough to support the hypothesis, but it is not a trace of the emulator's internal lock implementation or proof about production index-range locking.

Firebase documents that emulator transaction behavior differs from production, locks may be slow to release, and compound-index requirements are not enforced locally. Real hosted performance/index acceptance remains a separate future gate. [Official emulator limitations](https://firebase.google.com/docs/emulator-suite/connect_firestore).

**Confirmed application finding:** submission performs learning-history reads whose freshly computed output is unused for grading/reward, and queries the same canonical attempts collection it writes. **Confirmed environment finding:** the emulator can abort independent-user query/write controls without application code. **Not confirmed:** a production data-loss, duplicate-XP or unauthorized-reward defect caused by this contention. Tested recovery and atomicity held.

## Safe alternatives and recommended first correction

### A. Recommended: split context by purpose, keeping authority transactional

Introduce explicit internal modes/functions rather than optional booleans that can accidentally bypass verification:

1. **Issuance learning context**: retain current adaptive history selection behavior, quotas, weakness/difficulty rules, count/order and history bounds. No change to first issuance semantics in the initial correction.
2. **Issued-attempt verification context**: validate current authoritative catalog/policy digest and prerequisites, but do not query `studentQuizAttempts`, `studentPracticeProgress` or `studentReviewEvents`, or recompute issuance-only mastery/counts. Use the already trusted private attempt's selected sequence, answers, adaptive state and follow-ups.
3. **Atomic submit**: keep profile/status, rollout/policy, owner-bound attempt/revision, applicable prerequisite completions, current authoritative catalog evidence, canonical completion, collectible eligibility/ownership and deterministic private-history merge inside the transaction. Preserve all existing writes and best-score/timestamp rules. This removes the demonstrated same-collection history query/write pattern without moving reward authority outside the transaction.
4. **Committed receipt path**: after account/policy and ownership checks, validate the saved result shape and return its receipt plus fresh current profile totals without rebuilding learning history or requiring a new catalog to reconstruct an old committed outcome. An uncommitted attempt still requires full current authoritative checks. Do not manufacture a receipt from a client flag.

Expected reduction on the tested mission path: remove the three learner-history queries on each submit/advance/resume, plus issuance-only private-history reads when redundant. Do not remove the deterministic private-history read used for the actual commit merge. Catalog queries that the transaction only reads are a different pattern and can remain initially. Exact before/after counts must be measured; no latency reduction is promised until the implementation is approved and tested.

This does not require a mass migration, new collection, learner rewrite, security-rule change, SDK upgrade or reward value change. It changes which internal context is loaded, so implementation still needs explicit approval.

### B. Move non-authoritative history outside a transaction

Could be considered later for **new issuance** only, because history guides reinforcement but cannot establish passing/completion. However, this can affect concurrent histories, attempt numbering and selected topics. Demonstrate parity and snapshot/version policy first. It is unnecessary for the first correction: submission does not need those reads at all. Never move prerequisite, profile, completion, ownership or uncommitted grading checks outside and then trust an unvalidated snapshot.

### C. Deterministic trusted summaries/evidence

The service already owns deterministic history, attempt and completion identities. Replacing all historical queries with summaries might help issuance, but current summaries do not necessarily represent every legacy practice/review signal. Making them authoritative adaptive summaries needs a separate compatibility design; no silent migration or legacy-history loss. Do not add a global mutex or shared collection-wide counter to serialize all students.

### D. Narrow catalog document reads

Issued question IDs support bounded direct reads, but fetching only selected questions may miss newly active/deactivated pool changes that the existing content digest detects. Mission/chapter ordering and uniqueness of active collectible mappings currently depend on queries. Replacing them with an unversioned client-supplied list would weaken checks. A revisioned, server-authored catalog index could solve this later, but introduces schema/update workflow concerns. Keep catalog/prerequisite queries until equivalence and edit-during-attempt behavior are proven.

### E. Retry behavior

SDK retries already operate: measured retries rise with concurrency, and same-attempt serial recovery succeeds. Increasing `maxAttempts` alone amplifies work and can exceed client deadlines; it does not remove unnecessary query scope. Preserve underlying transient classification server-side and return a safe retryable indication after exhaustion, without exposing internals or retrying permanent assessment errors. Any client automatic retry should be bounded, jittered, reuse attempt/action/request IDs, and resume/query the receipt after uncertainty. Do not retry locked, expired, content-changed, forged, record-conflict or stale-revision errors as though they were network errors. Design/testing of that enhancement is separate from simply enabling more SDK retries.

## Security/compatibility proof obligations before acceptance

Implementation must preserve server-issued selected five-question grading; selected-ID/key defenses; five-question quotas/difficulty progression and follow-up score separation; mission/chapter/era prerequisites at issue and uncommitted submit; daily server-date/streak rules; atomic completion/profile/collectible/attempt-result writes; same-activity no-double-pay and different-activity profile accumulation; maximum best score and earliest earned/completion timestamps; revoked/disabled/foreign/corrupt-record denials; and interrupted-commit/receipt recovery. No browser reward fallback.

Required regression additions:

- Assert submit/advance/resume do not call the three issuance-only history queries while issuance still observes all existing quiz/practice/review evidence.
- Preserve deterministic history merge under two attempts, distinct scores, concurrent mission/daily rewards and same-attempt duplicate calls.
- Verify new/changed prerequisites and catalog edits still fail uncommitted submit appropriately; committed receipt recovery after catalog edits remains safe and account-authorized.
- Compare before/after sequential/5/10/30 waves with identical seed, preparation, SDK options and measured callback counts; wait all promises before cleanup; record success/abort latency and final state. Repeat warm runs, not just one sample.
- Retain query-same/query-other/point controls, forced real commit failure, same-ID lost-response replay, refresh and stale revision cases.
- Run actual Functions HTTP/browser/security regression separately; emulator adapter timing is not hosted performance.
- Check legacy XP, best score, completion/artifact timestamps, teacher/collection reads, Bayani, narration and drafts. No live records or mass migration.
- Recheck exact artifact/source hashes and prepare a new reviewed release only after successful correction tests. Do not update the current approved manifest during this diagnostic.

The proposed alternative is not represented as correctness-demonstrated code. Source analysis identifies which reads are unused; implementation and tests above must establish the resulting service equivalence before acceptance.

## Expected files if implementation is approved

Primary: `functions/student-assessment.js` for explicit context separation and bounded receipt path. Tests: `tests/student-assessment-emulator.cjs`, `tests/secured-assessment-client.test.cjs`, `tests/priority3-save-diagnostic.cjs` and appropriate trusted-service regression tests. Potentially `functions/assessment-callables.js` and `js/student-assessment-client.js` only if approved transient-error/retry handling requires them; no speculative UI redesign. Documentation/build manifest would be regenerated only after implementation authorization and verification. No planned security-rule, dependency, reward-policy or schema changes for option A.

## Immutable release and remaining blockers

Final inspection confirmed every manifest source and artifact hash unchanged, with manifest SHA-256 **`1b77328bf8ef9952a849e520965c9627a79e9ffea90df40693c2ef942c74a911`**. Diagnostic additions are outside the release inventory. No production baseline or learner record was mutated.

Remaining gates: approve/implement/test the focused context correction; pass repeated class-scale save checks; resolve real hosted index/latency uncertainty under separately approved conditions; explicitly decide dependency disposition; approve narrow App Check repair and verify production attestation; provision billing/APIs/runtime-build IAM/backup/monitoring only under separate approval; and approve the final exact Functions/Hosting/rules/configuration release. Two-instance/concurrency-eight production capacity is still unverified.

**Stop point: diagnosis and proposed design delivered. Await implementation approval. No deployment or Priority 4.**
