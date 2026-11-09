# External Node credential and permission review

9 November 2026. **Concrete design for review; not provisioned or deployment-approved.** No real credentials, IAM changes, production inspection, account creation, deployment or billing activation occurred. The existing local entrypoint continues to reject non-demo projects.

## Source findings

The copied `service/index.js` uses default Admin SDK initialization and four Firebase callable exports. `service/assessment-callables.js` independently calls `verifyIdToken(token, true)`, preserving disabled-account/revoked-session rejection. The callable wrapper enforces App Check outside the emulator. Current options do not enable `consumeAppCheckToken`.

Installed Admin SDK App Check verification uses the public JWKS endpoint and validates the token's signature and project claims. The Functions wrapper passes `{consume:true}` only when explicitly configured. Normal App Check verification must stay enabled; do not add the separate token-consumption role merely because App Check is present. Firebase documents that role under the optional replay-protection feature. [App Check verification](https://firebase.google.com/docs/app-check/custom-resource-backend).

## Proposed runtime permissions

These are a source-derived custom-role proposal, not a tested IAM binding or assertion that no additional SDK permission can ever be needed.

| Operation | Proposed permission |
|---|---|
| Begin and roll back assessment transactions | `datastore.databases.get` |
| Read individual documents | `datastore.entities.get` |
| Run assessment queries | `datastore.entities.get`, `datastore.entities.list` |
| Create attempts, receipts and results | `datastore.entities.create` |
| Update attempts, progress and rewards | `datastore.entities.update` |
| Read Auth user state for revocation/disabled-account checks | `firebaseauth.users.get` |

Firestore's documented API permission mapping supports the transaction/read/write entries. This proposal excludes document deletion, index/database administration and backup operations. [Firestore IAM](https://firebase.google.com/docs/firestore/security/iam). Auth user lookup requires `firebaseauth.users.get`; user creation, update, deletion and password-hash access are excluded. [Identity Platform API permissions](https://docs.cloud.google.com/identity-platform/docs/access-control).

Do not substitute Owner, Editor, Firebase Admin or an authentication administrator role. The configured Functions `serviceAccount` option is deployment metadata; it does not grant an external process that identity. No private key is needed to inspect or locally test this proposal.

**Important boundary:** Admin Firestore uses IAM rather than client Security Rules. These permissions are not a collection-level sandbox. A compromised runtime identity with database write access could affect learning records beyond the intended callable operations. Trusted backend code, limited deployment access and credential protection remain essential. Database/resource IAM conditions must be independently validated before claiming narrower scope.

## Candidate credential delivery

Firebase supports service-account key initialization outside Google-managed environments. This establishes a technical option, not automatic approval to export a key. [Admin setup](https://firebase.google.com/docs/admin/setup).

The proposed external-host trust model is:

1. Build a reviewed, backend-only image locally **without credentials** from locked dependencies and allowlisted sources. Verify image contents and accepted core hashes. Do not include this repository wholesale.
2. Run the prebuilt image on the host; disable repository builds, automatic branch deployments and previews for that backend. A backend deployer remains a trusted actor who can read runtime credentials through deployed code.
3. Supply a dedicated service-account JSON as a service-specific runtime secret file. On Render Docker services the documented path is `/etc/secrets/<filename>`; set `GOOGLE_APPLICATION_CREDENTIALS` to that path, not to inline JSON. Never put its contents in image layers, build arguments, browser configuration, source maps, archives or logs. Do not link it through a shared environment group. [Secret files](https://render.com/docs/configure-environment-variables), [prebuilt web services](https://render.com/docs/web-services).
4. Keep an explicit expected project identity and reject emulator/debug settings in any future hosted entrypoint. Retain real Auth revocation and App Check verification. Validate origins, callable errors, deadlines and admission bounds without modifying accepted grading logic.
5. Before use, define a credential custodian, expiry/rotation schedule and revocation procedure. On suspected exposure, stop serving assessment mutations, revoke the key and replace it only after investigating. No credentials should be sent through chat. [Google key-management guidance](https://docs.cloud.google.com/iam/docs/best-practices-for-managing-service-account-keys).

This design avoids handing a key to source builds, but actual host isolation and old deployment/preview behavior have not been tested. It does not promise that arbitrary backend deployers cannot extract secrets.

## No-billing assessment

Firestore documents a no-cost database allowance: 50,000 reads and 20,000 writes daily, one free database, with billing required for additional quota and certain features. These are shared project allowances, not extra allowances for an external server. [Firestore quotas](https://firebase.google.com/docs/firestore/quotas).

Documentation does not prove this specific project's API configuration, credential permissions, remaining quotas or account eligibility. No production calls were made to settle those questions. External Node hosting does not require deploying Firebase Functions, but it also does not make every Firebase feature free. Do not enable APIs or billing merely because an error message suggests it.

Render remains conditional because its Free service can sleep or suspend and its outbound-database traffic threshold is unspecified. This review has not resolved that availability risk. See [host assessment](no-billing-node-host-review-2026-11-09.md).

## What is settled and what is not

Settled locally: a Node HTTP transport exists; unsigned operations fail closed; the accepted service requires revocation checks and App Check; a narrow permission proposal and concrete secret-delivery design are now documented.

Not settled: actual custom-role support/binding, API eligibility without billing, runtime secret isolation, real App Check attestation, cold-start behavior, full signed classroom workload and quota headroom. Emulators cannot validate cloud IAM or a provider's suspension policy.

**Recommendation:** retain the locally accepted presentation version. This is a conditional isolated-hosted-test proposal, not a production go-ahead. The next external step would require explicit approval for a dedicated test identity, its narrowly scoped IAM binding and credential delivery, plus a separate hosted-test approval. Those operations are outside the current local-only restrictions. No source rewrite or further UI redesign is needed to make that decision.
