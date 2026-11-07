# Stage 0 deployment-workflow comparison and recommendation

7 November 2026. **Investigation and plan only; awaiting approval to implement locally.** No accepted source/artifact, manifest, dependency, policy, infrastructure or production setting was modified. No deployment, production metadata request, attestation or student-data access occurred in this investigation. Google Cloud CLI was not found on PATH; it was not installed. Priority 4 remains excluded.

## Recommendation

Use the documented **Google Cloud CLI `gcloud functions deploy --gen2` path for the four assessment Functions only**, retaining the exact Firebase Functions SDK `onCall` exports and accepted Option A handlers. Keep the existing reviewed Hosting file-map process and Firestore rules publication process separate. Do not replace the backend with a generic HTTP server or change grading/rewards.

This is a supported deployment-configuration capability, not yet an implemented or hosted-verified integration. Approval is needed before creating the revised local configuration/artifacts or tooling. Production publication still requires later independent approval.

## Comparison

| Requirement | Installed Firebase CLI 15.33.0 | Documented Google Cloud CLI Functions Gen 2 |
|---|---|---|
| Explicit runtime identity | Supported through SDK/endpoint service account. | Supported through runtime account deployment flag. |
| Explicit dedicated build identity | Not exposed/emitted by this installed Functions deployment path; offline probe omits it. | Supported by the build-account flag using a full service-account resource. |
| Instance/concurrency settings | Mapped from SDK options. | Explicit deployment flags; mirror the reviewed SDK metadata to prevent drift. |
| Firebase callable protocol | SDK wrapper plus Firebase-specific deployment metadata/automation. | Keep the same SDK wrapper; explicitly preserve metadata, environment and invocation policy. |
| Authentication/App Check | SDK verifies tokens; application adds revocation/account/ownership checks. | Same code and checks; not replaced by platform IAM or labels. |
| Packaging/environment | Firebase tooling handles source, ignore conventions and Firebase environment. | Explicit source allowlist, environment and ignore rules required. |
| Hosting/rules | Existing reviewed processes remain available. | Do not move them to gcloud as part of this change. |
| Readiness | Existing route fails custom-build-account requirement. | Suitable recommended route subject to local packaging/security tests and later hosted acceptance. |

Google documents both identity flags and the scale controls for this command. Omitting either identity can select a project default, so the future wrapper must reject an absent/incorrect value rather than rely on defaults. [Deployment flag reference](https://docs.cloud.google.com/sdk/gcloud/reference/functions/deploy).

## Why callable security can be preserved

Local inspection of SDK 7.4.0 confirms `onCall` creates the executable HTTP wrapper: it validates requests, handles CORS/callable encoding/errors and checks Auth/App Check before entering the application. `enforceAppCheck:true` is evaluated in that runtime wrapper; it is not merely a Firebase CLI deployment flag. The application additionally verifies revocation with `verifyIdToken(..., true)`, active student status and trusted attempt evidence. None of these functions need to change.

The documented callable protocol remains the acceptance contract; do not substitute `onRequest`, export the raw assessment handler, use a public mock/debug provider or skip token verification. Keep the `httpsCallable` client and four names/region unchanged. [Callable protocol](https://firebase.google.com/docs/functions/callable-reference), [App Check enforcement](https://firebase.google.com/docs/app-check/cloud-functions).

Preserve or explicitly reproduce these Firebase deployment details:

- `deployment-callable=true` label for each function. The installed Firebase converter emits it, and its reverse conversion recognizes it. The label is classification metadata, **not authentication**.
- The same `cloudfunctions.net` regional endpoint names and HTTPS/HTTP request signature, pointing to the original `onCall` exports. The underlying Cloud Run URI must enforce the same handler checks; it is not a bypass route.
- Runtime project resolution and nonsecret Firebase configuration for `initializeApp()`. A reviewed environment file should contain the actual project's `FIREBASE_CONFIG` and region values as needed; no credential JSON, alternate project or fabricated optional service configuration. Use runtime ADC from the bound account, not downloaded keys. Validate actual managed project environment after deployment. [Firebase environment reference](https://firebase.google.com/docs/functions/config-env).
- Strict absence of `FUNCTIONS_EMULATOR`, emulator hosts, App Check debug variables and local-preview switches in production. In particular, setting `FUNCTIONS_EMULATOR=true` would disable the current App Check path and must fail preflight.
- Isolated source folder with exactly four exports and the existing lockfile; exclude migration/audit scripts, node_modules, secrets, emulation files and test data. gcloud does not treat `.firebaseignore` as equivalent to its own source packaging rules: prepare an explicit `.gcloudignore`/ignore-file and inspect the exact upload inventory.
- Separate control-plane ownership: once this route is selected, do not later run a broad Firebase Functions deploy against these resources without reviewing account/settings preservation and deletion prompts. Do not forge a `deployment-tool` label implying another tool manages the release. Record chosen ownership explicitly.

## Proposed configuration, not applied

For **each** of `startStudentAssessment`, `advanceStudentAssessment`, `resumeStudentAssessment`, `submitStudentActivity`:

| Field | Required value |
|---|---|
| Project / region | `lakbaypanahon-1797e` / `asia-southeast1` |
| Runtime / entry point | Node.js 22 / identical named `onCall` export |
| Build identity | `projects/lakbaypanahon-1797e/serviceAccounts/assessment-build@lakbaypanahon-1797e.iam.gserviceaccount.com` |
| Runtime identity | `assessment-runtime@lakbaypanahon-1797e.iam.gserviceaccount.com` |
| Scale | Maximum 2, concurrency 8, minimum 0 |
| CPU / memory / timeout | Explicitly retain 1 vCPU / 256 MiB / 60 seconds; no speculative capacity increase. |
| SDK security | Production App Check enforced; existing Auth/revocation/authorization checks unchanged. |
| Protocol policy proposal | `enabled:false`, version 1, TTL 7200, starts 3/minute and 60/day per student. |

The start limits belong to the server's Firestore policy, **not** gcloud flags. Preparing disabled JSON does not publish it. No policy creation/enabling is authorized; absent policy also fails closed. Same-request-ID recovery retains existing behavior before new-start quota checks. All-endpoint UID throttling remains unimplemented and requires an explicit operational disposition.

The accepted package still contains its earlier maxInstances/policy settings. A later approved configuration-only implementation must reconcile SDK options, planned deployment arguments, disabled policy and deny-only rollback consistently and regenerate a reviewed manifest. No new assessment logic or dependency upgrade is necessary for this plan.

## Future local implementation and verification, if approved

1. Preserve the accepted candidate and create a separate configuration-only candidate, rather than overwrite its only copy. Pin a supported Google Cloud CLI version after reviewing its help/flag support. Tool installation is a local action requiring approval, not a billing upgrade; none occurred here.
2. Prepare a fail-closed deployment-plan generator/wrapper that outputs four exact operations and verifies project, names, source inventory, both identities, limits, App Check wrapper metadata and disabled protocol. Its default mode must be local validation only; production execution requires a separately approved explicit mode. Validate argv structurally, not shell-concatenated user text. No unsupported Firebase properties or vendor CLI patches.
3. Bind both identities at **initial create**, and on every update/rollback. Do not create with defaults then patch after a build: that would already have used the wrong account.
4. Deploy initially with platform invocation closed unless the operator has separately approved the necessary endpoint invocation binding. Firebase web clients use Firebase ID tokens, not Cloud Run IAM tokens: they require platform reachability. A future approved public `roles/run.invoker` binding must be limited to these underlying services and tested; it does not grant Firestore access. The unchanged wrapper must still deny missing/invalid Auth and App Check. If organization policy forbids this binding, stop for review—do not remove app-layer checks or silently add a proxy.
5. Preserve callable label, runtime environment and explicit packaging. Validate a clean Node 22 install against the unchanged lockfile and verify only intended source is staged. No generic web-service entry point or new Express dependency.
6. Test wrapper/protocol behavior locally: OPTIONS/CORS, JSON envelope, error encoding, unauthenticated requests, missing/invalid App Check, disabled protocol, and real Auth/Functions/Firestore emulator flows. Emulator bypass does not prove production attestation. Test command/plan generation with missing/swapped identities and every altered limit; all must fail before deployment. Check source `.onCall` options and CLI args agree.
7. Run existing relevant unit, security, browser, quota/recovery and artifact checks. Preserve Option A source hash and all reward/catalog rules. Regenerate a new manifest only after the new local configuration passes and list every hash difference for review.

No gcloud command was executed in this investigation. The command family is a proposal, not a completed local deploy simulation. Emulators cannot verify production IAM, build-account use, Cloud Run queuing or real provider attestation.

## Permissions/tooling and deployment risks

- **No SDK dependency upgrade:** the present Node 22 package and Firebase SDKs remain. Google Cloud CLI is additional operator tooling, currently unavailable on PATH; its install/version/provenance and actual generated behavior remain to be verified locally.
- Deployment principal needs function create/update/get/operation permissions, API-use permissions, and `iam.serviceAccounts.actAs` on **both** chosen accounts. Invocation IAM changes need the relevant Cloud Run policy permissions, explicitly approved for those services; no broad project Owner/Editor shortcut. Existing Hosting/rules publication permissions remain separate.
- Build identity needs scoped source-bucket access, build-log write and Artifact Registry image write/read as required by the selected repository/build workflow. Runtime needs the reviewed Firestore/Auth operation permissions; no build, billing, account-administration or secret-key grants. Preserve necessary Google-managed service agents. Exact resource-scoped bindings must be reviewed when source bucket/repository names are known. [Custom build identity and grants](https://docs.cloud.google.com/functions/docs/building).
- Omitted flags can retain/reset defaults differently on create/update. Require complete deployment intent, compare current configuration before update, and read back actual `buildConfig.serviceAccount`, runtime account and scale settings afterward. A display label or manifest string alone does not prove which identity built an image.
- Switching tools does not resolve billing/API/IAM availability, App Check mismatch, advisory disposition, backup or live-test approval. Builds/container storage still incur the same underlying charges after separately approved activation.
- Do not assume Firebase runtime options deploy themselves through gcloud; the platform settings must be explicit. Similarly, do not assume the callable label deploys authentication: enforce it in the unchanged SDK wrapper and application.

## Future production sequence and rollback changes

After separate infrastructure and publication approvals: fresh baseline/backup; required APIs/IAM; reviewed App Check repair/attestation; four disabled-protocol endpoint deployments with explicit accounts; actual resource/build readback; scoped invocation enablement/disabled-protocol probes; protected rules and exact compatible Hosting overlay during save pause; separately approved hosted acceptance and then student rollout. No bulk account/progress migration is introduced.

Change rollback **delivery**, not rollback security: keep protocol disabled, restrictive rules and saved receipts; use the same explicit-account gcloud Functions route to deploy the reviewed deny-only exports to all four resources, with identical pilot limits, source restrictions and invocation/environment handling. Do not use an unrestricted Firebase deploy as an emergency fallback because it cannot ensure this build binding. Review/update rollback configuration alongside the candidate in the future local implementation. No rollback files were edited now.

There is no prior secured production service to restore on first activation. A rollback may require a build and take time; retain protocol-disable access and the existing protected holding frontend. Configuration/receipt recovery must not import a snapshot over newer learner work or revive client-authorized rewards. Admin writes bypass rules, so gate a faulty endpoint explicitly.

## Decision and preserved candidate

**Recommended next approval:** local-only implementation of this gcloud Functions Gen 2 deployment configuration, packaging/plan validator and matching protected rollback, followed by local tests and a separately reviewed manifest. This does not authorize infrastructure activation, actual deployment, production configuration writes or live acceptance.

If actual tool validation cannot bind both accounts, preserve `onCall` enforcement, or retain correct resource/environment behavior, stop and report the blocker before considering another platform or broader architecture. The alternative should not be described as production-verified until its separate hosted gate passes.

Accepted manifest remains SHA-256 **`126b79f89883777b7e20345ca31a0e8e2093ab36424b7be64e6fe8160ee0a07f`**. All 15 source hashes and 235 artifact hashes match; activation remains false. No accepted source, artifact or manifest changed, and no new manifest was generated. Evidence: `priority-3-stage-0-workflow-investigation-2026-11-07.json` (offline callable metadata conversion/source checks). No new emulator/browser pass is claimed for an unimplemented workflow.
