# Chapter 11: Autonomy and Community Response Evidence Challenge

> Publication update - 28 October 2026: This release is now published to Firestore, backed up and field-verified. See [Chapters 7-14 publication](chapters7-14-publication.md). Older status sections below record the original authoring stage.

## Status and activities

Built locally on 28 October 2026. Unpublished. No Firestore requests, writes, student accounts or Hosting deployment. Earlier pending releases and all four Chapter 11 missions must be published first. Independent historical, teacher, curriculum alignment and Grade 5 readability review remain pending.

Ten equally weighted activities include six evidence decisions and four matching tasks. Decisions examine claims versus effective control; a military post versus surrounding authority; distinct Sulu and Maguindanao polities; archaeological context versus universal terrace ages; resistance beyond armed fighting; and aims versus outcomes. One matching task per mission revisits authority questions, polity/source terms, Cordillera investigation and responses under constraints.

Each evidence decision requires both the correct supporting clue and conclusion for one activity. All three matching pairs must be correct for a matching activity. Pass at 7 of 10. Correct clue positions and conclusion letters vary. All supplied clues are available without journal saving and resolve actual authored Firestore discoveries after publication.

Existing UI, grading, draft recovery, save retry and reward behavior are reused. Runtime instructional data remains in Firestore; JSON is authoring input. No attack reenactment, cultural ranking, identity disclosure or rewards for harm are added. A category, leader or regional label is not every persons motive or experience.

## Rewards and guarded publication

The Autonomy and Community Response Investigator badge is configured once after four owned mission completions and a passing challenge. Additional chapter XP is 0, preserving mission rewards. Replay does not duplicate the badge. Existing continuation logic offers Explore Chapters unless ready next content with active missions exists. This release does not create a later era, award an invented era-completion reward or mark unbuilt content complete.

- data/chapter11-challenge-content.json: challenge, badge and ten authored activities.
- functions/build-chapter11-challenge.cjs: resolves exact lesson clues and builds the plan.
- data/chapter11-challenge-migration.json: 14 writes: challenge, ten activities, badge and two guarded catalog descriptions.
- functions/apply-chapter11-challenge.cjs: original project only; dry run by default; --apply commits atomically with rollback snapshot and planned-field readback.

Eighteen prerequisites require four active missions and fourteen exact scene-clue lists. Description guards expect Chapter 11 Mission 4. No learner records are included. Publish earlier pending content, then Chapter 11 Missions 1-4, then this challenge.

After availability and prerequisites are confirmed, inspect the apply scripts dry run, run with --apply, then repeat without flags to verify zero changes. Review collisions and changed expected fields rather than bypassing guards. Live preflight, commit/readback and an authenticated full-chapter walkthrough remain pending.

## Sources and verification

All historical cases and source URLs come from the four mission plans. See chapter11-mission1.md through chapter11-mission4.md for source attribution and limits. No new treaty clause, speech, universal terrace age, territorial boundary or present-day legal claim is introduced. Introductory activities do not replace community, regional-history or curriculum review.

All 284 non-emulator unit checks passed. They cover ten activities, four-mission coverage, exact clue references and prerequisites, two-part grading, varied correct positions, unique matching pairs, threshold and guarded descriptions. Migration syntax passed.

The Chrome fixture passed four-mission gating, all ten authored tasks, partial-answer recovery, 60% failure versus 70% passing, the authored one-time badge, unchanged mission XP, repeat-reward protection and unavailable-next-content fallback. Shared fixture checks cover save retry and recovery. Mocked Firestore does not establish live security, actual signed-in behavior or classroom effectiveness.

Next operational step: ordered publication when Firestore is available, followed by an authenticated walkthrough. Next roadmap content: Era 4, Chapter 12, Early Resistance to Spanish Colonial Rule, beginning with Causes and Forms of Resistance.
