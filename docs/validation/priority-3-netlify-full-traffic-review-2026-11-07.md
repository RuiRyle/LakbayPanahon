# Priority 3: local full-traffic feasibility review

7 November 2026. **Local verification passed; hosted student pilot remains NO-GO. Blaze stays on hold.** All new code is under `experiments/priority3-netlify`; only demo Auth/Firestore, synthetic learners and pinned educational content were used. No accounts, real credentials, deployment, production access, rules changes or Priority 4 work occurred.

## Measured workload and limits of the evidence

The new journey harness executes real emulator SDK operations, and the original four secured Firebase `onCall` handlers through the Lambda-compatible adapter. Thirty users concurrently complete mission-1 and then mission-2, with adaptive follow-ups (ten learners answer two initial questions incorrectly). Each completion is replayed twice concurrently, modeling lost acknowledgements. Every learner loads an initial dashboard, reads two eight-scene stories, makes eight draft saves per story, and returns to the dashboard after each mission. One teacher refreshes all 30 student reports four times.

Story scene count is an explicit synthetic assumption: the accepted catalog does not contain story scenes. Draft operations follow `js/learning-draft.js`: initial read, transaction read/write, then committed timestamp read. Teacher reads follow `readTeacherStudent` in `js/teacher-class-client.js`, including membership, profile, progress and attempts; link writes are counted. Teacher approval/ownership reads are represented, but rules-dependent reads are not. Initial histories are fresh. Seed writes and assertion reads are excluded. No deletion or retention job is included.

This is a **query-shape replay, not a complete browser trace or a billable-usage measurement**. UI queries use Admin SDK, so they do not exercise client rules. Catalog/dashboard history documents and server transaction callback retries are counted, including minimum one read for empty queries. Production index-entry reads, rule-dependent reads, transport retries, denied client requests, listeners/reconnects, practice/review authoring and historical distributions remain additional. Existing earlier tests cover contention and recovery; this run had zero transaction retry callbacks and zero failed transactions.

| Measured phase | Reads, baseline | Reads, shared display | Writes, both | Deletes |
|---|---:|---:|---:|---:|
| Initial dashboards | 3,360 | 3,360 | 0 | 0 |
| Stories and draft autosaves | 1,740 | 1,740 | 480 | 0 |
| 60 adaptive mission assessments | 39,210 | 39,210 | 1,200 | 0 |
| 120 committed save replays | 480 | 480 | 0 | 0 |
| Dashboard returns | 6,840 | 720 | 0 | 0 |
| Four full-class teacher refreshes | 732 | 732 | 120 | 0 |
| **Total** | **52,362** | **46,242** | **1,800** | **0** |

The second complete run shares four display catalog collection promises per learner across three dashboard consumers in one page lifecycle. It saves **6,120 reads**; grading, reward checks, eligibility and policy remain uncached. This is an isolated experiment, not integrated application behavior. Navigation/reload starts a new cache; a real journey spanning page navigations may obtain less or no saving. The existing content cache already coalesces some reads: do not subtract these savings again from traffic already served by that cache. The previous display parity/fresh-page test also remains available.

[Firestore's free quota](https://firebase.google.com/docs/firestore/pricing) is 50,000 reads, 20,000 writes and 20,000 deletes per day; resets are around midnight Pacific, not Philippine midnight. One qualifying database, 1 GiB storage and 10 GiB/month outbound are separate limits. **Proposed planning target: 40,000 reads and 16,000 writes/deletes**, leaving 20% for uncertainty. It is a planning reserve, not an enforcement mechanism.

| Scenario | Reads/day | Writes/day | Conclusion |
|---|---:|---:|---|
| Measured two-mission baseline | 52,362 | 1,800 | Exceeds read quota |
| Measured experimental display sharing | 46,242 | 1,800 | Below quota, fails reserve |
| Shared + previously measured 30 daily and 30 chapter assessments | 49,632 | 2,220 | Projection; only 368 reads left |

The last row adds earlier measurements of 810/210 daily reads/writes and 2,580/210 chapter reads/writes; it is not a combined end-to-end run. Fresh history assumptions make these results unsuitable as a long-term guarantee. For example, 30 additional quiz attempts per learner across three dashboard reads and four teacher refreshes add approximately **6,300 document reads**, before rule/index overhead. History pagination alone does not reduce total reads if every page is still loaded. No free hosting provider changes Spark's database quota.

## Safe reductions investigated

* Keep the proven display promise sharing within a page lifecycle, with explicit refresh and invalidation. Do not use it as evidence for unlocking, grading, awarding or current account status. Real browser tracing must establish how much redundancy actually exists.
* Load teacher reports on demand; four refreshes cost 732 measured reads and 120 link writes here. Deduplicating overlapping display requests is safer than silently serving stale authorization or student state. Link-write removal requires a separate rules/authorization review.
* Preserve the existing draft queue's superseded-save suppression. Any additional debounce must flush on navigation and demonstrate refresh/lost-response recovery; reducing writes is secondary to preserving learning progress.
* The 39,210 assessment reads dominate. A separately reviewed, immutable versioned question/catalog snapshot could potentially reduce repeated catalog loads while retaining fresh transactional policy, profile, prerequisite, history and reward checks. It requires explicit publication/version semantics, revocation behavior and parity/adaptive tests. It is **not implemented or credited as a saving**. Unversioned server caches, client grading and cached reward eligibility are unacceptable shortcuts.
* A one-mission timetable is a possible lower-traffic pilot scope, not a verified full-feature capacity promise. Do not silently restrict two-mission days or disable existing features to claim success. All-endpoint UID throttling remains absent; App Check and start quotas do not stop valid-user read exhaustion.

## Browser and packaging checks

* **13/13 tests passed:** existing wrapper/security/meter checks plus explicit source packaging. Unknown routes, unsigned calls, duplicate headers, malformed/oversized input and failed transaction accounting remain covered.
* **Headless Chrome passed:** real Firebase web SDK 12.4.0 signs into local Auth, sends signed test App Check through `httpsCallableFromURL`, starts and resumes the same five-question assessment through the adapter; unsigned request returns 401. This is loopback HTTP with test-only JWKS trust, not production reCAPTCHA, hosted HTTPS, full UI navigation, mobile/Safari/Firefox or production cross-origin validation.
* An allowlisted source staging package under `experiments/priority3-netlify/package-preview` excludes fixture/test files, rules, browser assets and private-key blocks. A random dummy environment canary is absent from staged output; the detector's deliberate-leak control passes. **This is not a Netlify executable bundle**: installed dependencies/native tracing, provider bundling, log redaction and deploy artifacts still require verification. The local entry deliberately rejects production configuration.
* Accepted Stage 0 integrity passed: **242 artifacts, 23 source entries and 12 copied service files; zero drift**. Manifest SHA-256 remains `0b902b44931e19bde9e26db746c6518def3991367f85717f01014f28c3beb2ef`. No release manifest was regenerated.

## Netlify Free credential isolation and plan fit

Current [Free plan documentation](https://docs.netlify.com/manage/accounts-and-billing/billing/billing-for-credit-based-plans/credit-based-pricing-plans/) provides 300 monthly credits with a hard limit and no auto recharge. Functions compute consumes 10 credits/GB-hour, requests 2 credits/10,000 and outbound bandwidth 20 credits/GB; production publishing also consumes credits. Measured local latency cannot establish hosted compute consumption or availability. Credit exhaustion is an availability risk, even with no payment method.

[Functions environment documentation](https://docs.netlify.com/build/functions/environment-variables/) explicitly places fine-grained variable scopes on Pro and above. **Do not promise Free runtime-only secrets isolated from builds.** [Variable defaults](https://docs.netlify.com/build/environment-variables/overview/) are all scopes/all deploy contexts. Context-specific values are documented, but actual Free account controls remain untested. [Secrets Controller](https://docs.netlify.com/build/environment-variables/secrets-controller/) documents encrypted storage, write-only secret values and explicit contexts/scopes; code running on the platform can still read the values. Smart secret detection is documented for Personal/Pro/Enterprise. Neither masking nor scanning protects a credential from malicious code with runtime/build access.

Required design before any credential is supplied:

1. Backend-only project and controlled source/build dependencies; no frontend generation using production environment values. No `VITE_`, `NEXT_PUBLIC_`, browser config, committed `.env`, `netlify.toml`, bundled JSON key, source map or copied repository root containing secrets. Base64 is not encryption.
2. No production credentials in previews, branch deployments, preview servers or local development. Prefer disabling those deployment paths entirely for the privileged backend; demonstrate effective context isolation with dummy canaries before any real secret. No untrusted PR builds/plugins or automatic preview execution with production values.
3. Never log environment dumps, Authorization/App Check headers, service-account JSON or request bodies. Test both successful and failing builds/functions and inspect source maps, publish directory, provider function ZIP and logs using dummy canaries. Restrict log/project access. A clean local staging package cannot certify these hosted boundaries.
4. Use a dedicated least-privilege service identity with only required Firestore and Auth permissions, not Owner/Editor. Admin access bypasses client Firestore rules, making compromise particularly serious. No key creation, IAM change or key inspection is authorized now. Prefer short-lived federation only if a documented compatible runtime issuer is actually available; none has been proven for this adapter. A service-account key would require separate approval, secure runtime injection, rotation/revocation and incident procedures.
5. Retired previews and immutable old deployments must lose access through credential revocation/rotation as appropriate. Changing a current environment variable alone is not proof that every old deployment has stopped using a credential.

**Plan-fit verdict:** core Auth/App Check verification can run in Node without paid application-security middleware. However, Free does not meet a strict requirement that a credential be inaccessible to build code through variable scope controls. A controlled backend-only workflow may be an alternative trust model, but it is unverified and needs explicit approval; no security equivalence is claimed. If runtime-only separation is mandatory, Netlify Free is NO-GO for that design.

Netlify's [official November 2024 announcement](https://www.netlify.com/blog/introducing-netlify-free-plan/) says no credit card is required, but its legacy allowances differ from current credits. Current Free documentation establishes no-charge/hard-limit behavior, **not that this user's present signup/identity-verification path will never request a card**. No account was created and no registration was submitted. Current no-payment onboarding remains an account-level unknown.

## Alternative and remaining approval gates

**Cloudflare Workers Free is the first fallback to investigate**, not a drop-in replacement. Cloudflare [advertises no-card onboarding](https://www.cloudflare.com/); Workers [Free limits](https://developers.cloudflare.com/workers/platform/pricing/) are 100,000 requests/day and 10 ms CPU/invocation. [Runtime secret bindings](https://developers.cloudflare.com/workers/configuration/secrets/) offer a useful separation from source/build configuration, but privileged runtime code can still read them. The Node/Admin/Firestore transport and CPU budget must be proven; retaining transactions may require a substantially larger adapter. No Workers benchmark, secure deployment or full API compatibility is established. It also cannot repair the Firestore read deficit. Do not migrate progress/rewards to a new database as a hosting workaround.

Before a hosted pilot, separate approvals and work remain for: current no-card onboarding; a demonstrated credential/preview/build model; a real standalone provider bundle; full client-rules/browser traffic tracing with larger histories; sufficient daily quota reserve; all-endpoint abuse controls; real App Check attestation; restrictive rules publication and reviewed client routing/CSP; secure backup/restore; hosted 30-user cold/concurrent/retry tests; and an operator-controlled fail-closed pause/recovery procedure. Reopening secure assessment must preserve receipts, history, XP and progress. None of these external actions is authorized by this local task.

**Recommendation: NO-GO for hosted students or an assurance of two missions/day on Spark.** Continue only separately approved local work on authoritative catalog-read reductions and actual browser/rules traffic instrumentation. Netlify remains the smaller transport change, but its Free credential boundaries and onboarding are unresolved. Workers is an untested fallback. No deployment or account action should follow until reviewed and approved.

Evidence: `priority-3-netlify-full-journey-2026-11-07.json`, `priority-3-netlify-full-journey-shared-2026-11-07.json`, `priority-3-netlify-browser-transport-2026-11-07.json`, `priority-3-netlify-package-preflight-2026-11-07.json`, `priority-3-netlify-traffic-unit-2026-11-07.log`, and `priority-3-netlify-full-traffic-integrity-2026-11-07.json`, all in this directory.
