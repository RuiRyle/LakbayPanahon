# Current local classroom acceptance — 10 November 2026

The highest-priority core classroom slice now passes against actual local Auth, Firestore and assessment Functions, with a current packaged frontend and temporary student/classes. The latest existing demo backup was restored without reseeding user data. No production, external credentials or billing changes occurred.

## Ten verified checks

1. A new temporary student earns personal XP through trusted solo grading.
2. An authenticated approved teacher creates a versioned assignment using the real client SDK and rules.
3. The student joins through the actual My Class form and themed OK confirmation; reservation/membership save together.
4. Earlier solo completion remains unsubmitted for the new class assignment.
5. Attempting to join another classroom is rejected.
6. Fresh trusted classroom grading saves the linked result with zero duplicate XP.
7. My Class displays the assignment as completed after refresh.
8. The teacher's assignment report shows the class result separately from personal completion.
9. Teacher guidance reaches the student's real My Class guidance drawer.
10. The student's read acknowledgement saves against the current feedback revision.

Details/hashes: [acceptance JSON](classroom-final-local-2026-11-10.json). Test: `tests/classroom-final-local.cjs`. Teacher operations use the authenticated application modules; student join, result display and feedback use actual pages. Assessment answers are supplied programmatically from demo answer keys: this verifies trusted grading/integration, not the full quiz-button gameplay or learner comprehension. The harness uses the actual student iframe execution context; an initial parent-shell evaluation produced an invalid test result and was corrected without weakening the class restriction.

## Defects fixed during the integrated check

- Secured local rules lacked the absent-record reads needed by teacher transactions to reserve new assignment/review/announcement IDs. Added the same narrowly scoped active-teacher checks already present in the normal rules. Existing-document reads keep their original ownership rules. Regression now checks parity across both rule sources.
- The Join controls were initially enabled before module initialization. They now start disabled and become usable through the initialized auth/handler flow. This prevents early native submission while code is loading.

The previous slot-rule repair is included. Twelve focused parity/submission/reservation checks also pass. Earlier whole teacher/admin browser failures remain outside this core slice and are not declared resolved.

## Data preservation and current runtime

The original restore snapshot is `build/local-backups/2026-11-10T05-00-46-256Z`. Temporary profiles, classes, owned learning/attempt records and Auth accounts were cleaned up. A follow-up count audit found zero temporary test classes/profiles and zero temporary Auth accounts. A new backup is saved at `build/local-backups/2026-11-10T15-21-18-805Z`; no earlier backup was overwritten.

The demo launcher remains running at `http://127.0.0.1:4173`. The harness served the newer final frontend package at temporary port 4174, which is closed after testing. The running launcher's frontend was built before the final initial-disabled-controls change. Restart from the new backup when using that final source through the main launcher; never start a second launcher or discard the existing session. Corrected local permissions were applied only to the demo emulator for this check and are in source for the next launch.

## Remaining scope

Real local round trips for revision mid-attempt, removal/rejoin, ending/archiving, concurrent duplicate requests and interrupted network recovery remain useful extended classroom acceptance. Unit coverage is not promoted to integrated evidence. Broad teacher/admin regressions, all-catalog interactions, AI acceptance, content/participant review and public deployment remain separate. This report closes the core join → fresh submission → teacher result → feedback/read slice only.
