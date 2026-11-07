# Priority 3 read-efficiency investigation

7 November 2026. **Local tests pass; NO-GO for the requested 40,000-read school day and hosted students. Blaze remains on hold.** Only separate experiments, local demo emulators, synthetic learner records and pinned educational content were used. No production access, accounts, credentials, deployment, billing, rules changes or Priority 4 work occurred.

## Measured comparison

Both runs execute 30 concurrent learners completing mission-1 and mission-2, adaptive followups (ten learners make two initial mistakes), one daily challenge and one chapter assessment each. Both include eight synthetic story scenes and eight draft saves per mission, initial and post-mission dashboards, teacher reports and two concurrent receipt replays per completion: 120 initial completions plus 240 replays. Assertions verify unchanged total XP, two artifacts and one chapter badge per learner. Chapter completion uses real preceding mission completions, not seeded mission prerequisites. The fixture supplies earlier chapter prerequisites as before.

| Workload phase | Baseline reads | Optimized reads | Baseline writes | Optimized writes |
|---|---:|---:|---:|---:|
| Initial dashboards | 3,360 | 3,360 | 0 | 0 |
| Stories and draft saves | 1,740 | 1,740 | 480 | 480 |
| Two mission assessments | 39,210 | 39,150 | 1,200 | 1,200 |
| Mission receipt replays | 480 | 480 | 0 | 0 |
| Dashboard returns | 6,840 | 720 | 0 | 0 |
| Daily assessments | 810 | 810 | 210 | 210 |
| Daily receipt replays | 240 | 240 | 0 | 0 |
| Chapter assessments | 2,580 | 2,550 | 210 | 210 |
| Chapter receipt replays | 240 | 240 | 0 | 0 |
| Teacher monitoring | 732 | 366 | 120 | 60 |
| **Total** | **56,232** | **49,656** | **2,220** | **2,160** |

**Deletes: zero in both workloads.** Total saving: **6,576 reads (11.7%) and 60 writes**. Against 40,000 reads, headroom is **−16,232 before / −9,656 after**. Against Spark's 50,000-read hard quota, headroom is **−6,232 before / only 344 after**. The optimized workload consumes 99.3% of the hard daily allowance before additional traffic.

These are actual emulator document/query operations counted through the SDK meter, not estimated phase substitutions. Unlike the earlier 49,632 projection, this run includes daily/chapter receipt retries, transaction deduplication and the changed teacher refresh workload. It is therefore a different scenario, not a correction of the prior measurement.

## Ranked read sources and their purpose

Ranked workload phases: mission assessments 39,210; dashboard returns 6,840; initial dashboards 3,360; chapter assessment 2,580; stories/autosaves 1,740; all receipt replays 960; daily assessment 810; teacher monitoring 732. These categories do not overlap.

Within mission assessments, the largest collections are **questions 15,600**, **practiceQuestions 10,140**, **chapters 4,680**, and **missions and studentChapterProgress 1,560 each**. The complete ranked collection inventory for the whole day is in each JSON result; collection counts overlap the phase ranking and must not be added to it.

| Read category | Preserve or reduce? |
|---|---|
| Current profile, enabled policy, attempt ownership/expiry/revision, prerequisites and canonical completion | Preserve fresh transactional checks on each relevant request. Auth and App Check verification also remain unchanged; their calls are not Firestore document reads in this meter. |
| Current question/practice banks, activity and reward configuration | Repeated, but security- and adaptive-learning-sensitive under the current design: rebuilding and hashing context detects content changes during unfinished attempts. Do not treat all repeated catalog reads as redundant. |
| Adaptive history/practice/review evidence at issuance | Preserve learning personalization and prior question history. Do not drop evidence solely because it is not directly responsible for XP. |
| Reward ownership, progression policy, receipt evidence and atomic progress/XP state | Preserve. Receipt recovery already avoids rereading full catalog banks after commit. Replays are read-only and award nothing again. |
| Repeated public display catalogs | Candidate for page-owned sharing and explicit refresh. Never establish authorization, unlocks, grading or rewards from a display cache. |
| Teacher report refreshes | Avoid overlapping requests and load reports on demand. Fresh membership/ownership checks must still occur. Fewer refreshes mean fewer observations, not equivalent live monitoring. |
| Draft transaction/version and committed-state reads | Preserve conflict detection and refresh recovery. Existing save queue already suppresses superseded states; arbitrary write debouncing can lose progress. |

No `onSnapshot` or `setInterval` call was found in the inspected dashboard and teacher modules (`js/student.js`, `js/teacher-class-client.js`, `js/teacher-workspace.js`). No imaginary polling/listener savings are credited. This is a scoped source finding, not a claim that the entire application has no listeners. Manual refresh, Auth-state reload and back/forward restoration can still re-read data.

## Prototypes and verified tradeoffs

All new source is under `experiments/priority3-read-efficiency`. Accepted assessment source and prior Netlify service copies remain unchanged.

1. **Transaction-local snapshot reuse: 90 reads saved.** The store reuses identical point/query snapshots only inside one callback. A query can supply an already-returned document to a later point lookup. Every new request and every SDK retry starts empty. Writes remain queued until all validation reads complete. This preserves current policy/profile/content checks across requests. There were 90 point hits, zero duplicate-query hits and no cross-request cache. Keeping four teacher refreshes and unshared displays would therefore yield **56,142 reads**; this value is derived from the measured phase delta, not a third complete run.
2. **Display catalog sharing: 6,120 reads saved in the experimental workload.** Three dashboard consumers reuse four catalog promises per learner in one page lifecycle. This is a best-case workload assumption, not integrated app behavior. Actual story/quiz navigation can create new page contexts. Existing `content-cache.js`/`instructional-snapshot.js` already coalesce some requests and use a two-minute session cache; these savings cannot be counted again when that cache already applies. Public display edits may wait for explicit refresh/new context; authoritative assessment edits are still detected immediately on the next request.
3. **Teacher refreshes reduced from four to two: 366 reads and 60 writes saved.** Membership/profile/progress/attempt reads remain fresh for each report load. This changes observation frequency and needs product approval; it does not remove a security check. All four refreshes with the other two optimizations would cost **50,022 reads**, derived from the measured teacher phase.

Neither cache is deployed or integrated. Even the optimistic combined variant misses 40,000 by 9,656. With all display and teacher traffic hypothetically removed, optimized mission/daily/chapter operations plus their receipt replays alone total **43,470 reads**. Therefore display improvements alone cannot achieve the target in this tested scenario.

## Tests and measurement limitations

* **17/17 tests passed:** twelve existing adapter/security/meter checks and five new tests for callback-only point reuse, query/point sharing, filter separation, fresh snapshots on SDK retry, and queued-write failure behavior. An initial fake snapshot lacked its ID; the fixture was corrected and the suite rerun successfully.
* **Both complete emulator workloads passed.** Concurrent classes and same-receipt replay waves preserved expected XP, artifacts and badges. Neither workload needed an SDK transaction retry callback; retry-cache isolation is covered by the deterministic unit test. Previous real-contention/cold/lost-response tests remain prior evidence, not newly rerun results for this adapter.
* **Optimized security probes passed:** all four endpoints reject missing Auth, missing App Check and invalid App Check; disabling a profile or policy takes effect on the next request; editing question content invalidates an unfinished attempt; restoring content permits same-attempt recovery; forged XP is rejected. These probes and fixture/assertion operations are outside classroom totals.
* Stage 0 integrity passed: **242 artifacts, 23 source entries, 12 copied service files, zero drift**. Accepted manifest SHA-256 remains **`0b902b44931e19bde9e26db746c6518def3991367f85717f01014f28c3beb2ef`**. No release manifest was regenerated.

The harness replays query shapes using real demo SDK operations; UI reads use Admin SDK, not a complete browser/client-rules trace. Eight story scenes and fresh histories are explicit assumptions. Five-minute synthetic lesson intervals keep the original start rate limit enabled without waiting in real time. Low-level retries, rules-dependent/index-entry reads, denied client traffic, reconnections, old histories, other classes, practice/review activity, backups and retention deletes remain additional. Zero measured deletes means no deletion workload was scheduled, not that retained data never needs cleanup. Storage and transfer quotas remain independent. These totals cannot guarantee a production invoice or whole-project quota ceiling.

## Prioritized plan

1. **Keep student rollout closed.** The requested workload does not meet the 20% reserve. Do not weaken content-change checks, Auth, App Check, adaptive evidence or receipt integrity to force it below 40,000.
2. **Review transaction-local reuse as a small, isolated candidate.** Its 90-read benefit is modest; before promotion, run the full trusted-service regression and new-store contention/rollback/browser flows. Do not regenerate Stage 0 automatically.
3. **Trace real browser and client-rule traffic locally.** Determine which catalog reads existing caching already prevents, count refresh/reconnect patterns, seed longer histories, and include practice/review traffic. Preserve learning history; pagination that still loads every page does not save reads.
4. **Prototype a versioned compact server catalog only under a separate design review.** Packing a question/practice bank into fewer documents could address the dominant cost, but requires atomic trusted publication/version updates, schema and size validation, fail-closed handling of stale/missing data, and immediate invalidation of changed content. Any existing editor that can update source questions without updating the version is a security gap. No cross-request bank cache or packed catalog is implemented or credited here. This is a larger publication architecture change, not a safe drop-in cache.
5. **Review teacher on-demand snapshots and display request sharing after tracing.** Keep refresh controls, clear freshness labels, account-change invalidation and authorization rechecks. The measured small teacher savings cannot solve the deficit.
6. **Require all-endpoint abuse controls and a tested pause/recovery path before any hosted pilot.** Start quotas and App Check do not prevent a valid user repeatedly consuming advance/resume/receipt reads. Throttling itself may add database operations and must be measured. Keep receipts and progress intact on pause.

## Netlify Free viability

Read savings do not resolve hosting trust boundaries. Current [Netlify Functions documentation](https://docs.netlify.com/build/functions/environment-variables/) places fine-grained variable scopes on Pro and above. It also documents a **4 KB aggregate environment limit in Lambda compatibility mode** and deployment-time environment snapshots. Do not promise Free runtime-only credentials inaccessible to builds or assume changing one environment variable revokes old preview deployments.

Current [credit documentation](https://docs.netlify.com/manage/accounts-and-billing/billing/billing-for-credit-based-plans/how-credits-work/) gives Free a 300-credit hard limit. It does not establish capacity for this workload. The [official no-card statement](https://www.netlify.com/blog/introducing-netlify-free-plan/) is from the November 2024 plan announcement; present user-specific registration/verification remains untested. No account or signup was attempted. Browser/repository secret exclusion, preview isolation, build-log/artifact scans, narrow Admin credentials and provider packaging still need proof and separate approvals. A fully trusted backend-only build workflow is a different trust model, not proof of runtime-only isolation.

**Recommendation: NO-GO for Netlify-hosted students and the 40,000-read target with the currently verified design.** Netlify is still a possible transport host, conditional on no-card onboarding and an approved credential model, but is not a confirmed safe no-payment solution. Changing host, including to Workers Free, will not reduce these Firestore reads. Continue only separately approved local catalog-publication design and browser/rules measurement. Blaze stays on hold; await approval before further implementation or external action.

Evidence in this directory: `priority-3-read-efficiency-baseline-2026-11-07.json`, `priority-3-read-efficiency-optimized-2026-11-07.json`, corresponding logs, `priority-3-read-efficiency-unit-2026-11-07.log`, and `priority-3-read-efficiency-integrity-2026-11-07.json`.
