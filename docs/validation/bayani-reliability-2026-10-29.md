# Bayani local reliability verification

29 October 2026. Provider-independent browser behavior only; no Firebase, App Check registration or model requests were made by these checks.

- `node tests/bayani-request.test.cjs`: five checks passed. Covers the 30-second connection and 45-second reply deadlines, timer cleanup, original errors/results, no automatic retries, ignored late resolution/rejection, and fixed recovery guidance.
- `node tests/bayani-debug.test.cjs`: one check passed. Existing localhost-only debug opt-in remains intact.
- `node tests/bayani-ai-browser.cjs`: passed in local headless Chrome with mocked authentication/provider and injected deadline timers. Covers connection timeout/retry and late connection, retained questions after reply timeout, a late answer while another request is active, blocked/invalid/empty outcomes, New Chat, account/page isolation and existing rendering/layout checks.
- Module syntax check for `js/bayani-ai.js`: passed.

Chrome initially could not spawn inside the sandbox (`EPERM`). The same local fixture passed using the approved execution path. Screenshot: `C:\Users\RUIRYL~1\AppData\Local\Temp\lakbay-bayani-jEWjoj\bayani.png`.

`withBayaniDeadline` limits the page's wait. It does not cancel the underlying provider request or imply that a timed-out request cannot consume quota. Late settlements cannot update the page through that promise. Questions are restored for a deliberate retry; requests are never automatically resubmitted.

Known blocked, invalid and empty responses offer rephrasing or New Chat guidance without exposing provider response text. This does not implement content moderation or establish safe factual replies. The page now explicitly describes chat clearing as local page behavior, without promising provider deletion.

The existing `js/bayani-client.js` SDK/backend, Firestore settings, credentials, rules and billing are unchanged. The [provider decision](../bayani-provider-options.md) and actual-response review remain separate outstanding work.
