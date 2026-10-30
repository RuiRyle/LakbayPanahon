# Chapter 10: Social and Cultural Evidence Challenge

> Publication update - 28 October 2026: This release is now published to Firestore, backed up and field-verified. See [Chapters 7-14 publication](chapters7-14-publication.md). Older status sections below record the original authoring stage.

## Status and activities

Built locally on 28 October 2026. Unpublished. No Firestore requests, writes, student accounts or Hosting deployment. Earlier pending releases and all five Chapter 10 missions must be published first. Historical, teacher, curriculum alignment and Grade 5 readability review remain pending.

Ten equally weighted activities give each mission one evidence decision and one matching task. The five decisions examine building-stage dates, a printed book versus universal acceptance, a category versus a whole biography, the 1807 event versus the 1821 paintings, and agency versus unlimited freedom or automatic success. Five matching tasks revisit housing evidence, learning-history concepts, social roles and requests, cultural-source questions, and continuity/implementation/agency.

Each evidence decision needs both the correct supporting clue and the correct conclusion for one activity. All three matching pairs must be correct for a matching activity. Pass at 7 of 10. Correct clue positions and conclusion letters vary. Every supplied lesson clue is available regardless of journal saving. References resolve actual authored discoveries from Firestore after publication.

The existing interface, draft recovery, save retry and grading behavior are reused. Runtime data remains in Firestore after publication; local JSON is authoring input. No parallel hardcoded challenge flow is added. Activities require no faith practice, personal disclosure, ancestry ranking, alcohol use, conflict reenactment or cultural-pattern copying.

## Rewards and guarded publication

The Social and Cultural Investigator badge is configured once after all five owned mission completions and a passing challenge. Additional chapter XP is 0, preserving mission rewards. Replay does not duplicate the badge. Existing continuation behavior offers Explore Chapters unless ready next content with active missions exists. Chapter 11 is not created or marked complete.

- data/chapter10-challenge-content.json: challenge, badge and ten authored activities.
- functions/build-chapter10-challenge.cjs: resolves source-clue references and builds the plan.
- data/chapter10-challenge-migration.json: 14 writes: challenge, ten activities, badge and two guarded descriptions.
- functions/apply-chapter10-challenge.cjs: original project only; dry run by default; --apply commits atomically with rollback snapshot and planned-field readback.

Seventeen prerequisites require five active missions and twelve exact scene-clue lists. Description guards expect Chapter 10 Mission 5. No learner records are included. Publish earlier releases, then Chapter 10 Missions 1-5, then this challenge.

After availability and prerequisites are confirmed, inspect the apply scripts dry run, run with --apply, then repeat without flags to verify zero changes. Review collisions and expected-field mismatches rather than bypassing guards. Live preflight, commit/readback and an authenticated full-chapter walkthrough remain pending.

## Sources and verification

Source-scoped facts and URLs come from the five mission plans. See chapter10-mission1.md through chapter10-mission5.md for source attribution, dates and limits. The challenge introduces no new historical event, speech, tax rate or universal social ladder. A model, later depiction or record about one role is not treated as every persons experience.

All 265 non-emulator unit checks passed. They cover activity count/order, five-mission coverage, exact clue references and prerequisites, two-part grading, varied correct positions, unique matching pairs, pass threshold and guarded descriptions. Migration syntax passed.

The Chrome fixture passed all-five-mission gating, all ten authored activities, partial-answer recovery, 60% failure versus 70% passing, the authored one-time badge, unchanged mission XP, repeat-reward protection and unavailable-next-content fallback. Shared fixture checks cover save retry and recovery. Mocked Firestore does not establish live security, actual signed-in behavior or classroom learning effectiveness.

Next operational step: ordered publication when Firestore is available and an authenticated walkthrough. Next roadmap content: Chapter 11, Indigenous Autonomy and the Limits of Colonial Rule, beginning with Communities Beyond Effective Spanish Control.
