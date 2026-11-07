# Local-only read-efficiency investigation

No deployment entry, credentials or account setup. `bootstrap.cjs` replaces the
store factory in process memory before constructing the existing Netlify proof's
four `onCall` exports. Accepted source and prior proof files are not edited.

`memo-store.cjs` shares snapshots only within one transaction callback, including
point snapshots returned by a query. Every request and SDK retry gets empty maps.
Queued writes preserve the original read-before-write behavior. Grading, adaptive
selection, content hashes, eligibility, receipts and reward logic are unchanged.

`classroom.cjs` runs with `READ_EFFICIENCY_MODE=baseline` or `optimized`. Both
require demo Auth/Firestore at the existing proof ports. The optimized workload
also shares display catalogs within an assumed single page lifecycle and reduces
teacher refreshes from four to two; these are explicit workload tradeoffs, not
changes integrated into the application. Five-minute synthetic lesson intervals
allow four activities without disabling the start rate limit.

Both runs include two missions, daily and chapter assessments, adaptive followups,
stories, draft autosaves, dashboard returns, teacher reads and concurrent receipt
replays. Source inspection and emulator query-shape replay are not browser or
billable usage traces. Results remain NO-GO for the 40,000-read target.
