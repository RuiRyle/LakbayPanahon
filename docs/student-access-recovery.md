# Student access recovery

The protected-page guard now offers student accounts a retry dialog when their profile read fails. The existing session stays signed in, and protected content stays hidden until the profile is successfully checked. The dialog remains visible while the rest of the page is hidden and offers Try Again or Return to Sign In.

Missing profiles and inactive accounts still sign out. Accounts with another role redirect to their corresponding dashboard. Session changes invalidate pending profile responses before they can reveal protected content. Firestore permissions remain responsible for data access.

`node tests/student-auth-guard-browser.cjs` verifies the actual guard and shared student styles in Chrome with mocked Firebase. It covers connection failure/retry, dialog visibility, hidden content, sign-out during a delayed read, wrong roles and missing/inactive profiles. All existing 46 unit tests pass. No database or rule changes were required.

Live UI acceptance and physical phone testing remain pending.
