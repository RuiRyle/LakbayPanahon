# Local-only compact catalog feasibility prototype

All runtime and browser fixtures require demo emulators. No production entry,
credentials, release manifest or external account configuration is included.

`catalog.cjs` groups question/practice/daily/chapter banks into content-addressed
documents. A signed manifest maps exact query descriptors to SHA-256 pack IDs.
Every grading transaction reads a fresh signed head and pack data, using only
transaction-local snapshot reuse. Original grading/adaptive/reward code remains
unchanged. `bootstrap.cjs` uses an ephemeral Ed25519 test signing key in memory.

`classroom.cjs` replays the full 30-student workload without display caching or
reduced teacher refreshes. `browser.cjs` exercises 30 users through real Chrome,
Firebase web SDK, unchanged rules and the actual learning-draft module (only its
SDK import is redirected for instrumentation). Dashboard/story queries are query
shapes, not full UI navigation. Teacher and grading traffic use the separate
backend workload. Browser and backend counts must not be added together.

`probe-run.cjs` tests corruption, atomic publication failure, CAS conflict,
published edits, rollback, profile/policy checks and two demonstrated blockers:
legacy source edits are ignored until publication, and an Admin writer can replay
a previously signed head. These prevent production approval. The publisher is a
fixture publisher, not a secured replacement for existing authoring workflows.

See the separate validation report for operation counts and required design work.
