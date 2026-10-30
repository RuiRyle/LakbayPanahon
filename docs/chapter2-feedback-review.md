# Chapter 2 feedback review

Reviewed community leadership, social roles and oral traditions against the dated lesson snapshot and local social-role/oral-tradition revisions. The scope is six main/retry questions, not the complete course.

Findings and changes:

- Leadership feedback now distinguishes a specific livelihood skill from guiding community affairs and points back to the disagreement scene.
- Social-position feedback distinguishes preferences, settlement size and location from rights, duties and choices. Removed broken `person?s` wording and avoided equating historical position with human worth.
- Oral-tradition feedback distinguishes written transmission from voices/listening, recognizes that some knowledge has sharing limits, and reminds students to identify a story's source honestly.

`data/chapter2-feedback-polish-migration.json` changes only `answerExplanations` and `learningPoint`. Prompts, answer keys, difficulty, XP and completion behavior are unchanged. Existing quiz result routes already preserve chapter, mission and weak topic for lesson review and targeted practice.

Local checks passed for all six updates: complete option feedback, unchanged assessment fields and exact baseline guards. Script syntax passed. No Firestore calls were made. Independent teaching review and comparison with the current live lessons remain pending.

`functions/apply-chapter2-feedback-polish.cjs` is dry-run by default. It backs up changes before an atomic `--apply` commit and verifies readback. The expected fields include the complete question/options and old feedback: if later revisions have changed them, publication must stop for reconciliation rather than overwrite them.
