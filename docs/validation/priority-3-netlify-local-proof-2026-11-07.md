# Priority 3 Netlify-compatible local proof — results

7 November 2026. **Local proof is promising; production/student rollout remains NO-GO. Stage 1 billing is on hold.** No account, deployment, live learner access, production configuration/IAM/rules change or Priority 4 work occurred.

## What was built and tested

Separate directory: `experiments/priority3-netlify/`. Its `service/` files are exact copies of the accepted Stage 0 Functions payload. Grading, adaptation, prerequisites, XP, collectibles and transactions were not changed. The experimental `bridge.cjs` uses pinned `serverless-http@3.2.0` to adapt Lambda-compatible events to the four original Firebase SDK `onCall` exports. This one new dependency is confined to `adapter-deps/`; accepted application dependencies/lockfiles are unchanged. The experimental entry deliberately refuses non-demo environments and cannot be treated as a production-ready deployment package.

The bridge preserves callable envelopes, errors, Auth and App Check enforcement, CORS, body bounds and duplicate-credential rejection. An initial test found that the Lambda library supplies a prebuffered body that Express's normal JSON parser left unparsed. The bridge now parses that buffer explicitly. The initial failure log is retained. No security assertion was weakened.

Local tests use actual demo Auth and Firestore, unchanged restrictive rules copied byte-for-byte into the experiment, and real SDK transactions. App Check uses locally signed RSA tokens and a **test-harness-only public JWKS source**, while SDK signature, expiry and audience checks remain active. No test key/provider is in the adapter. This does not demonstrate real reCAPTCHA attestation. Auth emulator tokens do not demonstrate production Google certificate verification. External credentials were not created or used.

Passing evidence:

- **12 adapter/meter unit tests**, including malformed/base64 bodies, unsigned requests on all four endpoints, duplicate headers and read/retry/write accounting.
- **230 existing relevant Node 22 tests**, including accepted security, adaptive, Bayani, narration and draft compatibility coverage. These test unchanged accepted code; they are not a Netlify-hosted browser test.
- **18 emulator proof assertions**, covering signed App Check failures, Auth/account failures, five-question quotas/follow-ups, forged fields, first/failing/retry rewards, duplicate receipts, fresh-process recovery, physical loopback disconnect, real failed commit, mixed rewards, daily rewards, chapter badges, legacy values/timestamps, start quotas and direct/private rule denials.

No Netlify CLI build/deployment or updated full browser integration was performed. The local Lambda bridge is tested directly and through a loopback-disconnect fixture; Netlify's actual gateway, bundle, native cold starts and concurrency remain untested.

## Class results and operation counts

Counts below include **new issuance, five main answers, follow-up flow and reward submit**, not only the final save. Sample users have seeded valid prerequisites and shallow histories. They are not real learner records. All mission cohorts end with XP **45**, one canonical mission completion/best score 100 or 60 as applicable, one artifact and no premature chapter badge.

| Independent students | Saves passed/failed | Final-save p95 | Minimum document-read units | Committed writes | Deletes |
|---|---:|---:|---:|---:|---:|
| 1 | 1 / 0 | 280 ms | 660 | 20 | 0 |
| 5 | 5 / 0 | 222 ms | 3,300 | 100 | 0 |
| 10 | 10 / 0 | 311 ms | 6,600 | 200 | 0 |
| 30 | 30 / 0 | 710 ms | 19,800 | 600 | 0 |
| 30 repeat | 30 / 0 | 637 ms | 19,800 | 600 | 0 |

These cohorts had zero terminal failures and zero SDK callback retries. Same-student concurrent mission/daily processing retried one callback and retained both rewards, total XP 55. The host is the local machine, not a free Netlify instance; these timings are **not classroom hosted capacity or latency promises**. The single-student row is one sequential lifecycle, not a repeated sequential benchmark.

| Additional scenario | Read units | Committed writes | Notes |
|---|---:|---:|---|
| 30 daily completions | 810 | 210 | 27 reads / 7 writes per daily; mission XP accumulates |
| 30 chapter completions | 2,580 | 210 | 86 reads / 7 writes each; prerequisites seeded, one badge each, no new chapter XP |
| One failed mission then passing retry | 1,320 | 37 | Failure creates no completion/collectible; first pass pays once |
| Three concurrent committed-attempt replays | 12 | 0 | Saved receipt, no additional payment |
| Action replay/resume/stale revision sequence | 306 | 4 | Includes issuance and one answer; UUID recovery retained |
| Legacy/history mission | 679 | 18 | Synthetic 20 quiz/5 practice/10 review history records; XP 777, best 100, original timestamps retained |
| Real commit collision then retry | 715 | 20 | gRPC 6 ALREADY_EXISTS; failed callback queued seven writes, none committed; retry same attempt succeeds |
| Pending save, physical loopback disconnect, resume/replay | 667 | 20 | One committed reward despite missing response |
| Sampled cold dashboard/collection queries, 30 users | 3,420 | 0 | Current dashboard query shapes, shallow synthetic histories |
| Sampled cached dashboard queries, 30 users | 240 | 0 | Catalog cache-hit assumption, user progress still read |
| Sampled lesson/profile/detail documents, 30 users | 120 | 0 | Four document reads each; excludes story-scene downloads |

Fresh child-process issuance took about **5.02 seconds**; receipt recovery about **4.70 seconds**, including process/SDK initialization and emulator connections. This verifies state does not depend on a warm process, not a simulated Netlify cold-start guarantee. A follow-up before the first settled run caught a recursive **test fault-injector** error; the corrected injector now uses a proxy and demonstrates a real commit collision. Earlier preliminary evidence remains separate from final results.

The meter observes actual Firestore SDK transaction gets/query results and callbacks, including retries. Reads count one per point request and at least one per query, or the returned document count when larger. It separates queued write attempts from writes in the successful callback. Seeding/cleanup/integrity assertions and Auth service calls are excluded. **These are document-based minimum units, not an authoritative production bill:** production index-entry charges, Security Rules dependent reads, network bytes, automatic lower-level RPC retries and hosted index requirements are not fully measured. Emulator free quotas are not enforced here. Dashboard counts use real emulator queries modeled from current source, not a complete browser trace or measured existing-user traffic.

## Spark projection

Spark's 50,000 reads/day and 20,000 writes/day are shared with all existing application activity. The completed measurements revise the earlier conservative 54K assessment-read estimate for these specific fixtures; they do not establish a worst-case catalog/history bound. [Official limits](https://firebase.google.com/docs/firestore/quotas).

| Thirty-student school day | Modeled minimum reads | Writes | Read headroom below 50K |
|---|---:|---:|---:|
| One mission + one daily + sampled cold/warm/detail UI | 24,390 | 810 | 25,610 |
| Above + one chapter | 26,970 | 1,020 | 23,030 |
| Two missions + one daily + same sampled UI | 44,190 | 1,410 | 5,810 |
| Above + one chapter | 46,770 | 1,620 | 3,230 |

The one-mission day looks plausible **if** unmeasured traffic fits the reserve. The two-mission day is fragile: retries, mature histories, teacher reports, story scenes, practice, draft writes or other students can consume its small headroom. A failed-then-pass student consumes another mission lifecycle. Do not cap educational access or remove validation checks silently to meet the quota.

Applying these measured first-mission/daily/chapter rates to the earlier month (750 mission attempts, 120 chapters, 300 dailies) gives **513,420 backend read units**, plus **75,600 sampled UI units** over 20 school days, before restores/retries/unmeasured traffic. The corresponding 17,940 backend writes assumes passing-mission rates; failures may write fewer. This is a projection across heterogeneous activities, not measurements of all 66 missions or a monthly quota—Firestore allowances reset daily. Actual traffic of existing learners was not accessed.

An additional test for a catalog/prerequisite-heavy mission was prepared but **not executed**: automatic approval review failed due to a tool usage limit. This was not a determination that the test was unsafe, and no bypass was attempted. The follow-up helper export/quiz-identity parameterization has not received a new full emulator run. The completed final run above precedes that small harness refactor. Do not count `catalog-case.cjs` as passing evidence.

## Netlify Free and no-payment status

Current official docs list **300 monthly credits, hard limit, no auto-recharge**, with 15 credits per production publication, 10 credits/GB-hour compute, 2 credits/10K web requests and 20 credits/GB outbound. Synchronous execution is documented at 60 seconds; resource settings differ from Cloud Run's 256 MiB/max-two/concurrency-eight. Do not use obsolete legacy 125K-invocation allowances. [Plan](https://docs.netlify.com/manage/accounts-and-billing/billing/billing-for-credit-based-plans/credit-based-pricing-plans/), [metering](https://docs.netlify.com/manage/accounts-and-billing/billing/billing-for-credit-based-plans/how-credits-work/), [function configuration](https://docs.netlify.com/build/functions/configuration/?fn-language=js).

The earlier 12,780 calls/month example at 0.5–2 seconds and 1–2 GB memory, four publications and 1 GB responses gives roughly **100–225 credits**. Local warm timings do not verify those hosted allocation/duration assumptions. CORS preflights, cold starts, large responses, retries and other projects share limits. A free-credit pause can interrupt saves even when Firebase still has quota.

Netlify's official **older** Free-plan announcement explicitly says no card. Current Free docs promise no charges but do not conclusively document every new-account verification requirement. The public signup URL exposed only a JavaScript shell through the read-only research tool. **Current account-specific no-card onboarding remains unconfirmed. No account was created and no signup submitted.** Stop if a later authorized signup asks for payment information or a subscription. [Official historical statement](https://www.netlify.com/blog/introducing-netlify-free-plan/), [signup page](https://app.netlify.com/signup).

## Credentials, availability and Cloudflare fallback

The existing Firebase website/Auth/database and canonical IDs can remain; no progress migration is needed. Future external deployment still needs reviewed callable routing/CSP, a real Netlify bundle/Node version/region configuration, provider secret handling and least-privilege Firebase authorization. Managed Google runtime ADC and gcloud build/runtime bindings do not transfer to Netlify. Workload federation, if actually supported, or a separately approved narrowly scoped key requires a new security review. No key/account/IAM action occurred. Admin bypasses client rules; all current server checks must remain.

Real App Check repair/attestation, backup/recovery without billing, dependency disposition, all-endpoint abuse controls and quota-exhaustion handling remain unresolved. The experiment refuses production and is not an activation package. Free quota exhaustion should pause saves without deleting receipts or restoring client writes; later recovery reuses the same IDs. A host/network outage can outlast an uncommitted attempt's expiry.

**Cloudflare Workers Free** remains the fallback with an explicit official no-card offering and 100K requests/day, but only 10 ms CPU/request. The request volume looks sufficient on paper; the accepted Node/Admin/gRPC runtime and cryptographic/catalog CPU costs are not proven compatible. A REST transaction adapter could be needed, creating larger read-order/retry/idempotency proof obligations. Switching hosts cannot remove Firestore's shared daily limit, App Check quota or recovery requirements. No Workers implementation or CPU benchmark was run. [Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/), [Node compatibility](https://developers.cloudflare.com/workers/runtime-apis/nodejs/).

## Decision and next steps

**GO for further local feasibility work; NO-GO for account creation, deployment or student rollout.** The local Node transport preserves the tested security/reward behavior and two 30/30 waves pass. A completely free classroom service remains conditional, not proven.

Next review should complete the catalog-heavy measurement, full browser-to-adapter compatibility and Netlify bundle check; quantify story/practice/draft/teacher/history traffic; establish daily headroom and abuse/pause behavior; and present external credential/recovery design. Current no-card signup must be confirmed under separately authorized account work or official provider clarification. Cloudflare should be considered only if Netlify's payment/terms/bundle gate fails, with separate porting approval. No live student traffic or credentials are necessary for the next local tests.

Evidence: `priority-3-netlify-proof-results-2026-11-07.json`, final proof log, adapter/compatibility unit logs, projection/integrity JSON, retained initial/preliminary logs. Exact new code is confined to `experiments/priority3-netlify/`; generated logs/reports are under `docs/validation/`. Copied service and rules files match accepted hashes. No accepted release file or manifest was regenerated.

Accepted manifest remains **`0b902b44931e19bde9e26db746c6518def3991367f85717f01014f28c3beb2ef`**. All **242 artifact and 23 source hashes** were rechecked with no drift. Stage 1 remains on hold. Await review before further action.
