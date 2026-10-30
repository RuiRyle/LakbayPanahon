# Chapter 7: Government and Community Evidence Challenge

> Publication update - 28 October 2026: This release is now published to Firestore, backed up and field-verified. See [Chapters 7-14 publication](chapters7-14-publication.md). Older status sections below record the original authoring stage.

## Status

Built locally on 28 October 2026. **Unpublished.** No live Firestore requests, writes or student test accounts were used. Database availability was not rechecked. Earlier pending releases and all Chapter 7 missions must be published first. Hosting was not deployed.

## Learning activities

All four chapter missions are required before entry. The challenge has ten equally weighted activities:

1. Distinguish the colonial governor-general from a modern elected presidency using a supporting clue.
2. Distinguish a listed responsibility from evidence of fair performance.
3. Check whether a petition establishes its own successful outcome.
4. Distinguish encomienda collection rights from automatic ownership of every field.
5. Distinguish required tribute from a freely offered gift.
6. Distinguish a proposed settlement layout from evidence of actual building and residence.
7. Match issue, delivery and implementation with their evidence questions.
8. Match gobernadorcillo, principales, and continuity/change with careful descriptions.
9. Match a grant, collection account and complaint with the questions each helps answer.
10. Match a policy instruction, proposed layout and residence evidence with the claim each supports directly.

Activities 1-6 require both a supporting lesson clue and a conclusion. Both parts together earn one activity; a correct conclusion with the wrong clue does not earn it. The cards load actual authored discoveries from Firestore. Correct card positions and conclusion letters vary. Saving clues in the journal is optional; every supplied clue is available regardless of journal use.

Activities 7-10 use the existing matching interface; all three pairs must be correct for that activity. Partial credit or drag-and-drop ordering is not claimed. Feedback explains why the evidence supports the conclusion and why unrelated clues cannot fill the gap.

Passing requires at least 7 of 10 activities, or 70%. Failure does not complete the chapter or grant a badge. Existing draft logic restores submitted answers and partial evidence choices. Existing save-retry behavior avoids forcing a retake when the completed result could not be saved.

## Rewards and completion

The authored badge is **Government and Community Investigator**. Existing chapter reward transactions award it once after all mission completions and a passing challenge. Additional chapter XP is configured as 0, preserving mission rewards instead of adding another XP award. Replay does not duplicate the badge.

The existing result screen acknowledges the saved chapter and badge. With Chapter 8 unavailable, it offers Explore Chapters. A next chapter is offered only when the existing continuation check finds ready active content with active missions. This change does not create Chapter 8 or alter independent-era access.

## Files and guarded publication

- `data/chapter7-challenge-content.json`: challenge, badge and activity authoring input.
- `functions/build-chapter7-challenge.cjs`: resolves lesson references and builds the plan.
- `data/chapter7-challenge-migration.json`: 14 writes: challenge, ten activities, badge and two guarded catalog descriptions.
- `functions/apply-chapter7-challenge.cjs`: original project only, dry run by default; atomic commit with backup/preconditions and field-by-field readback when `--apply` is supplied.

Eighteen publication prerequisites verify all four active mission records and exact source-clue lists in the referenced active scenes. Description preconditions expect the Chapter 7 Mission 4 release. This prevents the planned publication from proceeding against missing missions or unreviewed changed evidence. No learner collection is included. Runtime questions, badge data and evidence references come from Firestore; JSON is for authoring.

Publish earlier pending Chapter 5 and Chapter 6 releases, then Chapter 7 Missions 1-4 in sequence. After database availability and those prerequisites are confirmed:

```powershell
node functions/apply-chapter7-challenge.cjs
node functions/apply-chapter7-challenge.cjs --apply
node functions/apply-chapter7-challenge.cjs
```

The repeat dry run should report zero changes. Review collisions or expected-value mismatches rather than bypassing guards. No live preflight, commit, readback or signed-in walkthrough has run for this challenge.

## Source and review limits

The challenge reuses the lesson evidence and source lists documented in `docs/chapter7-mission1.md`, `docs/chapter7-mission2.md`, `docs/chapter7-mission3.md` and `docs/chapter7-mission4.md`. URLs are retained in the generated content. No new historical dialogue, universal tribute amount or exact settlement layout is introduced.

Independent historical, teacher, curriculum alignment and Grade 5 readability review remain pending. Passing is a project learning milestone, not proof of complete mastery of colonial government or complete curriculum coverage.

## Verification

All 200 non-emulator unit checks passed. Checks cover activity count/order, four-mission coverage, exact lesson references and clue prerequisites, two-part evidence grading, varied correct card positions, unique matching pairs, pass threshold and guarded descriptions. Builder and migration syntax checks passed.

The local Chrome fixture verifies all-four-mission prerequisites, all ten authored tasks, clue-plus-conclusion grading, restored partial choices, 60% failure versus 70% passing, the authored one-time badge, unchanged mission XP, replay protection and honest unavailable-next-chapter navigation. Shared fixture checks also cover save retry and session/load recovery.

Fixtures use mocked Firestore; they do not establish live student behavior, live security enforcement, read costs or learning effectiveness. Actual signed-in full-chapter verification is still required after publication.

Next operational task: ordered publication and actual student checks when database access returns. Next content chapter: Chapter 8, Christianity and Religious Institutions. That chapter should treat religious history respectfully without requiring students to practise a faith.
