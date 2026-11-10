# Personal progress and classroom submissions — 10 November 2026

## Implemented locally

Personal mission completion remains independent of classroom assignment evidence. A completed solo mission cannot automatically satisfy an ordinary class assignment or targeted classroom review. My Class offers a contextual **Take class quiz** link and explains existing personal completion separately.

The shared assessment client derives validated classroom/assignment identifiers from the learning URL, carries them into trusted issuance and isolates its memory/tab caches by assignment. Resuming a solo or another assignment attempt cannot reuse it for the current classroom activity. Reopening a completed classroom quiz starts a fresh attempt rather than presenting a receipt as a new submission.

The trusted service validates the active class, active owned membership, published assignment, matching chapter/mission and targeted-review recipient. It records the assignment version, membership timestamp, assignment time and server issuance time in the private attempt and final quiz-attempt record. Ongoing attempts recheck this context before answering/resuming/submitting. Revision, removal, closure or a changed membership cannot silently accept unfinished work. Completed receipts remain idempotent history.

Normal class assignments now have `submissionVersion`: first save 1, subsequent edits/republishing advance it; closing/withdrawing preserves it and imposes an ending cutoff. Existing assignments default to version 1 until their next teacher save. Local rule candidates enforce the sequence. No personal records are reset or backfilled as classroom work.

The shared evidence function accepts matching class/assignment/version results with valid dates. Solo attempts, another assignment/class, outdated versions and future/inconsistent completion times cannot establish completion. Ending an assignment preserves earlier matching results. Rejoining preserves completed results for the same class/version from the original membership; unfinished old-membership attempts must restart. Other-class work cannot transfer.

Teacher assignment results use the same evidence function and show personal completion separately. General Student Progress remains personal history. Targeted-review results require linked review attempts; earlier personal results can still supply a separate baseline. These are saved quiz observations, not proof of learning effectiveness.

The canonical reward path is unchanged: first personal completion can earn XP; repeating a completed mission for class earns zero duplicate completion XP. The trusted-service test verifies this with an already completed personal mission.

## Verification

- 26 focused local checks pass across classroom evidence, trusted issuance/submission, assessment-client transport and teacher assignment policy.
- My Class mocked Chrome check verifies prior personal completion stays unsubmitted, a fresh linked attempt completes the assignment and a future completion becomes unavailable; existing join/leave/recovery checks pass.
- Revision, removal, independent cache keys, closed activities, rejoining/history and unchanged XP are covered.
- JavaScript syntax and scoped whitespace checks pass. Public inventory: 37 pages, 613 files, no missing/rejected static references.

## Activation remains required

These are source/local changes. No Firestore rules, hosted frontend or assessment runtime was published; no learner record was reset or modified.

Release the matching backend, assignment-version rules and frontend together after live-state review. Regenerate the alternate Netlify service from canonical `functions/student-assessment.js` before using that package; the existing experimental copy is stale. Restart the local Functions process when testing through the dedicated demo launcher. Static Live Server does not activate new server code.

An old backend rejects classroom issuance fields, and old live teacher rules reject `submissionVersion`. Until the matching runtime/rules are activated, classroom quiz issuance and new assignment saves may fail closed. Do not call this an active production fix. Backend hosting/billing approval is not inferred.

Before activation, verify actual teacher publication → student join → contextual lesson/quiz → teacher result, revision mid-attempt, removal, replay and preserved rewards. Record exact release hashes and cleanup. Earlier broad teacher/admin layout regression findings remain separate open checks.
