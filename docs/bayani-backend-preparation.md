# Bayani Task 2: secure backend preparation

29 October 2026. **Code is prepared and locally tested; the new route is not activated or deployed.** The user explicitly selected local preparation with paid activation disabled. No Firebase records, provider account, billing or credentials were changed. No real AI request was made and no account availability is assumed.

## What is implemented

The optional browser bridge sends the student's Firebase ID token and an App Check token to `/api/bayani/chat`. Its body contains only the question and bounded prior user/model text. It does not send a chosen model, assistant instructions, UID, profile or saved scores. It checks identity again after asynchronous token and response steps, rejects redirects, and aborts after 35 seconds. HTTPS is required except development HTTP between the same loopback hostname, where separate Live Server/backend ports are allowed.

The separate Node backend verifies the ID token, including revocation, and App Check. It reads the current student's role/status and the current `learningSettings/bayaniAI` configuration for each request. Only an active student and explicitly enabled/reviewed Anthropic configuration can reach generation. It reserves usage through an atomic Firestore transaction before a provider call. It validates conversation structure, rejects incoming model/system overrides, applies request/output bounds, rejects non-text/refusal/truncated responses, and returns fixed errors without raw provider details. A limited contact-detail heuristic runs on incoming and outgoing text; it is not comprehensive PII detection or content moderation.

Teaching instructions, model choice and usage policy values remain authored in Firestore. There is no hardcoded lesson bank or model selection. The provider URL and protocol limits in code control transport behavior. Server settings are not taken from the browser.

## Files to review

| File | Purpose |
| --- | --- |
| `server/bayani/server.cjs` | Private Node HTTP entry point, activation/configuration checks and Firebase Admin wiring. |
| `server/bayani/core.cjs` | Authentication, profile/policy checks and bounded request processing. |
| `server/bayani/usage.cjs` | Durable atomic student/global usage reservations. |
| `server/bayani/anthropic.cjs` | Fixed Anthropic Messages endpoint, streamed response cap and cancellation. |
| `js/bayani-backend-client.js` | Optional authenticated browser transport. |
| `js/bayani-client.js` | Selects the backend only for explicit `provider: "anthropic"`. |
| `data/bayani-backend-settings.draft.json` | Disabled authoring draft; not an update/activation script. |
| `server/bayani/.env.example` | Names of required host settings; contains no credentials. |

30 October follow-up: the student client now rejects the legacy `gemini`, missing/null and unknown provider routes before App Check/model initialization. It permits only the explicit approved backend configuration; activation remains disabled. The previous silent Gemini fallback has been removed locally. Existing Firestore settings and any separately cached/hosted old frontend have not been changed by this code edit. This closes the local fallback without establishing provider approval or activating a replacement. See the [provider decision](bayani-provider-options.md) and the current finish tracker.

## Local checks that do not use accounts

From the project root, run the relevant test files directly:

```powershell
node tests/bayani-backend.test.cjs
node tests/bayani-backend-client.test.cjs
node tests/bayani-bridge-integration.test.cjs
node tests/bayani-debug.test.cjs
node tests/bayani-request.test.cjs
node tests/web-release-boundary.test.cjs
```

These use injected authentication, database, transaction and provider implementations. They do not start an emulator, install dependencies or consume Firestore/AI quota. The existing `tests/bayani-ai-browser.cjs` checks the chat interface separately with a mocked connection.

## Activation sequence — requires resolved account and privacy decisions

1. **Confirm the account and intended audience.** Resolve the provider's terms for the Philippine under-13 application, applicable model retention terms, operator/contact/retention details, school/guardian arrangements and content safeguards. Setting `minorsUseApproved=true` is an operator-controlled configuration flag, not evidence of provider approval or legal compliance.
2. **Choose a private backend host and approve costs.** It needs Node 22 or later, HTTPS, private secrets, ingress rate limits and Firebase Admin access to the existing project. This is a separate service from the public website. This preparation does not deploy Cloud Functions or require moving the database from Spark. Hosting/API charges remain separate decisions. Review the provider's actual spending controls; request counters are not a guaranteed dollar budget.
3. **Configure secrets outside the website folder.** Live Server currently serves the repository root. Never place a real API key or service-account JSON anywhere in `C:\LakbayPanahon`, even in a Git-ignored `.env` file. Use the host's secret manager/environment and preferably workload identity/Application Default Credentials. The server rejects an explicitly configured credential path inside the workspace. Git ignore rules and the release inventory do not secure a development web server.
4. **Prepare the host environment.** Review `.env.example` for names. Required values include `GOOGLE_CLOUD_PROJECT`, private `ANTHROPIC_API_KEY` and exact `BAYANI_ALLOWED_ORIGINS`. No wildcard origins or App Check bypass is supported. Install the private service dependencies on the selected host and review/lock the resulting dependency versions before release. Keep `BAYANI_ACTIVATION_APPROVED` off until the account, security and policy decisions are complete.
5. **Review and back up the current Firestore settings.** The draft JSON is a field plan, not a complete replacement document. Preserve the published teaching instructions, message limit, greeting and public App Check site key. Set an approved Anthropic `model`, HTTPS `backendEndpoint` ending in the exact `/api/bayani/chat` path, output limit and student/global request ceilings. The supplied draft stays disabled and has blank model/endpoint values. Do not paste the draft wrapper into Firestore or store private credentials there.
6. **Perform an intentional reviewed switch.** Only after the previous steps, coordinate the host activation flag and Firestore `provider`, `enabled` and `minorsUseApproved` values. Leave it disabled if any prerequisite is incomplete. This work includes no automatic publisher or rollout command.
7. **Record bounded live acceptance.** Verify real ID/App Check rejection, active-student access, counter enforcement, timeout recovery and actual Grade 5 responses. Use the [response review](bayani-response-review.md), including Filipino readability, historical accuracy, quiz hints, off-topic requests and harmful content. Local mocks cannot establish provider eligibility, moderation adequacy or deployed authorization.

## Reads, counters and data lifecycle

A normal reserved request performs approximately four Firestore document reads: profile, assistant settings, student usage and global usage. It writes two counter documents. Transaction retries can add reads. These are intentional authorization/limit checks; there is no new polling, chat listener or full collection scan. Rejections before reservation use fewer operations. Repeated authenticated rejected requests can still consume Firestore reads; configure host ingress/rate protection before activation. The request counters do not provide complete denial-of-service protection.

`bayaniUsage/{uid_YYYY-MM-DD}` contains `userId`, a Philippines calendar date, request/minute counts and numeric update/window times. `bayaniUsageDaily/{YYYY-MM-DD}` holds the global date/count/update time. Neither stores the question, answer, email or profile name. Current Firestore rules deny browser access to these new server-only collections by default; Admin access bypasses rules and is constrained by the server code and host credentials. No rules deployment was made.

Counters survive server restarts and multiple instances. Failed or timed-out provider requests are not automatically refunded or retried, so reservations remain conservative. A timed-out request can still consume quota. Counter expiry is **not implemented or assumed**: agree retention, disposal and UID-linked account-removal handling before activation. Host access/error logging and the provider's own retention also need review. The backend itself does not log chat text.

## Remaining limits

The system instruction guides subject and age-appropriate behavior; it does not guarantee history-only, accurate or safe replies. The contact-detail heuristic misses many forms of personal information and harmful content. Submitted prior assistant messages are conversational context, not authenticated records of previous answers. No model tools, browsing, uploads, score access or reward writes are enabled. Wider threat review and real service acceptance remain outstanding.

The public website staging allowlist excludes `server/`, authoring plans and tests. New private server references also fail the dependency inventory. Keep deploying only the reviewed public staging package, never the repository root.

Primary protocol references: [Anthropic API overview](https://platform.claude.com/docs/en/api/overview), [Messages API](https://platform.claude.com/docs/en/api/messages/create), [Firebase ID-token verification](https://firebase.google.com/docs/auth/admin/verify-id-tokens), [App Check verification for custom backends](https://firebase.google.com/docs/app-check/custom-resource-backend).
