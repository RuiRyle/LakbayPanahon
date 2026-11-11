# Render cutover audit — 11 November 2026

Activation remains disabled in Firestore. No production permissions or student records were changed during this audit.

Confirmed incompatibilities:
- Main/chapter answer banks are readable through the current student catalog rule.
- Daily challenges combine public display fields and grading answers in dailyChallenges; the browser reads them directly before trusted issuance.
- Exploration preview reads question banks directly to grade noncanonical previews.
- Practice reads its answer-bearing practiceQuestions collection directly. Assessment follow-ups can share that pool.

The inactive rule builder now avoids duplicating the existing securedAssessment rule and removes student access to main/chapter answer-bank collections. Canonical browser score/reward writers remain blocked in the candidate. Candidate output: build/render-cutover-review/candidate.rules. Static invariants and ten classroom/Render tests pass; no server Rules API acceptance or publication claimed for this candidate.

Before activation: migrate public/private daily and shared practice fields without exposing secure answer keys, adapt preview to an authorized server-backed no-reward path (or explicitly decide a separate restricted preview environment), test affected pages, and release only the reviewed live-rule difference. Do not activate by only switching the policy flag. Do not upload the entire stale candidate over unrelated published rules.
