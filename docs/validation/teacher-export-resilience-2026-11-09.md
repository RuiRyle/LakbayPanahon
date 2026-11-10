# Teacher export resilience

9 November 2026. Fixed two confirmed local export edge cases without changing stored records or learning logic.

- Individual reports now show Unavailable for scores outside 0–100, matching classroom export validation. Valid zero scores remain zero.
- A throwing timestamp accessor or finite timestamp outside JavaScript's supported date range no longer crashes an individual export. Classroom latest-attempt selection skips unusable dates while retaining valid dated evidence.

Changed `js/teacher-report-export.js` and `tests/teacher-report-export.test.cjs`. All 8 export tests passed under Node 22.23.4, including new malformed-record regressions and existing privacy, formula-injection, missing-record, tied-date and future-date checks. Accepted Stage 0 validation passed.

Tests use synthetic in-memory records and do not exercise the browser download/print dialog. No Firebase request, production mutation, grading/reward change, deployment, billing activation or push occurred. Existing navy/gold UI is unchanged.
