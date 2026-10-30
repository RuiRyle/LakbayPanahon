# Bayani backend preparation: local evidence

29 October 2026. User scope: **prepare locally; keep paid activation disabled**. No Firebase/provider calls, emulator, dependency installation, real credentials, settings writes or deployment. The new backend requires explicit activation and configured private credentials; the settings draft is disabled with blank endpoint/model values.

| Check | Result |
| --- | --- |
| `node tests/bayani-backend.test.cjs` | 22 passed: authentication/revocation/App Check, current student/policy, payload/privacy limits, atomic counter concurrency, timeouts, provider protocol/response bounds and HTTP/startup controls. |
| `node tests/bayani-backend-client.test.cjs` | 17 passed: endpoint security, fresh tokens, identity races, bounded history/UTF-8 streams, deadline coverage, fixed errors and no automatic retries. |
| `node tests/bayani-bridge-integration.test.cjs` | 5 passed: real client/processor contract with injected services, server-authoritative configuration, contact-detail rejection, inactive users, limits and disabling after connection. |
| `node tests/bayani-debug.test.cjs` | 3 passed: localhost debug boundary, unapproved/unknown provider rejection and approved backend routing without Gemini initialization. |
| `node tests/bayani-request.test.cjs` | 6 passed: wait deadlines, late settlements and fixed UI guidance for provider/backend outcomes. |
| `node tests/web-release-boundary.test.cjs` | 4 passed: private server/authoring exclusion, public modules and Settings/student-shell explicit entry coverage. |

Total: **57 focused checks passed**. Test services and database transactions are injected fakes; the provider adapter receives a fake fetch implementation. This is not a live Firebase authorization or provider response test.

`node tests/bayani-ai-browser.cjs` also passed in local headless Chrome with mocked authentication/connection and injected timers: draft recovery, known failure guidance, New Chat/account/page isolation and layout. Screenshot: `C:\Users\RUIRYL~1\AppData\Local\Temp\lakbay-bayani-AxsdBy\bayani.png`.

`node functions/build-web-release-local.cjs` passed its inventory and strict allowlist dry run: **22 entry pages, 427 files, zero missing/rejected references**. The first dry run exposed a real Settings allowlist omission and the computed student-shell destination was also missing. Both were added explicitly, with a regression check. No new staging folder or public deployment was created. The old 412-file staging package remains stale.

Bounded read-only review found no confirmed identity, cross-account, role or model/instruction override bypass in the prepared request path. It led to fixes for UI error mappings, streamed frontend response bounds and safely draining rejected HTTP bodies. Backend and frontend module syntax checks passed.

Remaining acceptance: eligible provider/account/model, host/ingress protection, private credentials, student privacy and counter retention, content safeguards, bounded live ID/App Check/limits checks and actual Grade 5 response review. The contact-detail heuristic is incomplete. Existing legacy Gemini routing remains unchanged and its age restriction remains unresolved. Do not declare learner rollout or all student security complete from these local results. See [implementation and activation gates](../bayani-backend-preparation.md).
