# Chapter 9: Community Economy Evidence Challenge

> Publication update - 28 October 2026: This release is now published to Firestore, backed up and field-verified. See [Chapters 7-14 publication](chapters7-14-publication.md). Older status sections below record the original authoring stage.

## Status and activities

Built locally on 28 October 2026. Unpublished. No Firestore requests, writes, student accounts or Hosting deployment. Earlier pending releases and all five Chapter 9 missions must be published first. Independent historical, teacher, curriculum alignment and Grade 5 readability review remain pending.

Ten equally weighted activities give each of the five missions one evidence decision and one matching task. Five decisions connect an actual lesson clue with its supported conclusion: required tribute versus voluntary gifts; delivery versus payment; required buyers and selling options; loading ports versus production places; and equal demands versus different household resources. Five matching tasks revisit tribute records, labor/produce terms, agriculture-policy concepts, galleon evidence and community-effect questions.

Each evidence decision needs both the correct clue and conclusion for one activity. All three pairs must be correct for a matching activity. Pass at 7 of 10. Correct clue positions and conclusion letters vary. Every supplied clue is available regardless of journal saving. Evidence references resolve the authored discoveries from Firestore after publication.

Activities reuse the existing interface, draft recovery, save retry and grading behavior. The change adds instructional data, not a parallel hardcoded challenge engine. Fictional models remain models; no invented tax rate, labor quota or crop price is introduced. No personal family disclosure, tobacco use, forced-work roleplay or conflict reenactment is required.

## Completion and publication

The Community Economy Investigator badge is configured once after all five owned mission completions and a passing challenge. Additional chapter XP is 0, preserving mission rewards. Replay must not duplicate the badge. Existing continuation logic offers Explore Chapters unless ready next content with active missions exists. This release does not create or complete Chapter 10.

- data/chapter9-challenge-content.json: challenge, badge and ten authored activities.
- functions/build-chapter9-challenge.cjs: resolves exact lesson clues and builds the plan.
- data/chapter9-challenge-migration.json: 14 writes: challenge, ten activities, badge and two guarded descriptions.
- functions/apply-chapter9-challenge.cjs: original project only; dry run by default; --apply commits atomically, saves rollback evidence and verifies fields.

Seventeen prerequisites require five active missions and twelve exact referenced scene-clue lists. Description guards expect Chapter 9 Mission 5. No learner records are included in the migration. Publish earlier pending releases and Chapter 9 Missions 1-5 in order, then this challenge.

After availability and prerequisites are confirmed, inspect the apply scripts dry run, run with --apply, then repeat without flags to verify zero changes. Review collisions and expected-field mismatches rather than bypassing guards. Live preflight, commit/readback and an authenticated full-chapter walkthrough remain pending.

## Sources and verification

This challenge reuses the source-scoped lesson evidence and URLs documented in chapter9-mission1.md through chapter9-mission5.md. It introduces no new historical events or dialogue. Evidence of one stage, institution or person is not treated as every households experience. Passing is a learning milestone, not proof of full curriculum mastery or classroom effectiveness.

All 242 non-emulator unit checks passed. They verify ten activities, five-mission coverage, exact clue references and prerequisites, two-part evidence grading, varied correct positions, unique matching pairs, threshold and guarded descriptions. Migration syntax passed.

The Chrome fixture passed the all-five-mission gate, all ten authored tasks, partial-choice recovery, 60% failure versus 70% passing, the authored badge, unchanged mission XP, repeat-reward protection and unavailable-next-content fallback. Shared fixture checks cover save retry and recovery. Mocked Firestore does not establish live security or actual student behavior.

Next operational step: ordered publication when Firestore is available, followed by an authenticated walkthrough. Next roadmap content: Chapter 10, Social and Cultural Transformation, beginning with Changes in Settlements and Housing.
