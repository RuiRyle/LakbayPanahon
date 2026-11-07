# Priority 3: no-payment hosting security and operational review

7 November 2026. **Production remains NO-GO. No verified configuration-only, no-payment deployment satisfies all current requirements.** Cloudflare Workers Free with a SQLite-backed Durable Object is the strongest candidate for another local compatibility investigation, not an approved deployment. Blaze stays on hold.

This round inspected official public documentation, installed dependency code and prior local evidence. It did not create accounts, install tooling, deploy, enable APIs, change IAM/rules/production, access student records or begin Priority 4. No new provider-runtime or hosted security tests were performed. The accepted candidate and experiments were preserved.

## Comparison

| Option | Credential/security boundary | Durable authority | Compatibility and availability | Verdict |
|---|---|---|---|---|
| Netlify Free Node Functions alone | Can keep credentials server-side and out of a correctly built browser bundle; Free does not provide fine-grained build/runtime variable scopes. Untrusted deployers remain dangerous. | The prototype's local journal is not suitable as shared serverless authority storage. Another durable design is required. | Smallest change to the locally tested callable/Node transport; hosted build, secrets, capacity and signup unverified. Credit exhaustion can stop service. | **NO-GO as currently designed.** |
| Netlify grading + independent Workers/Durable Object authority | Can keep publication approval/signing away from Netlify. Does not isolate Netlify's grading credential from untrusted builds by itself. | Plausible independent checkpoint and durable lease service. | Retains the Node grading core, but adds cross-provider coordination, credentials, failure handling and a Worker authority implementation. | Possible future hybrid; **not a fix for strict Netlify Free credential isolation**. |
| Workers Free grading + SQLite Durable Object authority | Documented runtime secret bindings and separate build configuration are promising. Backend deployers must still be trusted; previews need separate credentials/namespaces. | Native candidate for durable generation, operation and lease records. | Default installed gRPC path is problematic; REST compatibility and CPU limits need proof. Full grading/publication integration is untested. | **Preferred next local research candidate; hosted NO-GO.** |
| Operator's existing computer as publisher/authority | Signing material can stay off the grading host. | A local journal can persist, but class availability depends on that machine, network and a secure remote interface. | No payment may be needed for existing hardware; power, maintenance and connectivity are real costs/risks. | Useful for on-demand approval/publication; unsuitable as an assumed reliable always-online authority. |

No option requires moving the Firebase website, Auth users or canonical progress/rewards to another database. Backend transport, publishing and operations would change; existing student data must remain in Firestore.

## 1. Netlify Free: which isolation is actually available?

[Netlify's Functions documentation](https://docs.netlify.com/build/functions/environment-variables/) places fine-grained environment-variable scopes on Pro and above. It also describes deployment-time environment snapshots and a 4 KB aggregate limit in Lambda compatibility mode. Therefore **Free cannot be certified to enforce a runtime-only Firebase Admin secret that is inaccessible to build code through scope controls**.

Keeping a credential out of the browser is a different, achievable application boundary: inject it server-side, never put it in public-prefixed variables, repository files, generated browser assets, source maps or responses. This was partly checked with dummy values locally, not with hosted production credentials. Masking/encryption at rest does not stop runtime code from reading its secrets.

A backend-only, prebuilt, reviewed package with Git builds/previews disabled reduces exposure, but is an alternative trust model, not proof of an enforced build/runtime scope boundary. Exact Free account controls and deploy-artifact behavior remain untested. Production credentials must not be inherited by previews, branch deployments or local development. Every immutable old deployment must be considered when rotating/revoking credentials.

Content writers must have no backend deployment permission or credential access. Any actor who can deploy arbitrary function code can make that code exfiltrate its runtime credential; the same general limitation applies to Workers. Trusted deployment authority and untrusted educational content editing must be separate.

Netlify's current Free allowance is 300 monthly credits with a hard limit; compute, publishing and delivery consume the pool. This review does not turn local latency into a hosted credit forecast. [Credit documentation](https://docs.netlify.com/manage/accounts-and-billing/billing/billing-for-credit-based-plans/how-credits-work/). Present no-card signup/identity verification for this user remains untested; the earlier no-card announcement is not a successful current onboarding test.

Netlify Blobs now documents strong reads and conditional writes. That makes a custom single-record coordination design conceivable, but does not prove our durable multi-operation lease/recovery protocol or an independent credential boundary. It is not a validated substitute for the authority, and the same site/build trust domain must be examined. [Blobs documentation](https://docs.netlify.com/build/data-and-storage/netlify-blobs/).

## 2. Workers Free: compatible in principle, unverified in this application

Cloudflare advertises no-card entry. Workers Free documents **100,000 requests/day and 10 ms CPU per invocation**. These are product statements, not confirmation of this user's account eligibility, signup checks or capacity for our code. [Cloudflare](https://www.cloudflare.com/), [Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/).

Workers offers encrypted per-Worker secret bindings; Builds documents build-only values separately from runtime configuration. This is a better starting boundary than assuming Netlify Free has runtime-only scopes. Still, a deployment token can authorize malicious runtime code; use controlled backend deployment, least-privilege deployment credentials, explicit staging/production separation and no production authority binding in previews. [Runtime secrets](https://developers.cloudflare.com/workers/configuration/secrets/), [build configuration](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/).

| Existing requirement | Workers route | Unresolved proof |
|---|---|---|
| Firebase Auth | Keep Firebase-issued tokens and verify signature, audience, issuer, expiry and subject. Preserve account-disable/revocation checks. | JWT verification alone is weaker than the current `verifyIdToken(token, true)` behavior; an authenticated current-status lookup or equivalent verified SDK path is needed. |
| App Check | Firebase explicitly supports protecting custom backends. Use original enforcement if SDK compatibility permits, otherwise implement and test the documented token checks. | Invalid/foreign/expired tokens, key refresh, unavailable verification and real production attestation. App Check does not replace UID throttling. |
| Firestore transactions | Prefer the installed SDK's HTTP/1.1 REST mode; if incompatible, a REST transaction adapter can retain the database and grading core. | Begin/read/query/commit/rollback, server timestamps, retries, create preconditions, contention, receipt replay and exactly-once awards. Plain independent REST writes are unacceptable. |
| Four callable endpoints | Retain original Node wrappers where possible, or implement an equivalent callable transport. | Lambda-event compatibility is not a native Workers request handler. CORS, duplicate headers, body limits, error envelopes, Auth and App Check need regression coverage. |
| Compact catalogs | Canonical hashing, signatures and published-bank logic are portable in principle. | Worker crypto/serialization parity, CPU, bundle size and atomic source/pack/head publication. |

Firebase documents [custom-backend App Check](https://firebase.google.com/docs/app-check/custom-resource-backend), [token verification](https://firebase.google.com/docs/auth/admin/verify-id-tokens), [revocation/session handling](https://firebase.google.com/docs/auth/admin/manage-sessions), and [REST access](https://firebase.google.com/docs/firestore/use-rest-api). These document possible interfaces, not a tested Worker port.

Local static inspection found `firebase-admin 14.5.0`, `firebase-functions 7.4.0`, `@google-cloud/firestore 9.3.1` and `@grpc/grpc-js 1.14.6`. The installed gRPC transport imports `http2`. Workers' current Node documentation lists `node:http2` as a nonfunctional import stub. Importing a module successfully therefore cannot certify gRPC operation. [Workers Node compatibility](https://developers.cloudflare.com/workers/runtime-apis/nodejs/).

Importantly, the installed Firebase SDK documents `preferRest`, which uses HTTP/1.1 until an operation requires gRPC; its declaration identifies snapshot listeners as such an operation. This offers a potentially smaller-change experiment than immediately rewriting Firestore access. It is **not a compatibility pass** for Workers: OAuth, Auth SDK, Node APIs, callable wrappers and bundling still need actual runtime tests. [Firestore settings](https://firebase.google.com/docs/reference/admin/node/firebase-admin.firestore.firestoresettings).

## 3. Separately hosted publication authority

**Candidate design, not implemented:** use a dedicated Worker and one stable SQLite Durable Object identity for this pilot's authority. Keep it separate from ordinary content repositories, deployment permissions and public grading routes. An operator can sign reviewed publication approvals offline; the signing private key need not live on Netlify or the public grading Worker. Approval must bind operation ID/nonce, expected parent generation, artifact/source digest, next head digest and action. An application-admin claim alone must not authorize publishing.

SQLite-backed Durable Objects are currently included on Free. Documented Free limits include 100,000 requests/day, 13,000 GB-s/day, 5 million rows read/day, 100,000 rows written/day and 5 GB storage. Exceeding a limit fails further operations of that type; daily limits reset at 00:00 UTC. This is a plausible size for metadata coordination, not a measured deployment guarantee. [Durable Object pricing](https://developers.cloudflare.com/durable-objects/platform/pricing/).

For scale context only, the measured classroom made about 1,200 grading-service transactions. A hypothetical acquire/check/release design could add roughly 3,600 authority calls, before retries, publication and abuse. That is numerically below the documented request allowance; SQL rows, duration and CPU must still be measured. Moving work between a Worker and its Durable Object changes which limits apply; do not assume the frontend's 10 ms budget measures the whole system.

Suggested durable tables:

* `authority`: current generation, signed-head/source digests, deployment epoch and phase;
* `publications`: unique operation ID, parent/next generation, approved artifact digest and PREPARED/COMMITTED/ABORTED state;
* `inflight`: attempt/operation ID, observed generation, authorized deployment and unresolved commit status;
* `events`: append-only audit sequence with previous-event digest.

Do not keep the only counter or lease state in memory: objects can be evicted/restarted. Do not use eventually consistent Workers KV as the current-generation authority. [Object lifecycle/state](https://developers.cloudflare.com/durable-objects/reference/in-memory-state/), [KV limitations](https://developers.cloudflare.com/kv/concepts/how-kv-works/).

## 4. Coordination and crash recovery

The required protocol remains: persist FREEZING, reject new work, drain/reconcile in-flight commits, persist PREPARED, atomically commit Firestore legacy source + packs + next signed head, then persist the committed authority checkpoint and reopen. Parent-generation CAS and unique operation IDs prevent concurrent/replayed approvals from becoming new publications. Rollback references retained approved content but always advances generation.

**SQLite and Firestore do not form one atomic transaction.** SQLite transaction APIs govern the object's storage, not an external Firestore commit; `transactionSync` cannot contain asynchronous network work. [Storage transactions](https://developers.cloudflare.com/durable-objects/api/sqlite-storage-api/). Persist enough data to reconcile each interrupted step:

| Failure | Required recovery |
|---|---|
| Before Firestore commit | Verify old head/source and abort or retry the prepared operation; remain paused meanwhile. |
| Commit response lost | Inspect canonical head/receipt using the recorded operation; never assume either success or failure from a timeout. |
| Database committed, authority not advanced | Verify approved head/source and finish the recorded checkpoint commit. |
| Old head restored in Firestore | Compare against the independent durable checkpoint; reject grading. |
| Authority storage missing, restored or inconsistent | Fail closed; reconcile against an independently retained highest checkpoint. Never initialize version zero automatically. |

An expired lease or elapsed timeout is not proof that a remote worker cannot still commit. A hybrid with Firestore write credentials on Netlify therefore needs rigorous fencing and commit reconciliation. Prefer investigating a **single trusted execution boundary that owns all grading/publication Firestore commits**, rather than delegating unrevocable commit authority to arbitrary old workers. That is a substantial integration change and still requires credential separation for ordinary editors.

Provider restoration of both the database and the authority store could rewind both copies. Maintain separately controlled signed highest-checkpoint records and a forward-only restore procedure. Hash chaining and signatures alone cannot resist an owner who can restore all trusted state and keys. No such hosted restore protection was established locally.

## 5. Unauthorized raw Admin changes before grading

This is the decisive unresolved requirement. The prototype immediately detects a restored head or modified referenced pack. It does **not** continuously detect changes to legacy question documents, and its original service still reads some live grading metadata. Full source checks happen during publication/recovery. Nor does catalog signing protect arbitrary direct edits to canonical learner XP by a fully privileged writer.

There are three distinct choices:

1. **Prevent bypass:** ordinary and privileged application content writers must have only draft/client capabilities, no raw Admin/IAM writes or backend deployment access. All live publication goes through the trusted path. This preserves compact read efficiency, but requires real credential/IAM and authoring-workflow verification. Local client-rule denials do not prove those hosted privileges are absent.
2. **Detect immediately:** reread and validate the affected legacy sources inside the grading transaction against approved hashes. Replacing the measured 1,740 pack reads with the prior 27,090 bank-document reads projects approximately **57,342 daily reads** from the 31,992 authority workload, before broader metadata checks. This is an arithmetic projection, not a new benchmark, and fails both 40,000 and Spark 50,000. A periodic audit, polling, trigger or asynchronous alert leaves a race and is not equivalent.
3. **Change the authoritative data model:** put every grading-critical input in signed published artifacts and make legacy sources explicitly non-authoritative drafts, with published views for students. This can ensure unapproved drafts do not influence grades, but it does **not detect each draft edit before grading**. It also requires extending the current prototype beyond question banks and reviewing live policy/progress trust separately.

There is no demonstrated low-read mechanism that compels an unrestricted Admin writer to update a generation marker on every write. Such a writer bypasses client rules. If retaining untrusted raw Admin writers while detecting every change before grading is non-negotiable, **NO-GO applies to all compared hosts**, not just Free hosting. [Server-library access boundary](https://firebase.google.com/docs/firestore/security/rules-fields).

## 6. What is locally testable versus hosted-only

| Local work possible without accounts | Still needs approved hosted verification |
|---|---|
| Workers local-runtime bundle/import smoke test; first try installed SDK REST mode | Real Google credential/OAuth behavior, provider runtime compatibility and Free account eligibility |
| Emulator transaction, Auth/App Check negative cases, receipts, adaptive parity and deterministic replay tests | Real App Check attestation, revoked-user behavior, key refresh, hosted HTTPS/origin restrictions |
| Local SQLite object protocol, restart/fault injection, duplicate operations, fencing and restored-head attacks | Real eviction, regional outages, deployment replacement, storage durability/restore and cross-provider failures |
| Dummy-secret scans of local packages, logs and preview configurations | Actual build/runtime/preview permissions, old deployment access and credential revocation |
| Synthetic 30-student load, larger histories and browser traffic | Classroom network latency, CPU/credits/duration quotas, abuse bursts and end-to-end availability |

This review performed the documentation and installed-code inspection only. No Worker runtime test, new emulator benchmark or provider credential test is claimed. The previous locally verified authority workload remains **31,992 reads / 2,220 writes**, or **34,570 / 2,370 including initial audited publication**. Rules/index/other traffic and older histories remain additional; hosting choice alone does not change Spark quotas.

## Recommendation and next decision

**NO-GO for production and for claiming a secure, reliable no-payment deployment without substantial further work.** The published free allowances plausibly accommodate a small pilot, but do not prove this code, authority protocol or security boundary on either platform.

If further local research is approved, prioritize a Workers local-runtime compatibility proof using the installed SDK's REST mode and a SQLite Durable Object coordinator. Preserve the original grading core, website, Auth users and canonical Firestore records. If SDK compatibility fails, assess a transaction-preserving REST adapter separately rather than weakening verification. Then test durable fencing/commit reconciliation and full browser traffic before proposing hosted work.

The other essential decision is whether content writers can be completely separated from raw Admin access. If not, the strict immediate-detection requirement currently conflicts with the read budget. Waiting for an approved trusted hosting route is safer than deploying a workaround that relaxes that requirement; paid billing alone would not resolve the privilege flaw either.

Stage 0 integrity passed: **242 artifacts, 23 source entries and 12 service copies; zero drift**. Manifest remains `0b902b44931e19bde9e26db746c6518def3991367f85717f01014f28c3beb2ef`. No release manifest was regenerated. Await approval before implementation or any external action.
