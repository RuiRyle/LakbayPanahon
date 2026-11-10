# Student data download single-flight protection

9 November 2026. Local-only correction to `js/student-data-download.js` and `tests/student-data-export.test.cjs`.

Repeated invocation of the download handler previously advanced its generation and began another export, invalidating an already running request. The disabled button normally prevents ordinary pointer duplicates, but the handler itself lacked protection. A per-user in-flight guard now ignores duplicate actions before changing generation. Completion/failure releases the guard; an older account's pending operation cannot clear a newer account's guard. Existing current-user checks still prevent stale downloads after account changes.

All 7 synthetic export tests passed under Node 22.23.4, including duplicate-action preservation of the first export and a second successful download afterward. Existing ownership, pagination, partial-failure refusal, active-student and session-change assertions remain passing. Accepted Stage 0 validation and scoped whitespace check passed.

Tests mock Firestore and the DOM/download API. No actual browser download dialog or live Firebase data was accessed. No source data, educational content, grading, rewards, UI layout, deployment, billing or remote Git branch was changed.

## Browser-navigation lifecycle follow-up

Confirmed issue: leaving during export invalidated its generation but did not restore the disabled control when the same page returned from browser cache. Page exit now discards the in-flight marker; a persisted pageshow resets controls according to the current account and offers a fresh-download message. Authentication changes also clear the old marker. Generation checks still prevent abandoned reads from producing downloads.

All 9 tests pass after this change. New regressions simulate cached-page restoration, an old request resolving while a fresh export runs, duplicate invocations during that newer request, and signed-out return. The older request neither downloads nor unlocks/removes the newer operation's guard. These are simulated DOM lifecycle events, not an actual browser back-forward-cache acceptance test. Accepted Stage 0 validation passed again.
