# Catalog publication authority: local security implementation and verification

7 November 2026. **Local controls pass within the defined content-writer threat model. Production remains NO-GO; Blaze stays on hold.** All new implementation is under `experiments/priority3-catalog-authority`. No external accounts, deployment, IAM/API/billing changes, production access, real student data or Priority 4 work occurred. No accepted source, artifact or release manifest was modified.

## Threat model and scope of the result

An untrusted content writer may hold a legitimate Firebase Auth application-admin identity, send arbitrary client requests, retain old browser/session data, and obtain old signed public metadata. That writer **must not hold Firebase Admin/service-account credentials, signing material, the independent publication approval capability, or access to the authority's host/journal**. The tests use actual emulator Auth tokens and the unchanged client rules to enforce this writer boundary.

The trusted publication authority and its separately retained monotonic checkpoint are outside that writer's control. Grading is trusted server code. Signer/operator compromise, project-owner access, arbitrary host execution and restoration of the authority's own storage are not resisted. As extra defense, the tests also restore an old signed head with the Admin SDK and demonstrate rejection against the independent checkpoint.

**This distinction does not make raw Admin legacy writers safe.** They bypass client rules and can still change legacy sources between audits. The implementation audits those sources at publication/recovery, not on every grading request. If existing content writers retain console/server credentials that permit arbitrary source writes, requirement 1 is not fully met and this design must not activate. Hosted removal/isolation of those credentials is a mandatory gate, not an action performed here. Firebase documents that server libraries bypass client rules. [Official guidance](https://firebase.google.com/docs/firestore/security/rules-fields).

## What changed in the separate prototype

**Enforced publication path for application content writers.** Existing client rules reject their direct source/head/pack writes, including writers with an active application-admin profile. A separate approval secret gates publisher and recovery operations. The local fixture represents that approval capability; no public production endpoint is supplied. Source schema restricts the publisher to the eleven catalog collections and rejects duplicate IDs or learner collections.

The publisher validates the full previous legacy catalog against its trusted source digest. It computes the approved next compact packs, then writes changed legacy rows, missing immutable packs and the signed next head in **one Firestore transaction**. Unsupported source drift aborts publication and leaves grading paused. The classroom uses the original educational data unchanged; edit/rollback probes modify synthetic wording only.

**Independent version tracking.** The authority retains the current generation, head digest and source digest in a hash-chained journal outside Firestore. Grading checks a freshly read head against this checkpoint on every transaction, including receipt replays. A valid signature on an old head no longer makes it current. Reconstructing the authority from its journal retains the higher generation. A corrupt or truncated journal fails closed; it is not reset to generation zero.

**Freeze, drain and recover.** Before publication, the authority rejects new grading leases and waits for existing grading-store transactions to commit or fail. It records and fsyncs a prepare entry, commits the atomic database change, then records the new trusted checkpoint. The journal and Firestore are separate stores, so there is a two-phase recovery protocol rather than a claim of one cross-store atomic commit:

* interruption before database commit: remain paused; trusted recovery verifies old head/source and aborts the pending publication;
* interruption after database commit: remain paused; recovery verifies the new head/source and commits its pending checkpoint;
* unknown head, corrupt journal or source drift: remain paused for operator investigation;
* concurrent publishers: one coordinator admits a winner, and database head comparison rejects stale state.

The local coordinator's leases span the complete store transaction, including SDK retries and commit completion. Hosted multi-worker fencing, outstanding leases after machine failure and reliable global coordination still require implementation and verification. Recovery must not infer that remote work has drained merely because a local counter reset.

**Version-bound attempts and forward-only rollback.** New private attempts store `catalogGeneration`. An unfinished attempt from an older generation is rejected with `assessment/catalog-version-stale`; the caller must explicitly start a new attempt. Its stored answers are not deleted, and existing progress is not reset. A higher-generation rollback restores reviewed known-good content; it does not make older unfinished sessions current again. Committed receipts continue to validate their original server evidence and recover without repeat XP. Publishing during class may therefore interrupt unfinished sessions; operator timing and a tested restart message are required.

Original grading, adaptive selection, difficulty, reward calculations and callable verification code are unchanged. Account/policy checks, prerequisites, transactions, receipt evidence, XP, artifacts, badges and progress remain in the original service. The new store adds authority/version enforcement, not client grading.

## Security tests

**13/13 unit tests passed:** four authority startup/journal/schema tests, four compact parity/signature tests and five transaction-cache isolation tests. The parity test uses the decoded pinned educational export. Test signing keys and approval secrets are dummy or ephemeral; no Firebase/Admin credential was created.

**13 emulator security scenarios passed:**

1. Actual authenticated application admin denied direct writes to legacy question/practice/daily/chapter banks and head/pack documents; missing publication approval rejected.
2. All four original `onCall` exports reject missing Auth, missing App Check and invalid App Check.
3. Publication waits for a real grading-store transaction, blocks new work, and atomically updates the source row and pack/head. Retained old session requests are rejected.
4. Restoring a previously signed head with the Admin SDK is rejected, including after journal reconstruction. Unknown head state remains paused.
5. Rollback advances generation; a fresh attempt can resume, while an old unfinished session stays stale. A pre-publication committed receipt returns unchanged XP without another award.
6. Interruption before database commit recovers by aborting the pending generation with no source drift.
7. Lost acknowledgement after commit remains paused until trusted recovery reconciles the new checkpoint.
8. Two concurrent publication requests for one expected generation produce exactly one winner.
9. An exception inside the database transaction leaves legacy data and head unchanged; no partial publication is accepted.
10. An older expected generation is rejected; the trusted publisher cannot decrement a committed version.
11. Modified pack data fails its digest check.
12. Out-of-band Admin source drift is detected by publication and recovery audits; recovery stays paused until repaired. This is an audit defense, not continuous protection against raw Admin writers.
13. Current profile disablement and protocol pause still protect active work and historical receipt recovery.

The stale-session test retains browser-equivalent attempt state and sends real callable requests. It is not a new Chrome UI test. Interruptions are injected exceptions followed by authority-object reconstruction from a real journal, not power-loss or OS-process-kill tests. Existing browser and cold-response evidence is prior evidence, not newly rerun full UI certification.

## Complete classroom rerun and read budget

Thirty synthetic learners complete two missions with adaptive followups, stories, eight autosaves per mission, initial/post-mission dashboards, four full-class teacher refreshes, daily and chapter assessments, and two concurrent save replays per completion. Educational content is unchanged. The run asserts expected total XP, two artifacts and one chapter badge for each learner. No display-sharing discount or reduction in teacher monitoring is used.

| Daily operations | Original document catalogs | Earlier compact prototype | Authority-protected prototype |
|---|---:|---:|---:|
| Reads | 56,232 | 31,752 | **31,992** |
| Writes | 2,220 | 2,220 | **2,220** |
| Deletes | 0 | 0 | **0** |
| Headroom below 40,000 | −16,232 | 8,248 | **8,008** |
| Headroom below Spark 50,000 | −6,232 | 18,248 | **18,008** |

The extra 240 reads are authority-head checks on committed receipt replays. All other measured classroom phases retain the preceding compact totals. There were no failed classroom transactions or SDK retry callbacks; committed receipt retries were concurrent. Forced SDK retry/cache isolation is covered by deterministic unit tests.

Initial startup/publication was separately measured at **2,578 reads and 150 writes**: one startup head check, a full source audit, existing-pack checks and atomic creation of 149 packs plus the head. Including it produces **34,570 reads / 2,370 writes / zero deletes**, leaving **5,430 reads** below the target. The journal adds local I/O rather than Firestore operations; a hosted coordinator would add latency, availability and possibly hosting costs.

These are emulator minimum document-read units, not an invoice or whole-project bound. UI/teacher traffic is still query-shape replay through Admin SDK. The prior real-browser run exercised 30 synthetic users' dashboard/story queries and the actual autosave module; full grading/teacher UI and billing-equivalent rule/index overhead remain unmeasured. Histories are fresh, scenes synthetic, and fixture/assertion/security-test traffic is excluded from classroom totals. Publication costs are shown separately rather than silently omitted.

Authority recovery with an existing checkpoint requires another full source audit; repeated restarts/publications are not free. The earlier illustrative 30-extra-attempt history distribution adds about 6,300 reads across student and teacher displays: **38,292** on an ordinary day, or **40,870** with the measured initial-publication cost, before rule/index/other traffic. The normal fresh-history scenario meets the target; a guaranteed all-history/all-traffic ceiling is not established.

## Safe rollback and reopening procedure

1. Keep new grading paused and confirm all active transactions have drained; do not expire remote leases blindly.
2. Check the durable journal and database head, then audit legacy source and referenced packs. Unknown divergence stays paused.
3. Select a reviewed retained catalog artifact. Submit a rollback against the current generation through the trusted approval path.
4. Atomically restore approved source rows/packs and publish generation N+1; commit the authority checkpoint after verifying the database commit.
5. Test fresh issuance, stale-session rejection, receipt replay and unchanged XP/progress before reopening. Existing receipts and learner progress are never deleted or re-awarded.

## What still needs hosted proof

The bootstrap intentionally colocates signer, operator fixtures and grading in one local Node process, backed by a workspace journal. **This does not prove production process, filesystem or credential isolation.** There is no deployable authority endpoint, protected remote journal, durable distributed lease service or independently provisioned signing identity in this task.

Before hosted work can be approved, verify that content writers possess no raw Admin credentials, the grading/build/preview environment cannot access publisher approval/signing/journal write capabilities, and all authoring paths use the approved workflow. Then prove authenticated coordinator communications, replay protection, global leases/fencing, crash recovery, rollback-resistant durable storage, key rotation and disaster recovery. Restoring both database and authority journal to an old snapshot is outside the tested protection and requires an independent trusted checkpoint/restore policy.

Netlify Free remains unverified for this design. It must not host publication secrets in a shared grading/build context. Fine-grained environment scopes remain Pro-and-above, and Lambda compatibility has a 4 KB aggregate environment limit. [Official Netlify documentation](https://docs.netlify.com/build/functions/environment-variables/). A separate reliable authority introduces a new hosting/availability requirement; no no-card, always-available hosted solution is claimed here. Signup, production App Check, all-endpoint throttling, browser restart UX, hosted cold/concurrent behavior, backups and operational pause/recovery remain gates.

## Recommendation

**Conditional GO for continued local development under the explicitly restricted content-writer model. NO-GO for production, external accounts, deployment, or a guaranteed no-payment hosted pilot.** Head replay is rejected against a separately held checkpoint; unsupported edits are blocked for application admins. Raw Admin legacy writers cannot be treated as untrusted editors under this implementation. If those privileges cannot be removed from content workflows, the original legacy-edit vulnerability remains outside the solved scope and activation must stay blocked.

Next approval should cover local process-separated authority/privilege tests and complete browser/reconnect/restart flows with larger histories. Do not replace the accepted Stage 0 candidate merely because this fresh-history workload meets its numerical target.

Stage 0 integrity passed: **242 artifacts, 23 source entries and 12 unchanged service copies; zero drift**. Accepted manifest SHA-256 remains `0b902b44931e19bde9e26db746c6518def3991367f85717f01014f28c3beb2ef`. No release manifest was regenerated.

Evidence: `priority-3-catalog-authority-secured-2026-11-07.json`, classroom log, `priority-3-catalog-authority-security-2026-11-07.json` and log, unit log, and `priority-3-catalog-authority-integrity-2026-11-07.json` in this directory. Await approval before further implementation or any external action.
