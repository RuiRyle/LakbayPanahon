# Chapter 5 evidence challenge and badge

> Publication update ? 2026-10-28: This release is now published to Firestore with guarded writes, backup and field readback. See [Chapter 6 publication verification](chapter6-publication.md). Earlier status sections below describe the original authoring stage.

## Status

Built locally on 28 October 2026. **Not published to Firestore.** The original project's Mission 3 preflight still returns HTTP 429, `Quota exceeded`. No challenge commit or real signed-in Chapter 5 challenge walkthrough was attempted. Live content remains Missions 1-2; Missions 3-4 and this challenge are ready locally. Website Hosting was not deployed.

## What students do

Complete all four Chapter 5 missions to unlock the First Encounters Evidence Challenge. It contains ten equally weighted activities:

1. Match a commercial-motive clue with a supported conclusion.
2. Check the claim that assistance at Homonhon meant surrender.
3. Check an unsupported claim of universal conversion using the Limasawa lesson.
4. Identify the evidence of Lapulapu's refusal in the dispute over authority.
5. Connect shoreline conditions with the restricted approach at Mactan.
6. Check a claim that one settlement established immediate control everywhere.
7. Match motive, outcome and perspective with their meanings.
8. Connect selected encounter places with their evidence.
9. Separate causes before Mactan, its immediate outcome and subsequent events.
10. Order selected later expedition departures by matching positions with dated events.

For activities 1-6, both the selected supporting clue and the conclusion must be correct; together they count as one activity. The choices include unrelated lesson clues so students must connect evidence to the particular claim. Correct card positions and conclusion letters vary. Cards load the actual authored lesson clues from Firestore. Saving clues in the evidence journal is optional, not a prerequisite.

For activities 7-10, all three matches must be correct to earn that activity. The chronology interaction uses the existing matching interface; it does not claim to be drag-and-drop.

Passing requires 70%, or at least 7 of 10 activities. The existing review explains the evidence connections. An unsuccessful attempt does not complete the chapter or grant its badge. Existing draft behavior preserves submitted answers and partial evidence selections. A save failure uses the existing save-retry behavior without requiring a retake.

## Rewards and continuation

The authored badge is **First Encounters Investigator**. Existing chapter reward transactions award it once after all four missions and a passing challenge. The challenge configures 0 XP, preserving mission XP instead of adding a second reward for the same learning. Replaying does not duplicate the badge.

The existing completion flow displays the acknowledged chapter result and badge. While Chapter 6 has no available content, it offers Explore Chapters. It offers a next chapter only when existing availability checks find an eligible active chapter with active missions. This change does not publish Chapter 6 or change independent-era access.

## Authoring and guarded publication

- `data/chapter5-challenge-content.json`: authoring source for challenge settings, badge, six evidence tasks and four matching activities.
- `functions/build-chapter5-challenge.cjs`: resolves references against the four mission content plans and produces the Firestore migration.
- `data/chapter5-challenge-migration.json`: 14 writes: challenge, ten activities, badge and two catalog description updates.
- `functions/apply-chapter5-challenge.cjs`: original database only, dry run by default, atomic commit with backup/preconditions and field-by-field readback when `--apply` is supplied.

Sixteen preflight prerequisites verify all four active mission records and the active source scenes' exact clue lists. Catalog descriptions must match the Mission 4 release. This prevents publishing the challenge against missing missions or unreviewed changed source clues. No learner collection is included in the publication plan. Runtime instructions, questions, references and badge data come from Firestore; local JSON is for authoring.

When Firestore is available again, publish in order:

```powershell
node functions/apply-chapter5-mission3.cjs
node functions/apply-chapter5-mission3.cjs --apply
node functions/apply-chapter5-mission4.cjs
node functions/apply-chapter5-mission4.cjs --apply
node functions/apply-chapter5-challenge.cjs
node functions/apply-chapter5-challenge.cjs --apply
node functions/apply-chapter5-challenge.cjs
node tests/chapter5-challenge-live-walkthrough.cjs
```

Each apply verifies its planned fields. The repeat challenge dry run should report zero changes. Do not remove precondition guards to force a publication after a mismatch; review any edited curriculum first.

## Completed verification

All 154 non-emulator unit checks pass. The new Chrome fixture verifies the four-mission gate, all ten authored tasks, two-part evidence grading, restored partial choices, 60% failure versus 70% success, one-time authored badge, unchanged mission XP and honest completion navigation. Its shared checks also cover save retry and session/load recovery.

The prepared real-student walkthrough completes the four missions and the challenge through actual controls on one isolated temporary account, checks refreshed drafts and replay protection, then removes the temporary account and its owned records. It has not run because the prerequisite missions remain unpublished and Firestore is quota-blocked. Local browser fixtures use mocked Firestore and do not establish live security behavior or learning effectiveness.

## Review and source limits

Tasks reuse the sources and lesson evidence documented in `docs/chapter5-mission1.md`, `docs/chapter5-mission2.md`, `docs/chapter5-mission3.md` and `docs/chapter5-mission4.md`. Source URLs are retained on the published-content plan. No new historical speech or exact combat reenactment is introduced. Independent historical, teacher, curriculum alignment and Grade 5 review remain pending. The challenge is a learning assessment, not proof of complete Philippine-history mastery.
