# Compact assessment catalogs and browser traffic: local feasibility

7 November 2026. **Read-budget feasibility is promising; secure hosted rollout remains NO-GO.** Blaze stays on hold. All prototypes are separate under `experiments/priority3-compact-catalog`. No accounts, deployment, billing, production access, student records, rules changes or Priority 4 work occurred. The only generated key was an ephemeral in-memory test signing key, not a Firebase/Admin credential.

## Before and after: 30 students

The backend run retains two missions per learner, adaptive followups, eight synthetic story scenes and eight draft autosaves per mission, three dashboard loads, **four** full-class teacher refreshes, daily and chapter assessments, and two concurrent receipt replays per completion. It does not claim display-cache savings or reduce monitoring frequency. All four original secured `onCall` exports, grading, difficulty selection, XP, artifact/badge awards and transaction-receipt logic remain unchanged; only the experimental data-store adapter changes question-bank retrieval. Expected total XP, two artifacts and one chapter badge per learner were asserted.

| Workload | Original document catalogs | Compact catalogs |
|---|---:|---:|
| Two mission assessments: reads | 39,210 | 15,750 |
| Daily assessments: reads | 810 | 540 |
| Chapter assessments: reads | 2,580 | 1,830 |
| All receipt replays: reads | 960 | 960 |
| Dashboards, stories, autosaves, teacher: reads | 12,672 | 12,672 |
| **Total daily reads** | **56,232** | **31,752** |
| **Total daily writes** | **2,220** | **2,220** |
| **Deletes** | **0** | **0** |
| Headroom below 40,000 | −16,232 | **8,248** |
| Headroom below Spark 50,000 | −6,232 | **18,248** |

Saving: **24,480 reads, approximately 43.5%**, with no classroom write reduction. Of this, 90 reads come from the previously tested transaction-local duplicate-read optimization.

The repeated banks previously caused **27,090 reads**: questions 15,600; adaptive practice questions 10,140; chapter questions 900; daily challenges 450. Compact retrieval replaces these with **960 signed-head reads and 1,740 pack reads: 2,700 total**, saving 24,390 bank reads. Activity configuration, current account/policy, prerequisites, adaptive history, ownership and canonical reward state remain freshly checked where the original service requires them. Receipts still validate committed evidence without regrading against a later catalog.

Initial publication is separate: **150 reads and 150 writes**, comprising 149 packs and one manifest head in one transaction. Largest measured decoded pack: **46,846 canonical JSON bytes**. A publication day would therefore total **31,902 reads / 2,370 writes** for this scenario. These setup costs are not silently excluded from the budget discussion; publication and security-probe operations are outside classroom totals. No retention/delete workload was scheduled.

## Compact data and trusted publication design

The local design groups each existing question/practice/chapter/daily query into a pack containing the exact decoded rows, including IDs. The exact query descriptor is bound to the payload; a canonical SHA-256 hash names each pack. A manifest binds schema, monotonically increasing generation and query-to-pack mapping with an Ed25519 signature. Private packs remain server data; an authenticated browser was denied access to the experimental head under unchanged rules.

Every grading callback reads a fresh head and verifies its signature, then reads and hashes each needed pack. No cross-request catalog cache is used. Reuse is limited to one transaction callback and resets on SDK retry. The original service still computes its content hash from the same question/activity/practice/reward values. A newly published changed bank invalidates an unfinished old attempt; a committed receipt remains valid historical evidence.

The fixture publisher reads the previous generation and existing pack documents in the same Firestore transaction, rejects an unexpected generation or modified existing pack, creates missing immutable packs, and advances the head atomically. A rejected write cannot leave a partially published head. Rollback is a **new reviewed publication with a higher generation referencing retained known-good packs**, not decrementing the head or deleting receipts/progress. In the local test, generations 1 → 2 → 3 demonstrated edit invalidation and rollback recovery of the original attempt.

A production design must additionally enforce all of the following; the fixture publisher does not implement an authoring security system:

1. **One trusted publication path.** Editors produce drafts. A reviewed canonical artifact is validated for schema, complete query coverage, unique IDs, content, adaptive blueprints, answer types, size and source provenance before signing. If publishing from mutable Firestore drafts, verify their read versions/hashes transactionally or use an immutable approved export. The current fixture publishes pinned local educational data, not a transactionally captured live authoring database.
2. **Atomic authority changes.** Publish validated packs and the head together when within Firestore limits. The prototype rejects large payloads before attempting publication; a larger catalog needs staged immutable packs, complete verification, then an atomic head switch, with explicit orphan cleanup. JSON size checks are not a substitute for validating encoded document, request and index sizes. Firestore documents have a 1 MiB limit and transactions a 10 MiB request limit. [Official limits](https://firebase.google.com/docs/firestore/quotas), [atomic transactions](https://firebase.google.com/docs/firestore/manage-data/transactions).
3. **Runtime cannot publish or replay heads.** Keep signing material out of Netlify, build output, browser and grading credentials. More importantly, prevent the grading writer from changing the current authority head or rolling back its generation. A signature proves origin, not freshness. A trusted monotonic authority must be outside that writer's write privileges, with publication and grading coordinated atomically or through a tested pause/drain protocol. Moving a head to a second database alone does not preserve a single transaction's atomicity.
4. **Enforce editor migration before activation.** All current question/practice edit paths must become draft-only or update authoritative publication atomically. Existing direct source edits cannot remain silently interpreted as live grading changes.
5. **Protected rollback and recovery.** Pause new work if necessary, preserve existing attempts/receipts, compare-and-swap against the current generation, publish an audited higher-generation rollback, validate curriculum and receipt behavior, then reopen deliberately. Key rotation, revocation, emergency invalidation and handling of unfinished attempts need tests. Never re-award XP or rewrite historical scores merely because a catalog changes.

Server/Admin SDK writes bypass Firestore Security Rules. A rule saying students cannot write a head does not restrict an Admin service-account writer. This is why the existing Admin credential design cannot be declared to enforce publisher/runtime separation simply by adding rules. [Official server-library rules guidance](https://firebase.google.com/docs/firestore/security/rules-conditions).

## Security results: controls passed, two blockers demonstrated

**Four unit tests passed**, including parity against the decoded pinned catalog (1,320 question rows and 149 packs), signature field binding, fresh-head validation and fail-closed modified/missing pack reads. An early storage experiment rejected a nested-array descriptor; it was changed to a string before the successful measurements. The parity test was strengthened to decode the export's typed Firestore fields, matching the actual emulator fixture.

The complete backend classroom passed with zero failed transactions and zero SDK retry callbacks. Actual retry-cache isolation remains prior deterministic test evidence; this run exercises concurrent committed-receipt retries, not forced SDK contention. Separate emulator probes passed for:

* corrupted head signature and modified pack rejection;
* stale publisher compare-and-swap rejection;
* failed publication leaving neither the proposed head nor its invalid pack committed;
* published content edit invalidating an unfinished attempt;
* higher-generation rollback restoring same-attempt recovery;
* all four endpoints rejecting missing Auth/App Check, and fresh profile-disable/policy-pause enforcement.

**Two probes deliberately expose missing enforcement:**

* A direct edit to a legacy question document is ignored by the published pack. This is acceptable only after legacy documents are explicitly drafts; it is unsafe as a drop-in replacement for today's live edit semantics.
* A privileged writer can replace the current head with an older legitimately signed head, which the current reader accepts. Hashes and signatures alone do not solve this rollback/replay problem. The local CAS publisher is cooperative enforcement, not protection against another privileged writer.

Therefore requirement to reject stale/modified authority is **not fully satisfied by this prototype**. Do not promote it or claim security equivalence until the two trust-boundary gaps are closed. No weaker fallback to unverified source banks is used when a pack is missing or corrupt.

## Actual Chrome/Firestore traffic

The browser run used installed headless Chrome, the real Firebase web SDK 12.4.0, real demo Auth and unchanged client rules. Thirty synthetic users sequentially loaded dashboard/story query shapes for both missions and executed the **unchanged `js/learning-draft.js` module**, with only its SDK import redirected to an instrumentation wrapper. Each completed all eight autosaves per mission. No private keys or real credentials entered the browser.

Measured successful SDK work: **11,850 document-read units, 480 committed writes, zero deletes; 1,380 point/transaction gets, 1,200 queries and 480 transaction callbacks.** The private-head get was denied; its possible billable rule/denial overhead is not included in successful counts. Chrome captured **3,984 Firestore network requests**, including Listen channels, batch-get and commit requests. Network requests are not document-read units: channels carry multiple messages and multiple documents.

This browser workload has fresh histories and no assessment-generated progress records. Its comparable Admin replay phase was 11,940 reads; the 90-read difference reflects history-result cardinality, not a new caching benefit. **Do not add the browser's 11,850 reads to 31,752**: those UI query shapes are already represented in the backend scenario.

Limitations: dashboard/story query shapes are not full application UI navigation; the actual autosave module is exercised. The browser run does not trace the full grading UI or approved teacher UI, and users are sequential in one page. Concurrent grading, daily/chapter and teacher workloads are measured by the separate backend harness. Forced server reads do not claim savings from existing browser caches. Production reCAPTCHA/App Check attestation, hosted HTTPS/cold starts, network reconnects, additional practice/review activity, older histories, rules-dependent reads, index-entry reads and denied-request billing remain unproven. No emulator count establishes a production invoice.

## Budget interpretation and next practical step

The tested compact model is **8,248 reads below the 40,000 target**, or 8,098 on an initial publication day. Spark's free read quota is 50,000/day, with independent write/delete, storage and transfer limits. [Official quotas](https://firebase.google.com/docs/firestore/quotas).

That margin is encouraging, not guaranteed. The earlier example of 30 extra quiz attempts per learner adds approximately 6,300 reads across three dashboards and four teacher refreshes, projecting **38,052 reads before additional rule/index/other traffic**. Pack version retention adds storage; hashes reduce read counts without necessarily reducing transferred bytes. Exact document reads of large arrays/maps need index-exemption review, size checks and retention planning; no indexes were changed in this task.

**Recommended next step, subject to approval:** a local publication/authoring migration and privilege-boundary prototype that rejects legacy live edits and signed-head replay, followed by a complete application-browser/client-rules trace with longer histories and failure/reconnect cases. Preserve the original candidate until that implementation and its rollback are reviewed. If enforceable publication isolation cannot be achieved without major architecture changes, retain the accepted backend and wait for an approved trusted hosting/billing route; changing hosts alone does not solve publication authority. Reducing the pilot workload would require a separate product decision.

## Netlify Free remains conditional

The grading host should hold only verification material, never the catalog-signing key. It still needs privileged progress/Auth access, which remains sensitive. Current [Netlify environment documentation](https://docs.netlify.com/build/functions/environment-variables/) places fine-grained scopes on Pro and above, describes deployment-time snapshots, and limits aggregate Lambda-compatibility environment data to 4 KB. Free build/preview isolation, old deployment revocation, dependency/build-log/artifact handling and credential rotation remain unresolved. A signing key on the same host would collapse the proposed authority separation. The local guards deliberately prevent production use.

The prior official no-card announcement does not prove this user's present registration/verification flow; no signup was attempted. Current signup and hosted capacity cannot be certified without separately approved account/hosted work. No paid feature, credential workaround or new provider account is assumed available.

**GO for the numerical feasibility finding only: compact banks materially reduce document reads in the tested local model. NO-GO for security equivalence, the current editor migration, a guaranteed full-traffic 40,000-read ceiling, or any production/hosted student pilot.** Blaze stays on hold. Await approval before further implementation or external action.

Stage 0 integrity: 242 artifacts, 23 source entries and 12 copied service files verified with zero drift. Accepted manifest remains `0b902b44931e19bde9e26db746c6518def3991367f85717f01014f28c3beb2ef`; no release manifest was regenerated.

Evidence in this directory: `priority-3-compact-catalog-compact-2026-11-07.json`, classroom log, `priority-3-compact-catalog-browser-2026-11-07.json` and log, `priority-3-compact-catalog-security-2026-11-07.json` and log, unit log, and `priority-3-compact-catalog-integrity-2026-11-07.json`. The separate security result contains the expanded replay/atomicity probes performed after the browser run.
