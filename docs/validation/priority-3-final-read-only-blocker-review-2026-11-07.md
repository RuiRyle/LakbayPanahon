# Priority 3 final read-only blocker review

Reviewed 7 November 2026, Asia/Manila. Production metadata check: 12:50:49; key follow-up: 12:53:30. **Production remains NO-GO pending App Check correction/verification, infrastructure approval and an explicit dependency-risk decision.** No application, dependency, release-manifest, production configuration, security rule, billing, service, student record or reward was changed. No attestation assessment or reward endpoint was invoked. New local files are audit tools, evidence and this report only. Priority 4 was not started.

## 1. Six moderate dependency entries

These are **installed production dependencies**, not development-only findings. The optional flag reflects how Firestore is declared by Admin; these packages are present in the clean production artifact and must not be dismissed as absent.

They trace primarily through:

```
firebase-admin 14.5.0
  @google-cloud/firestore 9.3.1
    @google-cloud/firestore-api 0.2.0
      google-gax 5.0.8 --------------------> rimraf 5.0.10
      google-auth-library / gcp-metadata     -> glob 10.5.0
        gcp-metadata 8.1.4 -> gaxios 7.1.3 -->   minimatch 9.0.9
```

| Audit entry | Flagged installed version | What it means | Compatible complete remedy available in the current ranges? |
|---|---|---|---|
| `glob` | 10.5.0 | Root advisory: cancelled/expired traversal can continue filesystem work. | No. Current parent requires `^10.3.7`; latest matching is 10.5.0. Patched line starts at 14.0.2. |
| `minimatch` | 9.0.9 | Root audit advisory: filesystem-pattern amplification/denial of service. | No. Glob requires `^9.0.4`; latest matching is 9.0.9. Patched line starts at 11.0.1. |
| `rimraf` | 5.0.10 | Inherits glob/minimatch findings, not a third independent assessment vulnerability. | No. Parents require `^5.0.1`; latest matching remains 5.0.10. Latest 6.1.4 uses newer glob but crosses the allowed major. |
| `google-gax` | 5.0.8 | Inherits rimraf findings. The other installed 6.12.1 branch does not carry this dependency. | No. Firestore API requires `^5.0.0`; latest matching remains 5.0.8. |
| `gaxios` | 7.1.3 | Inherits rimraf findings. The separate installed 7.3.1 branch has no rimraf dependency. | Not within this chain: metadata 8.1.4 pins **exactly** 7.1.3, despite other parents permitting newer 7.x. |
| `gcp-metadata` | 8.1.4 | Inherits the pinned gaxios branch. The separate 9.2.0 branch is different. | No for the flagged branch: its parent permits `^8.0.0`; latest matching remains 8.1.4. |

The six package entries represent two underlying advisories, not six independently reproduced application exploits. The minimatch maintainer advisory describes a tested 10.2.6 case, while registry audit metadata flags a broader range covering installed 9.0.9. Treat the installed package as flagged conservatively; the metadata alone is not a reproduction against this application's input path. [glob maintainer advisory](https://github.com/isaacs/node-glob/security/advisories/GHSA-3g3m-2fjr-6pw4), [minimatch maintainer advisory](https://github.com/isaacs/minimatch/security/advisories/GHSA-g3hv-75wg-m249).

### Reachability finding

Static inspection of packaged JavaScript found no imports of rimraf/glob/minimatch from outside that trio's own dependency tree. In particular, the flagged gaxios/google-gax packages list rimraf in their package manifests but do not reference it in shipped runtime JavaScript. Rimraf invokes glob only when its glob option is enabled. Assessment inputs cannot select module names or filesystem patterns; assessment code does not call these utilities.

An offline initialization of the actual Admin Firestore object and callable-handler factory loaded 612 modules and **none** of rimraf, glob or minimatch. It executed no RPC/query. This is limited dynamic corroboration, not an execution trace of every possible SDK feature.

**Conclusion:** vulnerable code is shipped, but no reachable exploitation path was identified through the reviewed assessment endpoints. There is no confirmed reward/progress exploit from these findings. This does not certify every SDK feature, malicious dependency replacement or future code change. Keep the finding visible and reassess after dependency changes.

### Update investigation and recommendation

Fresh npm registry metadata shows compatible updates such as Firestore 9.3.1 to 9.4.0 and the newer google-gax 6.x branch to 6.16.0. They **do not remove the flagged older branch**: Firestore 9.4.0 still depends on Firestore API `^0.2.0`; its latest compatible release is still 0.2.0 with google-gax `^5.0.0`.

Firestore API 0.7.1 uses google-gax `^6.0.0`, but `0.7.1` is outside `^0.2.0`. Major rimraf/glob/minimatch overrides likewise cross declared contracts. Therefore **no ordinary in-range update currently removes all six findings**. npm's `fixAvailable:true` is not sufficient evidence that a forced or parent-changing update is safe.

Do not force upgrades or edit vendor files. Choose either an explicitly documented, time-limited exception for the narrow low-exposure pilot, with reassessment within 30 days, or authorize a separate local compatibility investigation/upstream fix. Neither choice has been applied. No npm install/update/audit-fix command ran during this review.

Evidence: `priority-3-final-dependency-metadata-2026-11-07.json`, `priority-3-final-dependency-reachability-2026-11-07.json`, and the preceding package audit JSON. Lockfile SHA-256 remains `0eaedbf386bb5cddb70ed00be7403a78c5257130487f1fa25d549f1d2cc0ec38`.

## 2. Production App Check: exact confirmed configuration fault

Verified through read-only Firebase Management, App Check, Authentication and reCAPTCHA APIs:

- The sole registered web app is **LakbayPanahon Web**, app ID `1:831214660993:web:aeff983c8b3182358e4c80`, in the correct project. The client uses that app.
- Enterprise App Check registration exists with 3,600-second TTL and minimum score 0.5. The frontend uses `ReCaptchaEnterpriseProvider`; this provider type matches the registration.
- `recaptchaEnterpriseConfig.siteKey` equals `learningSettings/bayaniAI.appCheckSiteKey`. Their SHA-256 is `871b749bd7a5ea875e270856f1f73a39dd1b2fe6658781306bcf8b2349e8f500`. No whitespace, non-ASCII character or invalid public-key alphabet was found.
- **That selected key is not among the project's two Enterprise keys.** Lookup returns HTTP 400 `INVALID_ARGUMENT`, including when using the canonical project-number resource name.
- Both actual listed keys return HTTP 200 under the same credentials and canonical resource scheme. Thus this is not simply lack of key-read permission or a universally broken lookup URL.
- Both actual keys are website `SCORE` keys, both named LakbayPanahon Web, created 27 October 2026 at 04:05:31Z and 04:09:37Z. Both allow exactly `lakbaypanahon-1797e.web.app` and `lakbaypanahon-1797e.firebaseapp.com`.
- Main production domains are also in Firebase Auth's authorized list. The historical preview hostname is authorized by Auth but not by these reCAPTCHA keys. Auth authorization does not grant reCAPTCHA domain authorization.
- A v3 provider configuration also exists; that alone is not a fault and does not mean the Enterprise client is using v3. No secrets were requested or disclosed.

**The confirmed operational fault is the selected key value in Enterprise registration and its shared frontend setting—not the main production domain list, web-app identity or frontend provider class.** Read-only responses cannot establish whether the unmatched value is a mistaken copy, legacy v3 key, deleted key or key belonging elsewhere. I cannot honestly identify that provenance or claim successful attestation without additional evidence.

Recommended repair, requiring separate production-configuration approval: select one verified existing SCORE key after confirming its intended owner/use, register that exact key for this app's Enterprise provider and update the shared frontend setting consistently. No third key or broad domain allowance is inherently needed. Leave main production domain restrictions intact. If preview acceptance is required, approve only the exact preview domain separately. Reload clients that cached the previous setting and verify Bayani as well because the setting is shared.

Then perform a separately approved real attestation check on the main origins and school/browser environments, keeping secured rollout disabled and global Auth/Firestore enforcement unchanged. Keep TTL 1 hour and score 0.5 initially; do not lower the score merely to hide misconfiguration. Provider configuration can be repaired on Spark using an existing compatible key, but this is still a production setting change requiring approval. Token/assessment verification consumes quota; no such request was made here. [Firebase Enterprise setup, domains and TTL guidance](https://firebase.google.com/docs/app-check/web/recaptcha-enterprise-provider).

Evidence: `priority-3-final-blocker-production-check-2026-11-07.json` and `priority-3-final-appcheck-key-followup-2026-11-07.json`. Existing keys can be identified unambiguously by hashes `4dd79a…41d3a` and `d70abc…cc46`; neither has been selected or changed.

## 3. One-month pilot costs: assumptions, operations and money

These are **assessment-component planning estimates in USD**, not a total LakbayPanahon quote or maximum bill. Production has no Functions usage measurements or linked billing account. Existing Hosting, downloads/audio, Bayani/model traffic and learner history can materially change the total.

Per student, assume 20 school days with:

- 20 newly attempted mission quizzes, plus five failed/retry attempts: **25 mission attempts**. This models 25% extra attempts, not additional XP awards.
- Four chapter challenges, ten daily challenges and twenty restore/resume requests.
- 13 requests per mission attempt, three per chapter/daily activity: `25×13 + 4×3 + 10×3 + 20 = 387`; add 10% transport headroom and round up to **426 callable requests/student/month**. Idempotent retries do not award again.
- **36,000 Firestore reads/student/month**: budget 1,000 per mission attempt versus the earlier synthetic healthy-history measurements of 656–695, plus chapter/daily/restore context, 10% read headroom and ordinary UI reads.
- **1,100 writes/student/month**: private attempts/actions/receipts, permitted canonical writes, drafts and UI progress; this is a conservative rounded budget, not 1,100 reward events. Actual duplicate submissions can return without additional reward writes.
- About two reCAPTCHA attestations per active day: **40/student/month**. With 1-hour token TTL, auto-refresh occurs at roughly half TTL; browser caching/reopening and other visitors change this count. A quiz request does not automatically imply a new assessment.

Read-budget detail: `(25×1,000 + 4×500 + 10×150 + 20×100)×1.10 + 2,000 UI reads = 35,550`, rounded to 36,000. Write-budget detail: `(25×20 + 4×12 + 10×12)×1.10 + 300 draft/UI writes = 1,034.8`, rounded to 1,100. Chapter/daily/restore and UI counts are planning assumptions, not newly measured live operations. A future Firestore-backed all-endpoint limiter would add counter operations; its implementation costs are not included in this current-candidate model.

| Monthly quantity | 30 students | 100 students | 300 students |
|---|---:|---:|---:|
| New mission quizzes | 600 | 2,000 | 6,000 |
| Mission attempts including retries | 750 | 2,500 | 7,500 |
| Chapter challenges | 120 | 400 | 1,200 |
| Daily challenges | 300 | 1,000 | 3,000 |
| Functions requests, including headroom | 12,780 | 42,600 | 127,800 |
| Firestore document reads | 1,080,000 | 3,600,000 | 10,800,000 |
| Firestore document writes | 33,000 | 110,000 | 330,000 |
| reCAPTCHA assessments | 1,200 | 4,000 | 12,000 |

For the Singapore deployment, retain the same-day public SKU rates already recorded: CPU US$0.0000336/vCPU-second, memory US$0.0000035/GiB-second, requests US$0.40/million, Firestore reads US$0.0369/100,000 and writes US$0.1107/100,000. Assume one allocated vCPU/256 MiB and **0.5–2 active seconds/request**. These are estimates, not observed production latency. No concurrency-sharing discount is assumed. [Cloud Run pricing](https://cloud.google.com/run/pricing), [Firestore pricing](https://cloud.google.com/firestore/pricing).

| Gross component before free credits | 30 students | 100 students | 300 students |
|---|---:|---:|---:|
| Functions active CPU/memory | $0.22–0.88 | $0.73–2.94 | $2.20–8.81 |
| Request charges | $0.005 | $0.017 | $0.051 |
| Firestore reads | $0.40 | $1.33 | $3.99 |
| Firestore writes | $0.04 | $0.12 | $0.37 |
| **Core gross total** | **$0.66–1.32** | **$2.20–4.40** | **$6.60–13.21** |

Additional planning allowances:

| Item | Assumption and implication |
|---|---|
| reCAPTCHA | If no other organizational usage consumes the allowance: $0 for 30/100 students, **$8** for 300. Published pricing is 10,000 free assessments per organization, then $8 through 100,000. Existing visitors/other projects can cause even smaller pilots to cross the threshold. [reCAPTCHA pricing](https://cloud.google.com/security/products/recaptcha). |
| Builds | Budget eight builds at five minutes each, 40 build-minutes total, covering four endpoint build-equivalents and one repeat/recovery cycle. Actual source/image reuse may reduce this. Gross **$0.24–0.62** at $0.006–0.0156/minute depending on worker. The 2,500-minute promotional allowance applies to eligible e2-standard-2 default-pool builds; do not assume a different worker is free. [Cloud Build pricing](https://cloud.google.com/build/pricing). |
| Container storage | Assume 2 GiB average retained images. Approximately **$0.15/month** if the shared 0.5-GiB allowance is available, using about $0.10/GiB-month. Old images accumulate unless a separately approved cleanup policy is selected. [Artifact Registry pricing](https://cloud.google.com/artifact-registry/pricing). |
| Small infrastructure reserve | Add **$1–5/month** as an assumption for source storage, private-attempt storage, indexes, logs and small network traffic. This is a reserve, not a verified invoice. Larger histories, abuse, paid scanning and retained snapshots may exceed it. |
| Backup/export | Separate pre-cutover requirement. Its cost depends on existing database size, export/backup mechanism, storage and retention. No learner data was read to size it; not included above. |
| Existing product costs | Bayani/model calls, audio generation/downloads, Hosting overages, Auth/SMS, other project workloads, taxes and currency conversion are **not included**. No paid provider was activated. |

Combining core gross estimates and the stated extras gives a rough planning envelope of **$2–7/month for 30**, **$4–10 for 100**, and **$16–27 for 300**, before reducing core charges by available free allowances and excluding the separate costs above. These are not hard bounds or a promise about the whole project's bill.

Cloud Run's published request-based free tier is valued at us-central1 pricing, aggregated across the billing account; it includes 2 million requests and CPU/memory credits. Firestore's eligible database has daily free quotas, not a freely transferable monthly pool. At the model's evenly distributed 20 active days, reads average 54,000 / 180,000 / 540,000 per active day, so even a 30-student pilot can exceed 50,000 reads on a school day. Current learners and other application reads share that allowance. Writes average below 20,000/day in these scenarios, but shared usage and bursts matter. Do not assume a zero bill. [Cloud Run free-tier rules](https://cloud.google.com/run/pricing), [Firestore free quotas](https://cloud.google.com/firestore/pricing).

If request time or reads per attempt double, those corresponding components approximately double; reCAPTCHA threshold costs do not scale linearly. Start with 30 students and measure before selecting a higher cohort. Arithmetic and assumptions are saved in `priority-3-final-pilot-cost-model-2026-11-07.json`.

## 4. Conservative proposed operational limits

**Recommendations only; none are configured.** The existing candidate still has maxInstances 10 per endpoint and does not explicitly configure concurrency or an all-endpoint request limiter.

| Control | Pilot recommendation | Grade 5 impact / required verification |
|---|---|---|
| Attempt expiry | 2 hours, fixed from issuance; daily server-date boundary still applies. | Ample for an ordinary five-question quiz and short interruptions. Overnight/long-offline unfinished attempts restart; earned progress remains saved. Do not extend indefinitely on every resume. |
| New attempt starts | Recommend 3/minute and 60/day per UID for a bounded pilot, subject to classroom/retry testing and approval. | Counts new issuance, not stable-key recovery. Normal one-quiz-per-day learning is far below this; rapid quiz/chapter/daily transitions may briefly queue. Give a retry-later response without losing answers. This differs from the inert package proposal of 10/minute and 200/day; the package was not edited. A daily cap is an abuse control, not a changed passing rule, and needs explicit approval. |
| All-endpoint throttle | Propose a separate per-UID token bucket around 60 requests/minute, burst 20, before expensive catalog reads. Protect resume, invalid submissions and advances too. | A five-question quiz is usually far below this; burst covers reconnection. Never use school IP alone as a classroom hard cap. This limiter is **not implemented**, needs local approval/testing, and must not strand committed-result recovery. |
| Instances | For a 30-concurrent-student pilot: min 0, max 2 **per callable**, not project-wide. | Cold starts remain possible; four endpoints could reach eight instances. Test synchronized entry before enforcement. More enrolled students can be staggered without increasing simultaneous capacity. |
| Concurrency | Propose 8 requests/instance, with one allocated vCPU and measured memory. | Limits resource contention. Two instances provide about 16 in-flight slots per endpoint, so a class may briefly queue. This is not a guarantee of throughput. |
| Larger simultaneous classes | Only after a local synchronized-load check, consider max 4 per callable for 100 concurrent students, max 6 for 300, concurrency 8. | Those are capacity hypotheses, not proven settings. The cost table models monthly totals, not instant 300-student demand. Stagger classes if keeping smaller caps. |
| Timeouts/retries | Consider server 30 seconds and keep client 70 seconds to allow platform queueing plus execution. Reuse request ID/revision; query a saved receipt after uncertainty. | Reduces hung executions without creating new attempts when a save response is lost. Current defaults remain approximately 60/70 seconds; no change was applied. |
| Internal action/history bounds | Keep 512 actions/attempt. Monitor approach to the existing 1,000-record per-user/mission history bound. | Ordinary use is far below these. No silent truncation, learner reset, automatic deletion or XP recalculation. Retention changes require separate approval. |
| App Check | TTL 1 hour, threshold 0.5 initially; verify real school devices before enforcement. | Shorter TTL increases checks/latency/cost; a high threshold may reject legitimate shared-school traffic. Fix the key rather than lowering protection as a workaround. |

Suggested monitoring, also not created:

- Warm answer p95 above 2 seconds or start/submit p95 above 5 seconds for five minutes: investigate reads, cold starts and contention. These are proposed pilot targets, not measured service guarantees.
- Five unexpected save failures in five minutes, or error rate over 2% with at least 100 requests: alert. Separate expected forged/locked denial tests from legitimate failures.
- Repeated 429/quota/ABORTED errors, missing/invalid App Check for valid users, high per-UID traffic and reads per attempt over twice the initial baseline: investigate promptly.
- Budget notification proposals: $20/month for 30 students, $30 for 100, $50 for 300, with 50/75/90/100% alerts and a forecast alert. Select recipients and include existing service costs before applying a project budget. These are alerts, not spending caps.
- Inspect day-one usage and after each class, then daily for the first pilot week. Do not log raw student answers, credentials or tokens as a monitoring shortcut. Pause new assessment saves through the protected protocol if unhealthy; preserve receipts and progress.

Reducing limits can cause queues/429 responses if a whole school starts together. Raising max instances is not free abuse protection. Any new limiter or runtime-setting change needs implementation/load tests and a refreshed manifest before production approval.

## 5. Release manifest versus current production

Fresh read-only comparison confirms:

| Check | Result |
|---|---|
| Hosting version | `b984eba31379723a`, matches pinned baseline. |
| Existing file map | All **575** paths/hashes match. |
| Hosting headers/configuration | Exact baseline match. |
| Active rules | Ruleset `7b56c656-fb38-44a3-9b69-38942be9a8c3`; SHA-256 `678be315fa0aecdbb09fc3cb88294c0f69493056e8c50389a254500234ac0496`, matches baseline. |
| Proposed source/artifact hashes | No drift in any manifest source entry or any of its **236** artifact entries. |
| Proposed Hosting map | Seven approved updates/additions map to their listed hashes, 577 final paths, 570 preserved production paths. |
| Functions v2 inventory | Empty, no unreachable regions reported. No activation performed. This check is not an inventory of arbitrary external servers. |
| Billing | Still disabled, no linked account. |
| Manifest hash | `7d686adfff404dcbc7fed66721425cfa8d58216a4d9e8277f032037d6c49899d`, unchanged. |

One **packaging hygiene warning**: `hosting/uploads/27f13e8fd4c4aeeca8c5bfa91ca36cb2809c5a4f0198271edb322859a96852ea.gz` is an older unreferenced gzip still inventoried in the release directory. It is not referenced by the final Hosting map and cannot be served through that map. A future uploader must use only hashes required by the approved map, never enumerate/upload a directory indiscriminately. Local removal and manifest regeneration can be approved without billing, but were **not performed** under this read-only request. Any regenerated manifest needs a new hash/review.

This confirms baseline consistency **at the check time**, not permission to deploy later without another preflight. No catalog or learner-wide scan was repeated; prior catalog compatibility results remain prior evidence, not a newly certified live catalog.

## 6. Short decision checklist

Billing permission and production-change permission are separate. Being free does not make a production configuration edit authorized.

| Approval category | Decisions/actions |
|---|---|
| **Safe to approve without billing; local/read-only** | Select intended existing reCAPTCHA key on paper; ask its administrator to confirm provenance/use. Choose a documented 30-day dependency exception or authorize a separate local compatible-upgrade investigation. Approve local removal of the orphaned gzip and regeneration/review of its manifest. Approve isolated synchronized classroom/load tests and local limiter design. Select budget recipients/thresholds and pilot cohort on paper. |
| **Requires billing and/or infrastructure activation approval** | Link Blaze/payment account; enable missing Cloud Run, Build and Artifact Registry APIs; provision runtime/build identities and least-privilege IAM; configure billing alerts; approve backup/export/retention and any billable storage/monitoring/provider usage. No Owner/Editor fallback for the runtime. |
| **Requires explicit production change/deployment approval** | Repair App Check registration plus shared setting using the selected existing key; run a bounded real attestation check. This repair does not inherently need Blaze, but it is still a production configuration change. Separately approve four Functions, exact Hosting/CSP overlay, restrictive rules, final operational settings, rollout policy and isolated live acceptance/cleanup. Enable secured saving only after all checks pass. Do not turn on global Auth/Firestore App Check enforcement as an incidental change. |

Recommended next sequence: decide dependency disposition and local packaging/load-test scope; approve the narrow existing-key App Check repair/verification separately if desired; then reconsider billing/infrastructure and finally the exact production release. No step was automatically authorized by this report.

The earlier 204 unit/28 emulator/11 browser passes remain historical local implementation evidence. This read-only review did not rerun write-based emulator or production acceptance, modify packages, exercise expensive malicious patterns, or mint attestation tokens. Its additional checks were registry metadata, static import inspection, offline module initialization, arithmetic, fresh configuration reads and full manifest/baseline hash comparisons.

**Awaiting approval. No production changes or Priority 4 work.**
