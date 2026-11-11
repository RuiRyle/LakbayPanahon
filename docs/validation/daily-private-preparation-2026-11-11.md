# Daily public/private preparation — 11 November 2026

Local code changes, not published:
- Daily UI reads dailyChallengeCards, whose allowlisted schema excludes correctAnswer, explanations and unexpected fields.
- Both incorrect and correct submissions go to trusted grading; browser-local answer comparison removed.
- Known failed results clear their cached attempt so another answer can receive a fresh attempt. Unknown network outcomes retain the existing state for safe retry.
- Correct-answer display is taken only from authenticated assessment state after confirmed success.

Two projection tests and daily browser fixture pass, including wrong/correct answer, replay, empty content, load failure and recovery. These are synthetic UI/transport tests, not hosted learner acceptance.

prepare-daily-cards.cjs --inspect reads up to 100 original records and writes an unpublished projection plan under ignored build output. It refuses pagination overflow; it never writes production Firestore.

Pending before deploying this frontend: populate/reconcile public cards and grant their active-student reads in the coordinated rule cutover. Until then this changed local UI cannot display the unmigrated live daily catalog. Main Render grading policy remains disabled; no rule or data publication performed in this step. Shared-practice keys and exploration preview still need adaptation.
