# Chapter 6: Colonial Rule Evidence Challenge

> Publication update ? 2026-10-28: This release is now published to Firestore with guarded writes, backup and field readback. See [Chapter 6 publication verification](chapter6-publication.md). Earlier status sections below describe the original authoring stage.

## Status

Built locally on 28 October 2026. **Not published.** No live Firestore requests, writes or temporary student accounts were used. Database availability was not rechecked during this task. Chapter 6 missions and earlier pending Chapter 5 releases must be published before this challenge. Hosting was not deployed.

## Student activities

Students must complete all four Chapter 6 missions to unlock ten equally weighted activities:

1. Select the clue showing that Cebu's history preceded the Spanish settlement, then select its supported conclusion.
2. Connect regional merchants with existing trade rather than treating geography as the only cause.
3. Check a universal-enforcement claim against evidence of actual reach.
4. Keep the later 1726 Sulu diplomacy example separate from the 1565 expedition.
5. Distinguish a sponsor's economic aim from an achieved result.
6. Check a universal-household-burden claim using place-specific and time-specific evidence.
7. Match departure, settlement and return events in the Legazpi investigation.
8. Compare Cebu's 1565 and Manila's 1571 colonial developments with existing communities.
9. Match negotiation, adaptation and resistance with their meanings.
10. Sort an explicitly fictional aim, method and effect example.

Activities 1-6 use the existing two-part evidence interface. Both the correct supporting clue and conclusion are required to earn that activity. Cards reference actual lesson discoveries in Firestore; correct card positions and answer letters vary. Other cards address different questions. Saving discoveries in the journal is optional; all cards are available without it.

Activities 7-10 use the existing matching interface. All three pairs must be correct to earn the activity. Partial credit and drag-and-drop ordering are not claimed. Feedback explains the connection, not merely the correct letter.

Passing requires at least 7 of 10 correct, or 70%. Failure does not complete the chapter or award its badge. Existing draft logic preserves submitted answers and partial clue/conclusion selections. Existing recovery behavior offers save retry without making the student retake an already completed challenge.

## Badge and navigation

The authored badge is **Colonial History Investigator**. Existing reward transactions award it once following all mission completions and a passing challenge. The challenge configures 0 additional XP, preserving the existing mission rewards rather than adding an extra chapter XP award. Replay does not duplicate the badge.

The existing completion screen acknowledges the saved chapter and badge. With Chapter 7 unavailable, it offers Explore Chapters. The shared continuation logic can offer a next chapter only when active, ready content with active missions exists. This change does not publish or unlock an unfinished Chapter 7 and does not change independent-era access.

## Authoring and guarded publication

- `data/chapter6-challenge-content.json`: challenge, badge and activity authoring inputs.
- `functions/build-chapter6-challenge.cjs`: resolves lesson references and builds the migration.
- `data/chapter6-challenge-migration.json`: 14 writes: challenge, ten activities, badge and two guarded catalog descriptions.
- `functions/apply-chapter6-challenge.cjs`: dry run by default; original project only, atomic commit with backup/preconditions and readback when `--apply` is supplied.

Sixteen publication prerequisites check all four active mission records and the exact clue lists in referenced active scenes. The era and chapter descriptions must match the Mission 4 release. This protects against publishing a challenge before its lessons or silently grading against changed clues. No learner collection is in the plan. Runtime challenge data and source references come from Firestore; local JSON is for authoring.

Publish earlier pending Chapter 5 releases first, then Chapter 6 Missions 1, 2, 3 and 4 in order. Once those prerequisites and database availability are confirmed:

```powershell
node functions/apply-chapter6-challenge.cjs
node functions/apply-chapter6-challenge.cjs --apply
node functions/apply-chapter6-challenge.cjs
```

The repeat dry run should report zero changes. Review any changed expected field, missing prerequisite or creation collision rather than bypassing guards. Live preflight, commit, readback and signed-in challenge walkthrough remain pending.

## Verification

All 181 non-emulator unit checks passed. Tests validate ten unique ordered activities, four-mission coverage, lesson references, exact prerequisite clue lists, both-part grading, varied correct card positions, unique matching pairs, 70% threshold and guarded descriptions.

The Chrome fixture verifies all four mission prerequisites, all ten authored tasks, clue-plus-conclusion grading, restored partial evidence selections, 60% failure versus 70% success, the authored badge, unchanged mission XP, replay protection and honest navigation when the next chapter is unavailable. The shared fixture also exercises save retry and session/load recovery. Builder and migration syntax checks passed.

Local fixtures use mocked Firestore. They do not establish live database security behavior, live read costs or learning effectiveness. A signed-in full Chapter 6 walkthrough remains necessary after publication.

## Sources and review limits

The challenge reuses the lesson evidence and sources documented in `docs/chapter6-mission1.md`, `docs/chapter6-mission2.md`, `docs/chapter6-mission3.md` and `docs/chapter6-mission4.md`. Source URLs are retained in the migration. No new historical speech, identity claim or casualty count is introduced. The household sorting task is explicitly fictional and does not assert a burden shared by all families.

Independent historical, teacher, curriculum alignment and Grade 5 readability review remain pending. Passing this challenge is a project learning milestone, not evidence of complete mastery of colonial Philippine history.

Next operational task: publish pending content in order when database access returns, then verify student progression and rewards once through actual pages. The next content chapter is Chapter 7: Colonial Government and Administration.
