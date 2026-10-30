# Chapter 8: Community and Belief Evidence Challenge

> Publication update - 28 October 2026: This release is now published to Firestore, backed up and field-verified. See [Chapters 7-14 publication](chapters7-14-publication.md). Older status sections below record the original authoring stage.

## Status and learning structure

Built locally on 28 October 2026. Unpublished. No live Firestore requests, writes, test accounts or Hosting deployment. Earlier pending releases and all four Chapter 8 missions must be published first.

Ten equally weighted activities connect the four missions. Six require a supporting lesson clue and its conclusion: teaching material versus universal reading; arrival versus universal conversion; promised support versus delivery; authority claims versus final decisions; parish beginnings versus later building features; and the limits of using Tamblots case for all communities. Four matching tasks review missionary records, institutional evidence, belief/practice/institution, and adaptation/continuity/evidence limits.

Both parts of an evidence decision must be correct to earn that activity. All three matching pairs must be correct for a matching activity. Pass at 7 of 10. Every supplied lesson clue is available even if it was not saved in the journal. Clues load from their referenced Firestore scenes after publication. Correct clue positions and conclusion letters vary.

The challenge checks historical explanation, never a students religion. No prayer, religious disclosure, conflict reenactment or invented historical speech is required. Existing draft recovery, save retry, lesson evidence review and reward behavior are reused.

## Completion and publication

The Community and Belief Investigator badge is configured once after four owned mission completions and a passing challenge. Additional chapter XP is 0. Existing continuation logic offers Explore Chapters unless it finds ready next content. No next era is invented or automatically published.

- data/chapter8-challenge-content.json: authored challenge, ten activities and badge.
- functions/build-chapter8-challenge.cjs: resolves actual lesson references.
- data/chapter8-challenge-migration.json: 14 changes, including two guarded catalog descriptions.
- functions/apply-chapter8-challenge.cjs: original project only; dry run by default; --apply commits atomically, saves a rollback snapshot and verifies fields.

Four mission prerequisites and ten exact scene-clue prerequisites prevent publication against missing or changed source evidence. Catalog description guards expect Chapter 8 Mission 4. No learner records are written by the migration.

Publish earlier pending releases in sequence, then Chapter 8 Missions 1-4, then this challenge. Once availability and prerequisites are confirmed, run the apply script without flags, inspect the dry run, run with --apply, then repeat without flags to verify zero changes. Review collisions and precondition mismatches rather than bypassing them.

## Sources and verification

Historical material and source URLs are reused from the four mission plans. See chapter8-mission1.md through chapter8-mission4.md for source scope and limits. No new historical claims or dialogue are introduced. Independent historical, teacher, curriculum alignment and Grade 5 readability review remain pending. Passing is a learning milestone rather than proof of complete mastery.

All 219 non-emulator unit checks passed. The Chrome fixture passed four-mission gating, ten authored activities, two-part evidence grading, saved draft recovery, 60% failure versus 70% passing, the authored badge, unchanged mission XP, repeat-reward protection and unavailable-content fallback. Migration syntax passed. These mocked checks do not establish live security or classroom effectiveness.

Live preflight, commit/readback and an authenticated full-chapter walkthrough remain pending. The next operational step is ordered publication when Firestore is available; the next roadmap content is Era 3, Chapter 9, Colonial Economic Life and Policies.
