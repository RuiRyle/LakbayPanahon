# Priority 3 — final production approval checklist

7 November 2026. **Planning only; no stage is approved by this checklist. Production remains NO-GO.** Option A is accepted locally. No infrastructure action, production configuration change, deployment or live test was executed for this request. Priority 4 remains excluded.

## Candidate verification

Locally rechecked the accepted manifest: SHA-256 **`126b79f89883777b7e20345ca31a0e8e2093ab36424b7be64e6fe8160ee0a07f`**. All source/artifact hashes match; 235 artifacts; activation false. Exactly four assessment callable exports and seven Hosting payloads are included. Hosting remains 577 proposed paths / 570 preserved production paths. No unrelated AI endpoint exports, teacher-rule changes, broad CSP additions or dependency upgrades are included.

Runtime identity is `assessment-runtime@lakbaypanahon-1797e.iam.gserviceaccount.com`. Important discrepancy to resolve before deployment: **the accepted package still sets maxInstances 10, does not explicitly set concurrency, and its inert policy proposes 10 starts/minute and 200/day.** These are not the discussed pilot proposal of max 2/concurrency 8 and 3 starts/minute/60 daily. Do not claim otherwise or silently override the accepted hash. A separately approved local configuration-only candidate/review is needed if those pilot settings are selected. No IAM grant is contained in this package; role JSON files are proposals.

The last production metadata read was 7 November at 14:18:10 Asia/Manila: Hosting `b984eba31379723a`, all 575 baseline paths/configuration and active rules matched; billing was unlinked. This request used local verification only, not another production read. Repeat read-only preflight immediately before any future change and stop on drift.

## Independent approval stages

Each checkbox requires its own explicit authorization and named operator. Approval of one stage does not approve subsequent stages.

### 0. Local decisions — no production change

- [ ] Select a **30-student enrolled pilot**, initially one class, not a 300-concurrent-student launch. Accept or decline the dependency disposition below.
- [ ] Approve local configuration-only preparation for explicit runtime limits and build-identity binding, then review the regenerated manifest and tests. Keep assessment/reward logic, rules and dependencies fixed. If the existing deployment process cannot bind the selected build identity, stop for a revised deployment plan instead of using a default Editor identity or switching deployment systems silently.
- [ ] Name release owner, billing administrator, incident operator, backup custodian and alert recipients; agree a short save-cutover window and student notice. No messages are sent by this plan.

### 1. Billing and cost monitoring — changes production billing

- [ ] In Firebase Console, select **`lakbaypanahon-1797e`**, open Usage and billing / upgrade, choose **Blaze**, and link the specifically approved Cloud Billing account with a valid payment method. The operator needs project billing-management and billing-account linking rights; project deployment rights alone are insufficient. Verify the project number `831214660993` and selected payer before confirming. [Firebase billing requirements](https://firebase.google.com/docs/functions/get-started).
- [ ] Create a project-scoped **US$20/month alerts-only pilot budget**, with actual thresholds 50/75/90/100% and forecast warning, sent to the approved recipients. Include existing product services when checking affordability. Alerts can lag and **do not cap spending**. Do not automatically unlink billing, delete resources or enable an unreviewed spend-cap/shutdown automation. [Budget behavior](https://docs.cloud.google.com/billing/docs/how-to/budgets).
- [ ] Approve monitoring setup: callable errors/429s/aborts, latency, instance usage, Firestore operations and App Check failures; inspect after each initial class and daily in week one. Proposed alert: p95 submit over 5 seconds for five minutes, or at least five unexpected save failures in five minutes. Do not log tokens or raw student answers.

**Cost assumptions:** 20 school days/student/month; 20 new mission quizzes plus five retries, four chapter challenges, ten daily challenges, twenty restores and 10% request headroom. Conservative pre-Option-A model: 426 requests, 36,000 reads, 1,100 writes and about 40 reCAPTCHA assessments/student/month. Retain it as planning headroom, not a measured post-correction bill.

| Students | Requests / reads / writes per month | Assessment-component planning envelope |
|---|---|---:|
| 30 | 12,780 / 1.08 million / 33,000 | **$2–7/month** |
| 100 | 42,600 / 3.6 million / 110,000 | **$4–10/month** |
| 300 | 127,800 / 10.8 million / 330,000 | **$16–27/month** |

Assumes 1 vCPU/256 MiB, 0.5–2 active seconds/request at saved Singapore SKU rates; eight five-minute build equivalents ($0.24–0.62 gross), roughly 2 GiB retained images and a $1–5 small-infrastructure reserve. Core free credits may reduce charges. Firestore free reads are daily, so school-day bursts can exceed them. reCAPTCHA's shared organizational allowance is not reserved for this project: the model's 12,000 checks at 300 students may enter the $8 tier; other traffic can cause that sooner. Existing AI/audio/Hosting/Auth-SMS use, backup/export/restore, large histories, abuse, taxes and currency conversion are excluded. These are **not caps or whole-project quotes**. [Cloud Run](https://cloud.google.com/run/pricing), [Firestore](https://cloud.google.com/firestore/pricing), [Build](https://cloud.google.com/build/pricing), [reCAPTCHA](https://cloud.google.com/security/products/recaptcha). Full arithmetic: `priority-3-final-pilot-cost-model-2026-11-07.json`.

**Stop:** wrong payer/project, no recipient/budget decision, unavailable billing authority, or spending assumptions unacceptable. Linking billing can expose other enabled services to usage charges even before assessment rollout.

### 2. APIs and identities — changes production infrastructure/IAM

- [ ] Enable only the missing required build/runtime APIs: **Cloud Run, Cloud Build, Artifact Registry**, plus IAM for dedicated-account provisioning as needed. Verify existing Functions, Firestore, Authentication, App Check, reCAPTCHA Enterprise, Storage, Logging and Monitoring. IAM Credentials is conditional on the approved impersonation/build workflow. Do not activate Compute workloads or Eventarc triggers merely because their APIs were previously disabled.
- [ ] Create dedicated **`assessment-runtime@lakbaypanahon-1797e.iam.gserviceaccount.com`**. Proposed custom role permissions: `datastore.databases.get`, `datastore.entities.get`, `datastore.entities.list`, `datastore.entities.create`, `datastore.entities.update`, `firebaseauth.users.get`. Validate actual SDK/IAM requirements before traffic. These permit database operations, not per-student IAM isolation; server authorization remains essential because Admin bypasses client rules. No delete, account-management, billing, Owner/Editor or Token Creator grant is proposed. Broader predefined `datastore.user`/`firebaseauth.viewer` alternatives require an explicit choice, not automatic substitution.
- [ ] Create separate **`assessment-build@lakbaypanahon-1797e.iam.gserviceaccount.com`**. Minimum proposed predefined build grants: Logging Writer; Artifact Registry Writer restricted to the selected build-image repository; Storage Object Viewer restricted to approved source/upload buckets. Bind this identity explicitly in the reviewed build workflow. Runtime gets none of these build grants. [Build identity permissions](https://docs.cloud.google.com/functions/docs/building).
- [ ] Give the deployer Functions deployment permissions (for example Cloud Functions Developer), `iam.serviceAccounts.actAs` on only the selected runtime/build accounts, and the required scoped Hosting/rules release permissions. IAM/billing/service-enablement permissions belong to the provisioning operator, not the runtime. Preserve required Google-managed service-agent roles; never give service-agent roles to ordinary users/runtime accounts. Do not download account keys.

**Stop:** a required role cannot be scoped/verified, identity fallback is required, organization policy blocks deployment, or extra privileges/services are requested. Present the exact additional grant for approval. Emulator success is not IAM proof.

### 3. Backup/recovery — production reads, storage and potentially billable export

- [ ] Capture active Hosting version/file map/configuration, active rules source/hash, function inventory/configuration, policy/App Check settings and IAM bindings in restricted local recovery evidence. Exclude secrets and avoid treating source snapshots as a database backup.
- [ ] Approve a managed Firestore export of the **existing database** into a private, approved same-region backup bucket with public access prevention, named custodians and proposed **30-day retention**. Export includes existing XP/progress/attempts/collectibles and other collections; no deletion or recalculation. Account for production read/export/storage charges and student-data access. Managed export needs billing. [Export/recovery requirements](https://firebase.google.com/docs/firestore/manage-data/export-import).
- [ ] Authorize the exporter separately (for example Datastore Import Export Admin) and scope the Firestore service agent's required bucket access to that backup bucket. Do not give export/import or backup-bucket privileges to assessment runtime. Confirm exact service identity/permissions before execution.
- [ ] Verify export completion, metadata and readable recovery objects; document that a live export is not a guaranteed single cross-document instant. Perform a separately approved restore rehearsal into an isolated destination with production outbound integrations disabled; no import into live production. Size/cost cannot be finalized until current data size is known. Do not claim recoverability from a started export alone.

Firestore export does not back up Firebase Auth identities, IAM or Hosting. Preserve configuration snapshots separately. If account-identity export is required for the chosen recovery objective, obtain separate sensitive-data export/storage approval; do not extract credential hashes or bulk learner identities as an incidental audit step. No Auth reset or account recreation is part of this release.

**Stop:** incomplete backup, no successful recovery verification, inappropriate student-data access or unidentified cost. PITR was previously off; enabling PITR/scheduled backups is an additional billable approval, not an assumed prerequisite already satisfied. Recovery must preserve post-cutover work: no blanket snapshot restore over newer student data, automatic reward revocation or mass cleanup.

### 4. App Check repair — separate production configuration approval

- [ ] Owner confirms selection of existing restricted SCORE key **`6LeByQIuAAAAAJxlrg4_Me5ymg5s-tFgOwVF7SeZ`**, hash `4dd79a7261ebeccc1a451e448dbac7f3ba1e246733d573b1cd759ec92bb41d3a`, created 27 October at 04:09:37Z. Being newer alone does not prove ownership/use. Preserve the other key.
- [ ] Freshly read/snapshot the key and both configurations. Change **only** Enterprise App Check `siteKey` for app `1:831214660993:web:aeff983c8b3182358e4c80` (`updateMask=siteKey`), then **only** `learningSettings/bayaniAI.appCheckSiteKey` using a fresh document-update-time precondition. Keep TTL 3600 seconds, minimum score 0.5, all other Bayani fields, exact two production domains and enforcement settings intact. No JavaScript deployment is needed for this setting repair.
- [ ] Read back equality: selected key = App Check registration key = shared setting = Enterprise provider input after reload. Stop on drift/partial failure; these two services cannot be changed atomically. No debug-token, provider downgrade or wildcard-domain workaround.
- [ ] Separately approve bounded real attestation on both production origins using isolated identities and representative school browsers/network. Do not log tokens, call paid AI as a probe or create assessment attempts. Leave global Auth/Firestore enforcement unchanged. A later protected callable probe must return the expected disabled-protocol response before saving is enabled.

This setting repair need not wait for Blaze just to select an existing key, but it **still changes production** and verification consumes provider quota. Exact resources, before-state and field masks: `priority-3-appcheck-repair-procedure-2026-11-07.md` and its inert proposal JSON. **Stop:** wrong key ownership/project/domain, inconsistent readback or legitimate-user attestation failure. Do not enable secured traffic to test around a broken provider.

### 5. Dependency disposition — explicit owner risk decision, not an assumed acceptance

- [ ] Accept or decline a narrow exception for **this reviewed package/lockfile only**, expiring **7 December 2026** at the latest. Owner/custodian, review date, mitigation and exit trigger must be recorded. No risk is accepted by this checklist.
- [ ] Record the six production entries: gaxios 7.1.3, gcp-metadata 8.1.4, google-gax 5.0.8, rimraf 5.0.10, glob 10.5.0 and minimatch 9.0.9. They trace to two filesystem-pattern advisories. No reachable assessment-endpoint path was identified; code is nevertheless installed, and availability impact is possible if a path is missed or introduced.
- [ ] Retain strict schemas/no filesystem-pattern inputs, monitoring and protected pause capability. Reassess within 30 days or sooner on new upstream fixes, severity, dependency graph or reachability changes. No in-range complete remedy was found; do not force incompatible upgrades or suppress findings. If declined, approve a separate compatibility-remediation plan before deployment. Full justification: `priority-3-dependency-risk-assessment-2026-11-07.md`.

**Stop:** no signed disposition, expired exception, increased exposure or altered package hash. Public educational answer keys also remain readable; trusted reward authorization does not establish unaided exam performance.

### 6. Pilot settings and disabled endpoint deployment — production deployment approval

- [ ] Review the configuration-reconciled candidate from stage 0 before publication. Proposed 30-student limits: TTL **7200 s**, new starts **3/minute/60 per day per UID**, min instances **0**, max **2 per callable**, concurrency **8**. Same-ID recovery must remain available at the issuance quota. All-endpoint UID throttling is **not implemented**: either separately approve/test it locally or explicitly accept that operational gap; a school IP must not be the hard classroom limit. The accepted manifest currently has different runtime/issuance settings, so it is not yet this limited configuration candidate.
- [ ] Deploy only four reviewed Node 22 `asia-southeast1` endpoints under selected identities: `startStudentAssessment`, `advanceStudentAssessment`, `resumeStudentAssessment`, `submitStudentActivity`. Keep `learningSettings/securedAssessment` **absent or explicitly enabled:false**; any disabled-policy creation is a separately authorized configuration write. No legacy raw-score/question-list authority or unreviewed standalone backend may remain.
- [ ] Verify actual build/runtime identity, runtime limits, CSP origin and function inventory/readback. Confirm no emulator/debug settings. Callable platform invocation may need public network invocation for Firebase web clients; explicitly review that binding. It does not replace mandatory Firebase Auth, active-student authorization and App Check inside callables. No public Firestore/private-record access is authorized.

**Stop:** wrong deployed hashes/identity/options, an alternate reward writer exists, or valid attestation/authentication cannot reach a disabled-protocol response. Do not weaken verification. The local 30/30 tests are not hosted capacity proof; same-account contention still has multi-second waits.

### 7. Protected rules and Hosting cutover — separate publication approval

- [ ] Approve the assessment-save pause/refresh notice. Snapshot and compare the **fresh active** rules/version before changing anything. Publish only reviewed restrictive rules first: canonical client reward writes blocked, private assessment records inaccessible, unrelated teacher/profile/draft/practice/read permissions preserved. Stop on baseline drift instead of deploying unrelated root working-tree rules.
- [ ] Release the exact reviewed Hosting file-map overlay and narrow Singapore callable `connect-src` addition. Verify preserved Firebase/AI imports, seven payload hashes, 577 paths/570 preserved paths and revalidation headers. Do not deploy the text-only `hosting/public` test directory as the complete website.
- [ ] Read back rules, endpoint inventory, Hosting configuration/file hashes and disabled protocol. Old clients must fail closed on direct reward saves; no client fallback. Earned progress remains readable; unfinished old quizzes may restart after refresh. Do not promise old running JavaScript already contains the new notice.

**Stop:** any permission/import/hash mismatch or premature enablement. Hosting, Functions and rules are not atomic: keep a coordinated save pause throughout this transition, rather than allow an insecure compatibility interval.

### 8. Hosted acceptance, then student rollout — two distinct activation decisions

- [ ] Approve named disposable test identities, exact test-owned records and cleanup scope, small provider/Functions costs and a bounded test window. Test normal/incorrect/retry/replay, 5-question quotas and adaptive weak-topic follow-ups, prerequisites, chapter game types/badges, artifacts, daily date/streaks, 100/80 best-score order, mixed rewards, duplicate saves, lost responses/refresh and stale revisions. Verify exact final XP/counts/timestamps and direct-write/private-record denials. Explicitly identify any seeded prerequisites; do not call them exercised learning paths. No existing real student records may be reset or used as writable fixtures.
- [ ] The protocol currently has **no UID canary allowlist**. To test saves, enablement is global. Choose either an explicitly approved coordinated closed save-test window excluding students, or separately approve a locally tested canary gate before hosted writes. Do not describe enabled:false as capable of testing reward saves or claim a private test activation exists.
- [ ] Exercise sequential/5/10/30 hosted saves, cold and warm entry, two browsers/devices, school-network attestation, interrupted saves, indexes and observed runtime queuing. Proposed acceptance: all eligible independent saves eventually commit once, zero duplicated/missing rewards or unauthorized writes, recoverable failures without progress loss, warm save p95 under 5 seconds. Distinguish same-user retry latency, cold starts and expected security denials. Stop for data-integrity failure, legitimate attestation blocking, missing index or repeated unresolved 429/abort/save failure.
- [ ] Pause again after acceptance; review evidence and cleanup only approved disposable data/identities. Obtain **separate student-rollout approval** before reopening to the 30-student class. Monitor each initial class; no expansion to 100/300 without review.

### 9. Incident response — explicit standing authority or later approval

- [ ] Approve a narrow emergency action scope in advance: set protocol disabled, gate/replace unhealthy Admin endpoints with the reviewed deny-only package, and if needed publish the compatible holding reward facade. Keep restrictive rules and lessons/review access. Verify the endpoint is paused; rules alone do not constrain Admin writes.
- [ ] Preserve all committed receipts/progress. Recover uncertain outcomes by the same attempt ID. Never restore permissive reward rules, raw reward endpoints or an old client-authorized assessment version. Do not delete learner records, revoke rewards, import a backup over later work or unlink billing as an unreviewed rollback.

**Stop/request further approval:** any incident requires data repair, broader permissions, new infrastructure, an unreviewed rollback build or acceptance of a security regression.

## Approval response format

Approve by stage number and scope, e.g. **“Approve stage 0 local configuration preparation only”** or **“Approve stage 4 key repair and bounded attestation only.”** Name budget/recipient/identity/retention decisions where relevant. No response is treated as blanket authorization for stages 1–9. This document performs none of them.
