# Priority 3 — Stage 1 billing-readiness checklist

**Status update, 7 November 2026: Stage 1 billing activation is ON HOLD at the user's request because no payment method is available. This checklist is retained as a future proposal, not activation authority. The no-payment hosting investigation is separate research only.**

7 November 2026. **Proposal only. Blaze is preferred, not activated. Production remains NO-GO.** No billing, payment, API, resource, IAM, App Check, deployment or live-data action was performed. Priority 4 is excluded. The accepted Stage 0 candidate is unchanged.

## A. Decisions before later activation

- [ ] Name the billing owner, incident operator, backup operator and two alert recipients. Identify the exact payer/billing-account ID, currency and approved payment method privately; do not put payment details in repository files.
- [ ] Approve Stage 1 explicitly as **billing linkage plus the specified alerts-only budget only**. It must not authorize APIs/IAM, deployments, App Check changes, live tests or student rollout.
- [ ] Accept that $20 is an alert budget, not a spending limit. Keep the earlier **$2–7/month incremental assessment planning estimate**, excluding existing AI/media usage, recovery work, taxes and other shared usage. Near-zero usage is plausible, not guaranteed. Review existing service exposure before linkage: upgrading can permit charges from existing traffic without a new deployment.
- [ ] Approve or revise the warning/pause policy below. Name who may make emergency production configuration or invocation changes; no such standing authority exists merely because this checklist is written.

## B. Exact activation steps — only after separate approval

1. [ ] Confirm operator already has appropriate project billing-link and billing-account permissions. Stop if additional IAM is needed; do not grant it incidentally.
2. [ ] Open Firebase Console; select **LakbayPanahon / `lakbaypanahon-1797e`**, project number **`831214660993`**. Open **Usage and billing / Details & settings / Modify plan** (or the current Upgrade control), select **Blaze**.
3. [ ] Select the explicitly approved Cloud Billing account. Verify payer, account ID, currency and payment status before confirming. If an account/payment setup is missing or the console requests extra infrastructure changes, stop for approval rather than creating/linking alternatives.
4. [ ] Confirm only the reviewed billing-plan/account linkage. Do not select optional services, deploy, enable APIs or enable assessment protocol.
5. [ ] Immediately create the approved alerts-only budget described below in Cloud Billing, then read back its scope, amount, thresholds and recipients. Stop further work if the budget or recipients cannot be verified.
6. [ ] Read back Blaze/billing linkage; record the operator/time and initial cost/usage baseline without learner records or payment details. Keep assessment protocol disabled and report completion of **Stage 1 only**.

Blaze links a Cloud Billing account and enables pay-as-you-go exposure; it is not a fixed-price subscription. [Official Firebase billing plans](https://firebase.google.com/docs/projects/billing/firebase-pricing-plans).

## C. Proposed $20 monthly alerts-only budget

- [ ] Scope: **this project, all services**, calendar month, fixed **US$20** or explicitly approved billing-currency equivalent. Do not filter only Functions: Firestore, Storage, Hosting and builds also matter. External AI-provider invoices are not covered.
- [ ] Include ordinary free-tier savings in the spend view but exclude temporary promotional credits from warning calculations, so expiring credits do not hide the ongoing run rate. Record the chosen credit filters.
- [ ] Configure actual-spend warnings below, plus forecast warnings at **$10 and $20/month**. Forecasting/reporting can lag, especially early in a pilot; do not rely on email alone.

| Actual spend | Percentage | Proposed operator response |
|---|---:|---|
| $1 | 5% | Check first nonzero charges and service/SKU attribution |
| $3 | 15% | Review run rate, retries, reads, media and shared traffic |
| $5 | 25% | Investigate above-near-zero usage before adding sessions |
| $10 | 50% | Hold new pilot classes while reviewing unexpected/assessment-related spending; apply approved pause procedure if needed |
| $15 / $18 / $20 | 75% / 90% / 100% | Urgent owner escalation; no expansion or automatic budget increase |

- [ ] Send notifications to the approved billing owner and incident operator using supported email channels; verify recipient configuration. No Pub/Sub, BigQuery export or custom shutdown automation is proposed for Stage 1.

**Alerts do not stop services, and reported costs can arrive late.** Preapproved exports/tests and unrelated existing usage must be distinguished from assessment abuse. Budget creation itself does not purchase a $20 service or reserve that amount. [Official budget setup and behavior](https://docs.cloud.google.com/billing/docs/how-to/budgets).

## D. Keep costs low without changing learning/security

- [ ] Retain min **0**, max **2 per callable**, concurrency **8**, attempt expiry **7200 s**, and **3/minute / 60/day per UID new starts**. Preserve same-request recovery. Do not add warm-up jobs or raise runtime limits.
- [ ] Retain normal token caching, existing lesson/audio caches and Option A's reduced read scope; avoid repeated builds, force-refresh loops, unnecessary new attempts and regenerating unchanged narration. New cache/cleanup policies require separate approval; preserve rollback files and learner evidence.
- [ ] Keep the pilot to 30 enrolled students with supervised initial sessions and an operator available during class. This is an operating restriction, **not a server-enforced 30-UID allowlist**.
- [ ] Before rollout, explicitly choose **a separately approved/tested all-endpoint throttle** or a documented time-limited acceptance of its absence with staffed monitoring/pause authority. Neither is approved by this checklist. Start quotas do not constrain advance/resume/submit traffic, repeated valid-user requests or total expense; App Check and instance limits are not financial caps.
- [ ] Enforce the reviewed Auth, revocation/account checks, App Check, private records, strict schemas and canonical client-write denials. Never reduce prerequisite checks, follow-ups, grading or rewards to save money, and never allow browser reward fallback.

## E. Required before any student use — later approval stages

- [ ] Provision/review dedicated build/runtime accounts and minimum IAM/APIs, with actual deployed identity/configuration readback; keep protocol disabled until acceptance.
- [ ] Complete the narrow App Check repair and real school-browser/network attestation; do not replace it with debug tokens or lower security settings for cost reasons.
- [ ] Approve the six-advisory time-limited disposition, backup/recovery arrangement, monitored operating limits, abuse-gap disposition and emergency authority.
- [ ] Publish the separately reviewed protected rules and exact compatible Hosting/Functions release during an approved save-cutover window. Inventory/secure legacy writers and preserve existing progress.
- [ ] Pass approved isolated hosted security, retry/refresh, quota, reward-integrity and class-scale acceptance. Choose a closed test window or separately approved canary design; the current protocol lacks a UID canary gate.
- [ ] Verify cost visibility/recipients, safe pause access and student notice. Obtain **separate 30-student rollout approval**. Billing activation alone satisfies none of these rollout gates.

## F. What can incur charges

- [ ] Recognize that linkage exposes existing eligible usage to paid excess. Builds, retained container/source files, invocation/CPU time (including some rejected/retried requests), Firestore reads/writes/index/storage, media transfer, provider attestations above shared allowances, AI/TTS/SMS, backups/exports/restores, paid metrics/scanning and cross-region networking can all cost money. No-cost quotas are shared, not reserved for the class.
- [ ] Do not assume protocol disabled means zero bill: existing services and stored artifacts continue; disabled endpoints can still receive chargeable traffic. Repeated builds and managed full exports can cost money even when no students are taking quizzes. No free-trial credit is assumed in planning. [Accepted feasibility review](priority-3-30-student-free-tier-feasibility-2026-11-07.md).

## G. Monitoring and safe pause — proposed, not executed

1. [ ] Review built-in billing and usage views immediately after approved setup/tests and each first-week class, daily during week one, then at least weekly. Compare invoice spend and pre-promotion run rate by service/SKU with requests, retries/errors, Firestore operations, image size, media bytes and provider quota. Avoid raw answers/tokens in logs and unnecessary paid telemetry.
2. [ ] Investigate at the early warnings; immediately hold new sessions for unexplained rapid growth or suspected abuse rather than waiting for $20. Proposed manual investigation trigger: unexplained **$1/day** or **$10 projected monthly assessment spend**; these are decisions, not installed alerts or a maximum liability.
3. [ ] Under explicitly approved incident authority, set `learningSettings/securedAssessment.enabled:false` with a fresh conflict check and readback. Notify students that saving is paused while earned progress is safe. Keep restrictive rules and existing lessons/review available where permitted; never promise in-flight transactions were cancelled by this policy write.
4. [ ] If traffic or a faulty Admin endpoint continues, use separately authorized scoped invocation restriction and/or the reviewed deny-only rollback through the explicit-account gcloud workflow. Verify the gate. A deny-only deployment requires a build and may add cost; blocking invocation can temporarily prevent receipt recovery. Retain receipts for later same-ID recovery.
5. [ ] Check the actual cost driver: policy pause does not stop unrelated AI/media/storage bills or prevent all invocation charges. Do not unlink billing, disable all project services, delete student records, restore permissive rules or revoke rewards. Broader interventions require further approval.
6. [ ] Review delayed charges and the cause, re-run appropriate acceptance, and obtain reopening approval. Resume uncertain results with the same attempt ID, without a fresh reward credit. Do not automatically increase the budget.

Optional future investigation: Firebase documents Preview service spend caps, but they are delayed, permit overages, cover selected services and may pause saves. They are not a hard project-wide ceiling and are **not included in Stage 1 setup**. [Official scope/limitations](https://firebase.google.com/docs/projects/billing/spend-caps).

## Approval still needed

- [ ] Exact billing account/payment owner and currency; Stage 1 billing-link authorization.
- [ ] $20 budget, listed thresholds, credit filters and named recipients.
- [ ] Manual warning/pause thresholds, incident operator and narrow standing pause authority, or approval at incident time.
- [ ] All-endpoint throttling decision; dependency, backup and later infrastructure/App Check/publication/acceptance/rollout approvals remain independent.

Accepted manifest: **`0b902b44931e19bde9e26db746c6518def3991367f85717f01014f28c3beb2ef`**. All 242 artifact and 23 source hashes were checked locally and remain unchanged. No fresh production metadata/invoice read was performed. Await approval; no Stage 1 action has run.
