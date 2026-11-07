# Larger-class report loading improvements

Updated 6 November 2026. Local changes; no production deployment or schema/rules changes.

## Changes

- Class snapshot preparation reads the current owned class and active membership only. It no longer downloads announcements, assignments, private-review history or invitation details just to discover the roster.
- The report client accepts at most 20 distinct students per request, sharing teacher/class metadata checks within that batch. Student reads run in groups of at most three. Each student still has a fresh class membership check and existing rule-protected report reads. Failed student reads remain unavailable, never a zero score.
- Roster-name loading skips identities already available in the currently loaded class view. Unknown names remain eligible for retry. Class refresh/switch and auth workspace reset clear the existing names map; no new persistent cache of identities, grades or learning evidence is added.
- Prepare class report remains above the result table, so a large snapshot does not bury its refresh action.
- Report refresh retains the last completed snapshot until a new one is ready. A failed refresh labels the old snapshot as potentially out of date, clears its busy state and offers explicit retry through Prepare class report. It does not silently substitute stale scores into a new result.

All report reads remain on demand. This does not introduce polling, background class scans or automatic write retries. Existing guidance/planner draft protections remain in place.

## Validation

teacher-large-class-client.test.cjs uses 120 synthetic members and the actual client module. It verifies complete roster pagination without unrelated publications, 120 report outcomes, six ownership/application checks for six 20-student batches rather than one per student, all 120 membership checks, removed-member exclusion before profile loading and rejected duplicate/oversized requests. This is a client read-count/logic fixture, not a production latency or concurrent-user benchmark.

teacher-student-progress-design.cjs passed at 390px and 1280px, including a cached-name revisit while simulated reads fail and a failed snapshot refresh preserving the earlier result with a stale warning. One run timed out on an unrelated viewport-animation assertion; it passed on rerun without removing that assertion. The refresh test was corrected to target Prepare explicitly rather than accidentally activating Download CSV.

Syntax checks passed. Existing per-student history limits and the collection safety cap remain; this patch does not promise unlimited class/history size. Real deployed load characteristics still need measurement with designated acceptance data before introducing server-side summaries.
