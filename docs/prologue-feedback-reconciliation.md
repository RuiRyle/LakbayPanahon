# Prologue and quiz-feedback revision review

Offline review on 2026-10-28. No Firestore requests, migration execution or deployment.

The archaeology mismatch is explained by a preserved intermediate authored revision. All 27 expected document states in data/archaeology-pilot-migration.json match the desired states in backups/archaeology-pilot-before-glossary.json, including expected-absent checks. The current plan is therefore a guarded continuation of that revision, not an update intended for the older general curriculum snapshot. Keep its guards unchanged. Do not rewrite its expected fields to match the old snapshot or execute the historical backup as a new apply plan. Matching authored revisions does not prove either was published.

The detailed report lists changed fields per document, allowing content and help changes to be reviewed together rather than selecting isolated field terminals. This resolves the explanation for the archaeology field-history flags; current live state and teacher review are still pending. The dated snapshot field-history report remains an accurate comparison to its stated baseline and is not silently rewritten as a live-state report.

The older question-feedback input contains 50 document updates. Twenty match the saved snapshot and overlap the Grade 5 wording input, whose desired fields also match that baseline. There is no reason from this baseline to replay those older updates. Thirty feedback documents do not match; each is marked for whole-question review with subsequent mission revisions. Do not splice an old explanation or answer into newer question wording just because a field-level transition exists.

Run node functions/review-prologue-feedback-local.cjs to reproduce docs/validation/prologue-feedback-review-local.json. The report records dispositions and evidence of the prior authored revision. It is not executable and does not select deployment values. All 362 non-emulator checks passed, including rejection of a mixed question/answer baseline.

Next: inspect the 30 nonmatching feedback documents alongside their later mission-specific replacements and identify coherent intended question states. After that, establish a bounded current-database preflight when Firestore is available. Teacher review, live verification, publication and Hosting deployment remain pending.
