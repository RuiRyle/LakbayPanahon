# Restricted content authority and Workers feasibility

7 November 2026. **GO for a bounded further local implementation; NO-GO for a hosted pilot or production. Blaze remains on hold.** Cloudflare is worth pursuing as a candidate, but a secure no-payment deployment is not yet demonstrated. The unchanged complete Firebase SDK bundle failed to start in local workerd. Eight isolated compatibility checks and one process-restart persistence check passed. These are narrower results than an assessment backend running successfully.

All new work is in `experiments/priority3-workers-restricted` and these validation artifacts. No accounts, hosted resources, credentials, billing, IAM changes, rules changes, production requests, real student data or Priority 4 work were used. Public documentation and npm tooling were downloaded. Existing synthetic Auth/Firestore emulators and local workerd were used. Stage 0 integrity passed: manifest `0b902b44931e19bde9e26db746c6518def3991367f85717f01014f28c3beb2ef`, 242 artifacts, 23 recorded sources and 12 service copies, zero drift.

## Proposed trust boundaries

This is a design, not an implemented CMS or deployed permission system. Teachers can create, review and request publication through authenticated application APIs; they receive no service-account, signing, deployment or Cloudflare account privileges. Firebase application roles are separate from Google IAM and Cloudflare account roles.

| Role | Allowed | Explicitly excluded |
|---|---|---|
| Teacher/content editor | Create and edit authorized drafts; submit an immutable revision for review | Live question/catalog/head writes, grading policies, student rewards/progress, executable content, secrets and backend deployments |
| Independent reviewer | Review canonical content plus difficulty metadata, approve one revision digest | Self-approval, changing approved bytes, role grants, credentials |
| Designated publisher | Request publication or rollback of a reviewed digest, with expected parent generation | Choosing an older generation, arbitrary live writes, replacing signed artifacts or approving own content |
| Security operator | Grant/revoke application roles, approve trusted backend releases, rotate keys and authorize exceptional recovery | Routine content editing through raw Admin tools; any bypass requires suspension and investigation |
| Publication authority runtime | Validate approvals, serialize generations, atomically publish approved source and catalogs | Accepting browser catalog bytes as grading truth; altering student rewards |
| Grading runtime | Verify identity/App Check, load current trusted catalog, execute original assessment/reward transactions | Publishing or approving educational content |

Require server-side current role and account-status validation for privileged actions, bounded sessions, action-specific nonces, expiry and audit records. A stale role claim alone must not authorize publication. Protect operator/provider accounts with MFA and recovery controls; separate reviewer identity from author. A teacher may hold publisher permission but cannot bypass the independent review. Editing a reviewed draft creates a new revision and invalidates its approval. Bind approval to project, source digest, catalog digest, operation ID, action and expected parent generation. Define an audited emergency process if only one reviewer is available; do not silently allow self-approval.

Use draft-only API permissions and collection-specific validation. Existing live-source/catalog denies remain intact. Do not grant teachers Firestore IAM data-writer roles: service-account access bypasses Security Rules. Firebase documents the distinction between ID-token Rules access and service-account IAM access in its [REST authentication guidance](https://firebase.google.com/docs/firestore/use-rest-api). Existing `admin` application claims must not become raw Admin privileges.

Schema allowlists must preserve content, stable question IDs, answer choices, difficulty/adaptive metadata and progress identifiers exactly. Escape rendered content; reject executable HTML/scripts and configuration uploads. Changes to XP, grading/reward policy or runtime code are security releases, not editorial publications. The first migration should package existing content unchanged and prove selection/marking parity.

## Credential and deployment isolation

Keep the frontend/editor deployment credential-free. Use a separately controlled backend project/repository and trusted release path. No preview or pull-request build receives production secrets, production service bindings or the production Durable Object namespace. Previews use synthetic projects and dummy credentials only. Build without Google keys; attach runtime secrets through a separately authorized operator step. Restrict logs to operation IDs, generation, outcomes and redacted errors: never dump request headers, environment, tokens, student answers or service-account material. Scan built artifacts and source maps with synthetic canary values before any hosted approval.

Cloudflare provides [runtime secret bindings](https://developers.cloudflare.com/workers/configuration/secrets/) and distinguishes [build variables from runtime variables](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/). This supports the proposed boundary, but a person who can deploy arbitrary backend code can exfiltrate its runtime secrets. Such deployers remain trusted. Untrusted content writers must have neither deployment tokens nor access to the backend release pipeline. Do not assume hidden dashboard values protect against malicious runtime code.

Use distinct grading and publication credentials and restrict Google IAM to required operations. **Do not claim Firestore IAM gives collection-level isolation equivalent to Rules.** The exact available IAM permissions and residual database-wide power need review; trusted runtime code is still a critical boundary. Prefer keyless federation only if a supported runtime identity flow can actually be established; none was demonstrated. Otherwise a rotated, least-privilege service-account key remains a high-value runtime secret. Publication signing/approval material must remain outside editor/build access. No actual credentials were generated or inspected here.

## Durable publication and grading protocol

Use one stable SQLite-backed Durable Object identity per project/catalog authority. Persist, rather than reconstruct from a potentially replayed Firestore head: highest committed generation, head/source digests, operation IDs, consumed approval nonces, phase, in-flight transaction records and recovery status. A new Worker deployment must reuse the same namespace and object identity. Never initialize generation zero when expected storage is missing. Freeze and request operator recovery instead.

1. Validate independent approval and current roles; canonicalize the approved draft; compare source/content digests and expected parent with durable authority state.
2. Persist `PREPARED` and a unique operation ID before external effects. Reject concurrent publishers and replayed operation IDs/nonces. Freeze new grading admissions and drain recorded in-flight work.
3. Let trusted code own Firestore commit issuance. Do not issue an expiring permission token that another process can continue using after the authority assumes it expired. Unknown transaction outcomes require reconciliation; time passing is not proof of abort.
4. Validate the current head and generation in the Firestore transaction. Publish legacy source changes, compact artifacts and new head together when the bounded transaction fits. For larger publications, stage immutable unreferenced artifacts, validate every required artifact, then atomically switch the source/version pointer and head. Do not expose a mixture of independently updated legacy documents. Oversized cases stay blocked until this representation is implemented and tested.
5. Commit the durable checkpoint only after confirming the matching Firestore operation marker/head. Reopen grading after reconciliation. Retries of the same operation return its established outcome.
6. Rollback republishes previously approved content under generation N+1, with new approval, operation ID and signature. It never restores generation N-1. Reject new work from stale browser sessions, return a safe restart instruction and preserve completed receipts/progress.

On restart, `PREPARED` with no committed Firestore marker may be safely retried only after proving no old request can still commit. A matching committed marker is finalized idempotently. A different head, missing storage, unknown commit outcome or digest mismatch keeps grading closed. Persist recovery decisions. Test interruption at every phase before implementation is accepted.

SQLite transactions protect local coordinator state; they do **not** make a transaction spanning SQLite and Firestore atomic. Cloudflare's [SQLite storage API](https://developers.cloudflare.com/durable-objects/api/sqlite-storage-api/) supplies the local primitive, not a distributed commit guarantee. Keep all student answers, progress, XP, badges, rewards and exactly-once receipts in the existing Firestore transaction. A DO must not separately award rewards or mirror progress as a second authority. A single coordinator may add latency/availability dependence; use it for publication control, not a long blocking transaction covering the entire class.

Before grading, compare a fresh Firestore head with the durable authoritative generation/digest and validate the selected immutable catalog; bind unfinished attempts to the trusted generation. No browser-provided catalog or version can override it. Immutable pack caching is permissible only with verified digests and fresh authority validation. Keep same-request receipt recovery and atomic rewards intact.

**Threat-model limit:** removing raw Admin access from content writers prevents their unsupported live edits. It does not detect every write by a compromised database-wide credential before grading. An attacker able to restore both authority storage and signing/runtime control is outside this boundary. Independently retained highest-generation checkpoints and a fail-closed restore procedure are required for disaster recovery. Source audits detect raw legacy mutations only when run; claiming continuous detection would be false. If hostile raw Admin writers must remain supported, the previous strict live-source validation estimate is 57,342 reads/day, above both targets. Do not remove validation to hide that cost.

## Actual local compatibility results

Pinned Wrangler 4.158.0, local workerd with `nodejs_compat`, existing Firebase dependencies and demo Auth/Firestore. See [machine-readable checks](priority-3-workers-restricted-probes-2026-11-07.json) and [emulator log](priority-3-workers-restricted-probes-2026-11-07.log).

| Test | Result | What it establishes |
|---|---|---|
| Full installed Admin/Firestore/Functions import graph with `preferRest` | **FAIL before handling requests:** `__dirname` in google-gax gRPC import | Existing complete backend cannot be assumed to run unchanged; no shims used to mask failure |
| Isolated Admin Auth/App Check and original marking helper | PASS | These modules/helper load; not full grading parity |
| Auth `verifyIdToken(token, true)` with demo token | PASS | Emulator verification path with revocation checking requested |
| Invalid token; disabled account on next request | PASS / PASS | Local rejection paths preserved |
| Signed RSA App Check fixture | PASS | Signature/claims path runs with injected test public key |
| Foreign audience and expired App Check fixtures | PASS | Both rejected |
| Two concurrent REST transactions | PASS | Counter ends at 2; one operation needed two attempts, the other one |
| Concurrent SQLite generation advance | PASS | One succeeds, one conflicts; stale generation rejected |
| Stop/restart workerd against same local storage | PASS | Generation 1 survives process restart |

There are eight isolated checks plus the separate persistence check. The App Check key-fetch override accepts a test public key from the caller and is **unsafe to deploy**. The REST path uses emulator-only administrative access and is not an authenticated production adapter. No real Google OAuth exchange, production JWT/JWKS retrieval, App Check attestation, callable browser protocol, full assessment transaction, reward flow or publication recovery was exercised in workerd. Local restart is not proof of hosted disaster recovery. Original Node prototype security/classroom results remain prior evidence, not new Workers integration results.

Cloudflare's [Node compatibility documentation](https://developers.cloudflare.com/workers/runtime-apis/nodejs/) lists partial support and HTTP/2 limitations. The import failure itself does not prove a unique root cause or that REST is impossible. A supported HTTP REST adapter or carefully validated bundling approach is still needed. It must cover Firestore value encoding, queries, transaction preconditions/retries, deadlines, errors and exact receipt semantics. Browser-facing callable envelopes, CORS, Auth and App Check enforcement also need explicit parity tests.

## Free-plan and classroom feasibility

Current [Workers limits](https://developers.cloudflare.com/workers/platform/limits/) list 100,000 requests/day, 10 ms CPU/request, 128 MB memory, 50 subrequests/request and six simultaneous outgoing connections. Network wait is excluded from CPU, but JWT verification, JSON/catalog parsing and grading consume CPU. Local success does not prove compliance with this limit. Do not solve an overrun by dropping revocation, App Check or catalog checks.

[Durable Objects pricing](https://developers.cloudflare.com/durable-objects/platform/pricing/) includes SQLite-backed objects on Free: 100,000 requests/day, 13,000 GB-s/day, five million SQL rows read/day, 100,000 rows written/day and 5 GB storage. Exhaustion can stop service. These are separate from Firestore document quotas and Worker limits. A publication coordinator for 30 learners appears small by request volume, but polling, hot-object serialization, recovery, retained audit history and abuse require measurement. No hosted SLA or dependable classroom availability has been established.

Cloudflare publicly advertises starting free without a credit card on its [website](https://www.cloudflare.com/). No account was created, so account-specific signup checks and actual Free activation remain unverified. Basic secret bindings and SQLite coordination have no identified mandatory paid feature in this design. Granular provider permissions, production credential provisioning, backup/recovery operations and sufficient CPU remain acceptance gates; do not assume they work on a particular account. Existing Netlify Free build/runtime isolation and signup uncertainties remain unresolved; moving only the signing authority does not protect a Netlify grading key from an untrusted backend deployer.

Previously measured synthetic workload, **not rerun through Workers in this round**:

| Workload | Firestore reads | Writes | Deletes | Headroom to 40,000 / 50,000 |
|---|---:|---:|---:|---:|
| 30 students, compact authority, routine school day | 31,992 | 2,220 | 0 | 8,008 / 18,008 |
| Same plus startup/publication | 34,570 | 2,370 | 0 | 5,430 / 15,430 |

No read savings are claimed here. New role lookups, DO coordination, publication approvals, OAuth behavior and retries require a fresh integrated measurement. The older history sensitivity adds 6,300 reads: 38,292 routine and 40,870 publication-day reads before other traffic. Thus the sub-40,000 guarantee does not cover arbitrary history size, background traffic or unlimited retries. Preserve budget and fail-closed behavior rather than weakening security.

## Effort and decision gates

Planning estimate for one engineer familiar with this code: 2–4 days for a bounded transport compatibility spike; 5–10 for draft/review/publication APIs, permissions and UI; 5–10 for durable coordination and recovery; 4–8 for integration, browser/security/load and operational tests. Approximately **16–32 engineering days**, with additional time if the SDK needs a substantial REST adapter. This is architectural/operational work even though educational logic and canonical student data need not change. A small class does not remove the need for a trusted operator, key rotation and restore procedures.

Prioritized gates, each requiring further approval before proceeding:

1. Prove all four assessment operations and receipt/reward recovery over a compatible local transport; stop if maintaining exact semantics is impractical.
2. Implement restricted drafts/reviews and trusted publication with the existing Node security suite plus DO interruption/concurrency/replay tests. Keep credential ownership and database-wide IAM risk explicit.
3. Run the complete browser/classroom workload against that integration, including histories, daily/chapter assessments, retries and a publication; measure Firestore, DO and Worker CPU separately.
4. Only after separate approval, verify account/no-card availability, runtime/build/preview isolation, Google credential flow, hosted CPU/latency/cold starts and recovery on synthetic hosted data. None is authorized now.

**Recommendation:** pursue only the next bounded local transport proof if approved. Hold deployment and Blaze. Cloudflare has useful primitives and encouraging isolated results, but neither a configuration-only migration nor a secure, reliable no-payment hosted system is proven. If preserving the complete backend requires excessive porting or fails Free CPU limits, leave the architecture on hold and reassess a supported Node host under a separately approved budget/credential model.
