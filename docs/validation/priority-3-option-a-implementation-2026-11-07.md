# Priority 3 Option A — local implementation and verification

7 November 2026, Asia/Manila. **Implemented and verified locally; awaiting review. Production deployment and activation remain unauthorized.** No billing/API/IAM/App Check setting, security rule, dependency version, reward value, progression rule, live learner record or Priority 4 work was changed.

## Focused implementation

`functions/student-assessment.js` separates `verificationContext` from `issuanceContext`. New issuance first performs the existing authoritative context checks, then loads the same deterministic private history and the same UID/mission-filtered quiz attempts, practice sessions and review events. It computes the original mastery, seen IDs, previous IDs and attempt numbering. Chapter/daily issuance retains the original empty-history defaults.

Issued advance, resume and uncommitted submit use `verificationContext` only. They still check current mission/chapter/era/prerequisites, catalog/policy digest, answer keys and question pools, including practice catalog needed by follow-ups. They do not reload issuance-only learner histories. Selected questions, answers, adaptive state and follow-ups remain in the server-owned attempt. Nothing was moved to a new client-supplied or external history snapshot.

The reward transaction still reads and updates deterministic profile, canonical completion, collectible ownership, private history and attempt result atomically. The private-history merge remains inside that transaction. The same SDK transaction defaults, write-buffer ordering, best-score maximum, original completion/earned timestamps, XP amounts, thresholds, daily date/streak rules and idempotency IDs remain in use. There is no additional automatic retry, global mutex or client reward fallback.

Committed recovery validates account/policy, owner-bound attempt identity and private receipt consistency before bypassing catalog reconstruction. Receipt checks re-grade the trusted snapshot, compare main/follow-up outcomes and rendered review evidence, validate reward/level/progression relationships and collectible identity, and reject malformed records. It does not certify arbitrary Admin tampering as impossible: the trust boundary remains private server-owned records, not a public cryptographic signature. Receipt validation authorizes no new reward writes. Submit returns current profile XP/level alongside the stored receipt. Resume preserves the existing stored-result view shape.

Thus a valid committed receipt can be recovered after attempt expiry or later catalog removal; an uncommitted assessment still fails on relevant catalog changes and missing prerequisites. Disabled/foreign users and corrupt receipts remain denied. No mandatory fields were added to old student progress or collectibles and no migration is required.

## Verification evidence

Final counts, comparison tables and release hashes are recorded in the companion `priority-3-option-a-results-2026-11-07.json` after all gates finish. Logs are linked by filename below. Diagnostic controls with an intentionally failing query/write pattern are reported separately from application acceptance.

Final results: **206 relevant Node 22 unit tests passed, 32 packaged Auth/Functions/Firestore integration tests passed, and all 11 relevant standalone browser fixtures passed. Zero failing acceptance tests remain in these final runs.** The 31-case source integration gate passed before packaging; the final packaged gate also includes the added post-issuance chapter prerequisite test. These are overlapping suites, not 31 additional unique tests. The actual assembled-browser flow passed in the packaged gate, including refresh and lost-response recovery. Its existing ViewTransition opt-in warning remains recorded and is not a claim of a clean production console.

Evidence: `priority-3-option-a-unit-2026-11-07.log`, `priority-3-option-a-source-emulator-2026-11-07.log`, `priority-3-option-a-package-emulator-2026-11-07.log`, `priority-3-option-a-*-browser.cjs.log`, and `priority-3-browser-emulator-2026-11-07.json`. Auth/Functions/Firestore ran against `demo-lakbaypanahon`; no production records were used as test identities.

Parity regression `tests/option-a-context.test.cjs` executes the captured pre-change implementation and corrected implementation over identical catalog data, random choices, clock and IDs. It checks identical first/history-informed issuance, adaptive main/follow-up results, reward writes and records. Chapter/daily issuance parity is also checked.

New actual emulator regressions assert all three histories are read on new issuance; issued resume/advance/submit skip them; deterministic history is still merged; uncommitted catalog/prerequisite edits fail; committed receipt recovery survives catalog removal/expiry while rejecting bad ownership, receipt changes and account disablement; and chapter submit rechecks prerequisite completion after issuance. The existing security suite retains forged-score/ID defenses, direct-write/private-record denial, reward and badge eligibility, duplicate/mixed rewards, real commit failure, targeted practice, drafts and actual HTTP/browser recovery.

An initial integration run exposed a missing non-mission empty-history default after the context split. That implementation error was corrected, chapter/daily parity coverage was added, and the initial failure log is retained as `priority-3-option-a-initial-chapter-default-failure-2026-11-07.log`. It is not counted as passing evidence.

## Load methodology and interpretation

The before baseline is `priority-3-save-diagnostic-2026-11-07.json` plus the differing-score/mixed-reward extra run. After runs use the same educational-only snapshot, valid seeded prerequisites, synthetic users, five issued main questions, follow-ups, sequential preparation and unchanged SDK transaction options. The harness now explicitly selects the working correction without overwriting the pinned before-package. Each measured save wave waits all promises before reading final balances or retrying failures serially. Timing excludes HTTP, Auth token checks, Cloud Run cold starts and thinking time.

`tests/priority3-save-diagnostic.cjs` records successful/failed responses, committed results, transaction callbacks/retries, p50/p95, query collection counts, same-user duplicates/distinct attempts, concurrent mission/daily totals, failed commit and receipt replay. Final checks record XP 45, one mission completion, best score 100, one artifact and zero chapter badges for these mission-only cohorts. Zero badges is the expected absence of premature chapter awards, not a 30-student chapter-challenge benchmark. Badge grading/concurrency eligibility remains covered by the security suite.

The minimal query-same-collection control intentionally retains code-10 emulator aborts; point-read and query/write-to-other-collection controls remain comparisons. An after application wave can pass while that diagnostic control still aborts. No control or SDK retry setting was weakened to obtain a green application result.

Local improvements do not certify production indexes, Cloud Run two-instance/concurrency-eight capacity, school-network App Check or classroom cold starts. The previous HTTP-worker stress is not rewritten as successful. No runtime-instance or concurrency increase was applied.

### Recorded before/after results

All times below are local core save latency; p95 for tiny samples is close to the maximum and is not a population estimate. The baseline uses the preserved pre-correction diagnostic run; it was not regenerated after changing the service. Dataset, preparation and SDK settings match. Host load and wall time can vary.

| Save group | Before successes | After successes | Before p50 / p95 | After p50 / p95 | Before / after retry callbacks |
|---|---:|---:|---:|---:|---:|
| Sequential, five | 5/5 | 5/5 | 0.306 / 0.335 s | 0.279 / 0.282 s | 0 / 0 |
| Five simultaneous | 5/5 | 5/5 | 3.475 / 8.114 s | 0.173 / 0.176 s | 6 / 0 |
| Ten simultaneous | 10/10 | 10/10 | 9.922 / 17.959 s | 0.311 / 0.327 s | 26 / 0 |
| Thirty simultaneous | 5/30 | **30/30** | 19.696 / 22.098 s | **0.850 / 0.917 s** | 113 / **0** |
| Same user, same attempt, three submissions | 3/3 | 3/3 | 3.332 / 3.704 s | 6.240 / 6.554 s | 2 / 5 |
| Same user, two distinct attempts | 2/2 | 2/2 | 2.181 / 3.760 s | 2.170 / 3.596 s | 1 / 1 |

Fresh-emulator repeat: **30/30 saved**, p50 **1.176 s**, p95 **1.191 s**, zero terminal aborts and zero callback retries. Both corrected class waves had zero failed saves and all final balances/completion/artifact/badge-absence checks passed. The baseline thirty-student wave had 25 terminal code-10 aborts before its serial recovery. Callback retry counts do not classify every intermediate exception; terminal abort counts come from returned errors.

Same-user contention was not eliminated or hidden: in the repeat, same-attempt p95 was 7.333 s with five retries, and distinct-attempt p95 was 10.451 s with two retries. All returned successfully, canonical completion paid only once, and separate attempts remained distinct records. These small samples do not support a same-user latency-improvement claim; the shared profile/completion/history must still be protected.

Concurrent mission/daily rewards produced **55 XP (45+10)** and both completions in both after runs, each with one retry callback. Their p50/p95 were 2.069/3.676 s and 2.088/3.457 s. Real commit-collision controls still left no partial XP/completion/receipt, then succeeded using the same attempt. Receipt replay after a discarded acknowledgement retained XP 45. No after-wave serial recovery was needed for independent students.

Each ordinary corrected mission submission performed five catalog queries (`chapters`, `missions`, `questions`, `practiceQuestions`, `artifacts`), versus eight before including the three learner histories. In the thirty-student after wave those five queries each executed 30 times; before, retry amplification caused each of the eight to execute 143 times. The deterministic private-history document merge remains present. The minimal same-collection query/write control still produced intentional emulator aborts while the application saves passed; no control was changed to suppress it.

Structured results: `priority-3-option-a-load-comparison-2026-11-07.json`. Raw corrected runs: `priority-3-save-diagnostic-option-a-2026-11-07.json` and `priority-3-save-diagnostic-option-a-repeat-2026-11-07.json`, with corresponding logs. These satisfy the **local** repeated class-save regression; hosted availability and capacity are still unverified.

## Release preparation and rollback

The earlier approved package/manifest was preserved throughout source validation. Regeneration is permitted only after the source regression and repeated load gates pass. The builder adds hashes for the corrected service and its regression/load tests to the source manifest; it does not ship those tests as Functions code. The new release remains an exact production Hosting-map overlay with the same seven previously approved payloads, narrow CSP, 577 paths and 570 preserved paths. This Option A change requires only an updated server service payload plus updated manifest metadata; no further Hosting change is introduced.

Protected rollback retains restrictive rules and deny-only reward callables/holding facade. It does not reactivate old browser-authorized XP writes. Canonical student progress and committed receipts must remain intact during any future approved activation or incident response.

Final manifest SHA-256: **`126b79f89883777b7e20345ca31a0e8e2093ab36424b7be64e6fe8160ee0a07f`**. Previous approved local manifest `1b77328bf8ef9952a849e520965c9627a79e9ffea90df40693c2ef942c74a911` is preserved at `build/priority3-audit/manifest.before-option-a.json`.

The refreshed manifest still contains **235 artifacts**, seven Hosting payloads, 577 proposed paths and 570 preserved production paths. The only retained payload whose hash changed is **`functions/student-assessment.js`**. All Hosting payloads/configuration, rules, rollback files, package/lockfile and runtime options retain their previous artifact hashes. Source metadata now also covers the corrected service and new regression/load tests. Final source/artifact drift checks are empty.

Fresh read-only production metadata check at **14:18:10 Asia/Manila** verified active version `b984eba31379723a`, all 575 baseline path hashes, Hosting configuration and active rules still match the pinned baseline. Billing remained unlinked. The secured rules hash remains `6b704af7ac7e6114851ce1a3e61ceaf2aaf2568587c4150bc51bafac90ae5849`; dependency lockfile remains `0eaedbf386bb5cddb70ed00be7403a78c5257130487f1fa25d549f1d2cc0ec38`. A future deployment must repeat preflight because production may change after this read.

## Exact follow-up file scope

- `functions/student-assessment.js`: context separation, owner/attempt identity check and committed receipt validation.
- `tests/student-assessment-emulator.cjs`: actual history-scope, catalog/prerequisite, receipt and post-issuance chapter regressions.
- `tests/option-a-context.test.cjs` (new): old/new issuance/adaptive/reward parity.
- `tests/priority3-save-diagnostic.cjs`: explicit working/before service selection, repeat-run report suffix/cohort support and final collectible accounting.
- `functions/prepare-priority3-readiness.cjs`: include these source/test hashes in the refreshed local manifest.
- Generated `build/priority3-release/functions/student-assessment.js` and `manifest.json` only after successful source/load verification. Retained payload hashes, rules, configuration, rollback and dependency lockfile are compared against the saved previous manifest.
- Local before-code snapshot, reports, logs, comparison JSON and this report are evidence outside the deployed payload.

No changes to `functions/index.js`, callable adapters, browser reward/quiz logic, database schemas, runtime options, security rules, dependencies, historical content, Bayani, narration or drafts were needed for Option A.

## Remaining production gates

The local class-save regression must pass repeatedly; results are recorded without claiming hosted capacity. Remaining production gates are the unresolved real App Check registration/attestation, an explicit dependency-risk decision for the six moderate entries, separately approved billing/APIs/build-runtime IAM/backup/monitoring and operational settings, current production preflight, and separate Functions/Hosting/rules/configuration deployment plus isolated live acceptance approval. Public educational answer keys remain readable under the approved bounded design.

No production operation is authorized by this report. Await the user's review before any production action or Priority 4 work.
