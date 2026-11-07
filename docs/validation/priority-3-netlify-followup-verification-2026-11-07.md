# Netlify local follow-up verification

7 November 2026. Local experiments/public-document review only. **Production remains NO-GO; billing stays on hold.** No account creation, production data access, credential export, IAM change, deployment or Priority 4 work occurred. Accepted Stage 0 files remain unchanged.

## New completed tests

The normal approval path became available. The previously blocked `experiments/priority3-netlify/catalog-case.cjs` ran successfully against demo Auth/Firestore. It selected `chapter15-mission5` from eligible five-question quizzes using the harness's catalog/prerequisite weight. Score 60 met passing score 60; the unchanged reward formula preserved initial XP 777 plus the catalog mission reward. Prerequisites were explicitly seeded, not exercised learning paths.

Measured: **621 minimum document-read units, 20 committed document writes, zero deletes, 13 transaction callbacks, zero retries and zero failures**. This is a catalog-heavy example, not a maximum-cost proof across all 66 missions or mature learner histories. Selection filters to eligible five-question quizzes; it is not a claim that the separately identified higher-weight, differently configured quizzes were tested.

A second actual demo-emulator experiment, `display-read-sharing.cjs`, compared two display consumers loading the same four public catalog collections for each of 30 synthetic sessions. Baseline **6,120 reads** became **3,060** when overlapping consumers shared one page-owned promise per collection. Display output was identical; a new context saw an intervening edit. Both measured paths wrote/deleted zero documents. Fixture seed/edit operations are excluded.

This optimization is confined to the experimental harness. **No server grading/catalog validation is cached**, and no production UI integration is claimed. Existing `js/content-cache.js` already implements bounded instructional caching and pending-load sharing. Therefore this is a measured opportunity only where a browser trace proves duplicate uncached consumers; it is not automatically 3,060 additional savings in the earlier projection. Do not subtract it from a baseline that already assumed cache hits.

Evidence: `priority-3-netlify-catalog-case-2026-11-07.json` / `.log` and `priority-3-netlify-display-sharing-2026-11-07.json` / `.log`. Both scripts exited successfully. Prior 12 adapter-unit, 230 compatibility-unit and 18 emulator assertions plus repeated 30/30 waves remain prior evidence; they were not rerun or relabeled as new tests this turn. The new catalog test exercises the previously unverified helper parameterization. Full browser-to-Netlify adapter and actual Netlify bundle/hosted tests remain outstanding.

## Safe read-reduction findings

| Opportunity | Disposition |
|---|---|
| Share duplicate public display loads within the same page/session | Measured above. First trace existing cache usage; integrate only where duplication exists. Never treat cached display records as access/reward authority. |
| Reuse already-returned successful action state rather than immediately issuing redundant resume | Potentially saves a verification transaction. Only remove demonstrably redundant reads; keep refresh/uncertain-save recovery and current identity checks. Not implemented/measured here. |
| Stable UUID retries/committed receipts | Already implemented: three receipt replays previously cost 12 reads and zero writes, versus taking a fresh quiz. Preserve this behavior. |
| Reduce UI/listener reload loops and load ownership detail only when opened | Review candidate; needs browser traces and compatibility tests. Do not hide features or stop progress refresh after rewards. |
| Cache trusted catalog/policy/prerequisite/profile outside reward transaction | **Not adopted.** Could weaken content-edit, disablement, unlocking or atomic reward protection. Requires a separately demonstrated versioned design, not a TTL workaround. |
| Change question selection/count, reward rules, history evidence or SDK retry options | Not proposed. Preserve assessment semantics and exactly-once writes. |

No authoritative service optimization was necessary or justified by these two experiments. Thus prior mission operation counts are unchanged; this report does not claim a newly optimized backend.

## Updated daily feasibility

Spark allowances remain shared: 50,000 reads/day, 20,000 writes/day; index-entry/rule-dependent operations and lower-level retries can add to the minimum document-based counts. [Firestore quotas](https://firebase.google.com/docs/firestore/quotas).

| Thirty students, sampled UI included | Reads | Writes | Nominal remaining reads |
|---|---:|---:|---:|
| One first-mission lifecycle + daily | 24,390 | 810 | 25,610 |
| Two first-mission lifecycles + daily | 44,190 | 1,410 | 5,810 |
| Above + chapter | 46,770 | 1,620 | 3,230 |
| Two measured catalog-heavy lifecycles + daily, extrapolated | 41,850 | 1,410 | 8,150 |
| Above + chapter | 44,430 | 1,620 | 5,570 |

The last two rows substitute 621 reads/mission for 660; they are arithmetic extrapolations from a single-user test, not new 30-student waves. The first rows retain the more conservative measured first-mission rate. All rows omit unmeasured story-scene traffic, practice/draft writes, teacher/nonpilot activity, deeper histories and additional failures/restores. Display-sharing savings are **not deducted** because the prior UI model already included cached behavior. Two-mission days remain fragile; there is no basis to guarantee all existing traffic fits. Never silently restrict the learning flow to satisfy quota.

## Netlify no-payment registration finding

Current official pricing confirms the Free tier: $0, 300 credits/month, hard limit/no auto-recharge. The vendor's explicit no-credit-card statement is still its **12 November 2024** announcement, not confirmation of every current onboarding/anti-abuse path. Current public docs reviewed did not independently settle account-specific payment/identity verification. **No account was created; present-day no-payment registration remains unconfirmed.** Stop if a later authorized signup requests payment. Do not interpret third-party “verified free” directories as proof. [Current plan](https://docs.netlify.com/manage/accounts-and-billing/billing/billing-for-credit-based-plans/credit-based-pricing-plans/), [historical no-card statement](https://www.netlify.com/blog/introducing-netlify-free-plan/).

No paid subscription is needed merely for the published Free compute allowance, but quota exhaustion pauses service. Hosted compute/response size, publications, CORS and retries must fit that allowance. A Functions-only backend avoids moving the existing media site onto Netlify. Cloudflare remains the fallback with explicit no-card advertising, but its runtime/10-ms CPU budget and Firestore adapter are untested; it does not solve Spark limits.

## Supplying Firebase Admin credentials safely — design only

Firebase supports trusted non-Google servers. Preferred credential delivery is short-lived workload identity **if a documented runtime issuer and Google federation integration can actually be demonstrated**. This research found no verified general Netlify Functions runtime OIDC-to-Google workflow; build-time or GitHub Actions OIDC is not automatically runtime identity. Do not promise keyless deployment or borrow Google-managed runtime credentials. [Firebase Admin setup](https://firebase.google.com/docs/admin/setup).

A possible fallback, requiring explicit approval, is a dedicated least-privilege service-account key stored in the provider's runtime environment configuration and parsed only by server code. No Owner/Editor/default privileged account, no user refresh token, and no client Firebase API key as substitute. Minimum reviewed authority covers required Firestore get/list/create/update and Auth user lookup; actual IAM must be verified. No delete/account-administration permissions should be added incidentally. Runtime possession of the key can authorize database writes because Admin bypasses client rules; all existing server checks remain mandatory.

**Important correction to earlier scoping assumptions:** current Netlify docs state explicit environment-variable scopes are **Pro and above**. Do not claim Free provides Functions-only scope. Free environment values may also be reachable by build code; the build pipeline, dependencies and preview policy become part of the trust boundary. Current docs describe encrypted environment storage, but enhanced secret policies/features cannot be assumed available on Free. [Functions variables](https://docs.netlify.com/build/functions/environment-variables/), [secret handling](https://docs.netlify.com/build/environment-variables/secrets-controller/).

Before accepting key-based Free hosting, prove a backend-only controlled project with no untrusted builds, no production credentials in previews/dev, restricted owner access/MFA, reviewed build scripts/dependencies and artifact scanning. No browser/public-prefixed variable, `netlify.toml`, `.env` commit, bundled JSON key, build log or response may contain credentials. Private repositories reduce exposure but do not make bundled secrets safe. Base64 is encoding, not encryption. Rotation/revocation and loss-of-host-access procedures need a named owner. Environment size limits and the exact Free-plan preview/context restrictions remain acceptance checks. If adequate isolation is unavailable without payment, **stop rather than relax the credential boundary**. [Google key guidance](https://docs.cloud.google.com/iam/docs/best-practices-for-managing-service-account-keys).

No real credential was generated, exported, saved or tested. Credential creation, IAM and provider secret configuration would be production-security actions and need separate approval even if their direct monetary cost is zero.

## Remaining hosted-pilot steps and recommendation

1. Complete local Netlify packaging and actual browser-to-adapter regression; trace full story/practice/draft/teacher traffic and account for larger histories, failures, restores and two-mission bursts. Integrate only proven redundant-display reductions under review; keep authoritative service unchanged.
2. Obtain official current no-payment onboarding clarification or separately authorized signup with an unconditional stop at payment requests. No provider contact was sent this turn.
3. Approve external credential/IAM/preview isolation and a no-billing learner-backup/restore plan. Managed Firebase exports require billing; an alternative authorized export still processes learner data and consumes quota. These gates are not solved by free hosting.
4. Separately approve provider account/resource/configuration, App Check repair/real attestation, reviewed restrictive rules and narrow Hosting routing/CSP cutover. Keep protocol disabled until approved isolated hosted acceptance. No live-data test is authorized now.
5. Demonstrate cold/warm 30-user hosted saves, private/canonical denials, expiry, interruption, recovery, quota pause and abuse handling. All-endpoint throttling remains absent; free quota abuse becomes an availability outage. Student rollout and reopening authority require separate decisions.

**Recommendation: continue conditional local evaluation; NO-GO for hosted students.** One-mission use has plausible document-read headroom; two-mission use is not robustly free until full shared traffic is measured. Netlify remains a lower-change transport candidate, not a confirmed no-payment secure deployment. Registration, Free-plan credential isolation, backup and hosted availability remain real blockers. No security weakening or backend rewrite is recommended to force a free result.

Accepted Stage 0 manifest remains `0b902b44931e19bde9e26db746c6518def3991367f85717f01014f28c3beb2ef`. Local integrity results are recorded separately. No release manifest was regenerated. Await approval before further implementation or external action.
