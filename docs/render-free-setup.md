# Render Free setup — LakbayPanahon

Prepared 11 November 2026. This first deployment verifies hosting only. It does not connect to Firebase or enable quizzes.

## Fill the creation screen

| Field | Exact value |
|---|---|
| Repository | RuiRyle/LakbayPanahon |
| Branch | main |
| Root Directory | Leave empty |
| Language | Node |
| Build Command | npm ci --prefix functions --omit=dev --ignore-scripts |
| Start Command | node server/render/server.cjs |
| Instance Type | Free ($0/month) |

Add these environment variables:

| Key | Value |
|---|---|
| NODE_VERSION | 22.23.4 |
| ASSESSMENT_ENABLED | false |

Under Advanced, set Health Check Path to `/healthz` if offered. Set Auto-Deploy to Off if offered so later commits do not silently release backend changes. Do not enter credentials or add a payment method for this initial check.

After this commit is on main, click Deploy web service. Wait for the service to show Live. Open its assigned HTTPS address with `/healthz` appended. Expected result:

```json
{"status":"ok","assessmentEnabled":false}
```

This means hosting works. Quizzes deliberately remain disabled. Share only the public service URL to continue setup; no credential contents.

## Separate activation work

Before enabling grading:

1. Provision a dedicated backend service account for Firebase project `lakbaypanahon-1797e`, with reviewed Firestore server access and Auth user-read permissions needed for revoked-token checks. Avoid using an existing broad Editor account by default. Backend Admin credentials bypass Firestore client rules; keep all request authorization in the shared service.
2. Place its JSON only in Render Environment > Secret Files, filename `firebase-service-account.json`. Never put it in this repository or chat.
3. Configure `GOOGLE_APPLICATION_CREDENTIALS=/etc/secrets/firebase-service-account.json`, `GOOGLE_CLOUD_PROJECT=lakbaypanahon-1797e`, and `ASSESSMENT_ALLOWED_ORIGINS` as a comma-separated exact website-origin list. For the current Live Server URL, the origin is `http://127.0.0.1:5500`. `localhost` is a different origin; add it only if used.
4. Resolve the current App Check error first. Use an approved provider/domain setup, or registered local debug attestation for development; do not disable server enforcement. This adapter does not enable browser debug attestation automatically.
5. Review and coordinate real Firestore rules, private answer-key access and the current secured-assessment policy before allowing production attempts. Local rule acceptance does not certify the current real-project rules.
6. Add the service's exact HTTPS origin, without a trailing slash or path, as string `backendUrl` in existing Firestore document `learningSettings/securedAssessment`. The website reads this configuration; it does not replace the document's other fields. Leave it unset until hosted verification is ready.
7. Enable `ASSESSMENT_ENABLED=true` only for the agreed activation test, then verify signed-in test accounts, App Check, denied requests, class linkage, receipts and reward replay against the real project. Do not open this to learners before acceptance.

The backend exposes only `/startStudentAssessment`, `/advanceStudentAssessment`, `/resumeStudentAssessment`, `/submitStudentActivity` and `/healthz`. It imports the current `functions/assessment-callables.js` and assessment core rather than a copied old grading service. It does not deploy Firebase Functions or require Firebase billing. Firestore's existing quotas still apply.

## Free-service limitations

Render Free sleeps after idle periods; initial wake-up can be slow. Free services have usage limits. Render advises Free instances for previews/testing, not production applications. Do not add a payment method or select paid compute for this no-billing setup. See https://render.com/docs/free.

## Verification completed locally

Four HTTP/configuration tests and ten secured-client tests pass. The real Firebase callable wrapper rejects requests missing Auth/App Check. Client tests verify configured HTTPS endpoints and reject non-HTTPS/path-bearing values. No real credential, hosted authenticated invocation, IAM change or production write was performed.

References: https://render.com/docs/deploy-node-express-app ; https://render.com/docs/configure-environment-variables ; https://firebase.google.com/docs/reference/js/functions
