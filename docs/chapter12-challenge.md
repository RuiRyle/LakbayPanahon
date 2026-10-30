# Chapter 12 final challenge

> Publication update - 28 October 2026: This release is now published to Firestore, backed up and field-verified. See [Chapters 7-14 publication](chapters7-14-publication.md). Older status sections below record the original authoring stage.

Locally authored and verified on 2026-10-28. Not published to Firestore or Hosting.

The Early Resistance Evidence Challenge connects all five missions. Five decisions require both a supporting lesson clue and the supported conclusion; five matching activities cover cause/action/outcome, regional cases, religious and political concerns, participation, and remembrance. Each complete activity counts once. Seven of ten is a pass. No speed bonus, harm score or extra chapter XP is added.

The existing challenge flow requires the learner's own five mission completions before entry. Passing awards the Early Resistance Investigator chapter badge through the existing one-time completion flow. Draft progress can resume; retry and replay use existing behavior. Until Chapter 13 is actually ready, continuation returns to Explore Chapters rather than promising unavailable content.

Authoring input: data/chapter12-challenge-content.json. Build with node functions/build-chapter12-challenge.cjs. Output: data/chapter12-challenge-migration.json. These are authoring/publication files; runtime educational data stays in Firestore.

The publication plan has 14 writes: a challenge, ten activities, one badge and two guarded catalog-description updates. Nineteen prerequisites require the five active missions and the exact active lesson clues referenced by evidence cards. Publish the earlier mission plans in order first. Default apply-script dry runs still read Firestore; no apply or dry run was executed during this work.

Every evidence card references an existing scene clue instead of duplicating its text. Sources are inherited from the five mission plans. Historical claims stay within the reviewed lesson scope: requests do not establish successful outcomes; chronology does not prove coordination; movement dates are not a founder's lifespan; affected residents are not automatically participants; later recognition is not immediate victory. No new historical claims or graphic material were introduced.

Validation: 307 non-emulator local checks passed. A mocked-data Chrome walkthrough passed the five-mission gate, all ten authored activities, two-part evidence grading, draft resume, 60-percent fail/70-percent pass, one-time badge and unavailable-content fallback. Apply-script syntax passed. These checks do not verify live database permissions.

Pending: independent teacher/curriculum review, ordered Firestore publication, authenticated walkthrough and Hosting deployment. Next content task: Chapter 13 Mission 1, Economic and Political Changes in the 18th Century.
