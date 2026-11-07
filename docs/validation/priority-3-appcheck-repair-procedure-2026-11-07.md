# Exact App Check repair procedure — prepared, not applied

7 November 2026. **No production registration, frontend setting, enforcement, key, billing or service was changed.** The accompanying `priority-3-appcheck-repair-proposal-2026-11-07.json` is inert review material, not an executable migration.

## Proposed key selection

Select the existing restricted Enterprise **SCORE** key:

- Public site key: `6LeByQIuAAAAAJxlrg4_Me5ymg5s-tFgOwVF7SeZ`.
- Resource: `projects/831214660993/keys/6LeByQIuAAAAAJxlrg4_Me5ymg5s-tFgOwVF7SeZ`.
- SHA-256: `4dd79a7261ebeccc1a451e448dbac7f3ba1e246733d573b1cd759ec92bb41d3a`.
- Display name: LakbayPanahon Web; created 27 October 2026 at 04:09:37Z.
- Correct project, `integrationType:SCORE`, `allowAllDomains:false`; allows only `lakbaypanahon-1797e.web.app` and `lakbaypanahon-1797e.firebaseapp.com`.

It is the newer of two equivalently configured existing keys, so it is a reasonable explicit candidate without creating another key. Newer creation time does **not** prove intended ownership or that it is unused elsewhere: obtain the owner's confirmation before applying. If the owner identifies a conflicting purpose, stop and revise the proposal; do not silently switch keys. Retain the older key; no deletion is proposed.

The currently selected value has hash `871b749bd7a5ea875e270856f1f73a39dd1b2fe6658781306bcf8b2349e8f500`, is absent from the project's Enterprise key listing and returns INVALID_ARGUMENT. Its provenance remains unknown. Main production domains, frontend Enterprise provider class and web-app identity already match; do not broaden domains or change provider to mask this key-selection issue.

## Approval and preflight

1. Obtain explicit **production configuration repair and bounded attestation-test approval**. This is separate from billing, deployment and enforcement approval. The existing key does not inherently require a Blaze upgrade just to select it, but real verification consumes assessment quota.
2. Re-read the selected key, App Check configuration and `learningSettings/bayaniAI`. Verify project/app IDs, selected-key hash, SCORE/domain restrictions, previous key hashes, TTL, score threshold and all unrelated frontend fields. Capture fresh before-state locally without logging secrets/tokens.
3. Confirm no other administrator is changing these resources and use a short coordinated verification window. App Check and Firestore are different APIs: **there is no atomic transaction across them**. The current App Check resource provides no documented etag/CAS field, so a fresh read and coordinated change control are required. Never promise a race-free cross-service update.
4. Preserve `tokenTtl:"3600s"`, `riskAnalysis.minValidScore:0.5`, current global enforcement modes, current Bayani enabled/provider settings and the disabled/missing secured-assessment rollout policy.

## Exact proposed field changes, only after approval

Target application: `1:831214660993:web:aeff983c8b3182358e4c80` in project `lakbaypanahon-1797e` / number `831214660993`.

1. Update only `siteKey` on:

   `projects/831214660993/apps/1:831214660993:web:aeff983c8b3182358e4c80/recaptchaEnterpriseConfig`

   The REST method is PATCH with `updateMask=siteKey`. The reviewed request body contains the resource name and selected public site key; the proposal JSON records it. Do not use a wildcard mask or replace TTL/risk settings. Read back immediately and verify the exact selected value and preserved fields. [App Check field-mask reference](https://firebase.google.com/docs/reference/appcheck/rest/v1/projects.apps.recaptchaEnterpriseConfig/patch).

2. Update only `appCheckSiteKey` in:

   `projects/lakbaypanahon-1797e/databases/(default)/documents/learningSettings/bayaniAI`

   Use `updateMask.fieldPaths=appCheckSiteKey`, value `{"stringValue":"6LeByQIuAAAAAJxlrg4_Me5ymg5s-tFgOwVF7SeZ"}`, and a **freshly read** `currentDocument.updateTime` precondition. The proposal includes an observed timestamp as evidence, not a permanently usable precondition. Stop if it conflicts; do not overwrite unrelated settings. [Firestore patch/precondition reference](https://firebase.google.com/docs/firestore/reference/rest/v1/projects.databases.documents/patch).

3. Read both back and require:

   `Enterprise registration.siteKey === bayaniAI.appCheckSiteKey === ReCaptchaEnterpriseProvider input === selected public key`.

   The existing client reads that setting; **no frontend JavaScript deployment is necessary just for this field repair**. Reload clients that cached the earlier value. Verify Bayani initialization as well because both features share this setting. Never put a reCAPTCHA v3 secret into the Enterprise public site-key field. [Enterprise configuration schema](https://firebase.google.com/docs/reference/appcheck/rest/v1/projects.apps.recaptchaEnterpriseConfig).

## Verification and partial-failure handling

After separate approval, verify token acquisition on each actual production origin using an isolated test identity, without logging tokens. Test normal browsers and a school/shared-network device; check score/denial metrics. Local CustomProvider header transport is not production attestation proof.

Before secured endpoints exist, token exchange can be tested independently; it does not require enabling reward saving. A later approved protected endpoint probe may return `assessment/not-active` while rollout stays disabled, proving Auth/App Check passed without creating an assessment attempt. Do not call an unreviewed AI generation operation as a test or enable global Auth/Firestore enforcement.

If only one field update succeeds, keep rollout disabled, record the partial state and stop automatic work. Resolve the second change under the same explicit configuration authorization after fresh conflict checks, or request guidance if scope has changed. Do not remove verification, enable debug tokens, change answer/reward rules or silently restore a known-unresolvable key merely to hide the error. Existing learner records are untouched.

Preview origins are not currently allowed by the selected key. Add an exact preview domain only under separate approval if preview attestation is required; Firebase Auth's preview authorization does not grant reCAPTCHA domain access.

Success criteria: exact field equality, preserved unrelated settings, successful real production exchange, acceptable legitimate-browser scores and no new enforcement/rollout activation. Billing, API/IAM setup, dependency disposition and deployment remain separate gates.
