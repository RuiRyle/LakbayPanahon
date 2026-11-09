# Preferred backend route and next decision

7 November 2026, Asia/Manila. **Engineering preference: Google-managed assessment Functions with bound runtime identity. Local preparation only. Production remains NO-GO and billing stays on hold.** The user's request to choose the better approach authorizes this technical recommendation/preparation, not payment activation, IAM changes or deployment.

## Why this route

The application already uses Firebase Auth, Firestore and Firebase callable SDK handlers. Google-managed runtime credentials avoid adding a downloaded long-lived Firebase service-account key to a separate host. Firebase explicitly recommends Application Default Credentials in managed Google environments: [Admin setup](https://firebase.google.com/docs/admin/setup). This is an engineering judgment about compatibility and secret-management complexity, not a guarantee of zero cost or availability.

The external Node adapter is locally viable and packaged, but it adds host-specific credential/build isolation and transport/gateway acceptance work. Workers failed its bounded transport proof. Retain those experiments and results; do not deploy them or continue extending free-host workarounds by default.

## Reuse the existing prepared candidate

`build/priority3-stage0-release` already provides four original callable exports, Node 22, asia-southeast1, maximum 2 instances per function, minimum 0, concurrency 8, 1 CPU/256 MiB/60 seconds and proposed separate build/runtime identities. Protocol proposal stays disabled. The existing gcloud plan binds both identities explicitly; this is why the deployment plan is not a broad Firebase CLI Functions deployment. [Supported identity/configuration flags](https://docs.cloud.google.com/sdk/gcloud/reference/functions/deploy).

No new grading/reward implementation, migration or candidate rewrite is necessary for this preference. No existing account, progress, XP, artifact, badge or questionnaire data is reset. Admin remains application-level user/teacher verification and platform oversight, not cloud administration or content management.

Local revalidation: candidate validator passed and all **24 Node 22 workflow tests** passed. Initial sandbox run could not execute the subprocess refusal check; the direct-child rerun exited zero for the entire suite. [Results](validation/managed-backend-local-review-2026-11-07.json). Stage 0 integrity remains zero drift: 242 artifacts, 23 sources and 12 copied service files, manifest `0b902b44931e19bde9e26db746c6518def3991367f85717f01014f28c3beb2ef`. This verifies local plans, not provisioned IAM or a hosted build identity.

## Billing is an explicit remaining choice

Deploying Firebase Functions requires Blaze; local emulation does not. [Firebase deployment requirements](https://firebase.google.com/docs/functions/get-started). No claim is made that free allowances will cover this application, nor that this is cheaper than every external host. Actual shared Firestore/media/AI/build costs must be considered before approval.

Current Google documentation distinguishes alerts-only budgets from service-specific spend caps. Alerts alone do not stop spending. Spend-cap budgets now support selected services including Cloud Run and Cloud Run functions, but are scoped to one eligible service/project, enforcement is not instantaneous and overages remain billable. They do not establish a total project cap covering Firestore, storage, builds, networking and AI. Availability and exact service/SKU behavior for this deployment must be verified before relying on them. [Alerts](https://docs.cloud.google.com/billing/docs/how-to/budgets), [spend caps and limitations](https://docs.cloud.google.com/billing/docs/how-to/budgets-spend-caps).

Do not implement an automatic billing-disable mechanism that could disrupt unrelated services or destroy resources. Instance limits/start quotas reduce exposure; they are not a guaranteed monetary cap.

## Concrete remaining sequence

1. Obtain the owner's billing constraint and acceptable cost exposure. If no billing is a firm requirement, this managed route cannot be deployed now; keep local testing and mark hosted readiness blocked rather than claiming a free equivalent is proven.
2. If billing-backed preparation is acceptable, review the exact account/budget/alert recipients and service-cap applicability before any activation. No account identifiers, amounts or recipients are guessed here.
3. Separately authorize billing/service/IAM changes. Verify least privilege, dedicated build/runtime identity, dependency-risk disposition, App Check repair/real attestation and recoverable learner backup. Existing role JSON is a proposal, not automatic permission acceptance.
4. Recheck exact source/configuration/live drift, then obtain release approval. Keep protocol disabled and invocation private until separately reviewed callable invocation/security arrangements and isolated hosted acceptance are ready.
5. Verify real Auth emails, hosted save/recovery/load behavior and staged cutover before enabling the pilot. Preserve deny-only rollback; never reopen browser reward authority to recover availability.

No local validator can settle the owner’s financial decision. This document is the concrete proposal to review; it contains no executable production action. The earlier infrastructure checklist and dated blockers remain evidence and must be reconciled against actual current configuration before authorized changes.
