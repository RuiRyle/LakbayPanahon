# Chapter 15 final evidence challenge

Published and every planned field read back on 28 October 2026 in
lakbaypanahon-1797e. Backup: backups/chapter15-challenge-1793195078214.json.

Connections and Reform Evidence Challenge contains ten activities: five decisions
requiring a supporting lesson clue and its conclusion, and five matching tasks.
Seven correct activities out of ten passes. Both parts of an evidence decision
count together as one activity; every pair must fit for a matching activity.

The tasks connect all five Chapter 15 missions: trade/travel and access, public
participation, parish reform, Cavite accounts and reform voices. Evidence cards
reference actual active lesson clues. They do not require students to save clues
to the evidence journal. The Cavite comparison uses the published enrichment,
not the superseded original scene. Correct option and clue positions rotate.
No new historical case or graphic detail is introduced.

Normal access requires the learner's own completion of all five missions. Passing
uses the existing completion flow to award the History Connections Investigator
chapter badge once. The chapter challenge has zero additional XP, preserving the
mission reward policy. Failing, retrying, saving a draft and replaying use existing
behavior; the browser check verifies no badge at 60%, completion/badge at 70%,
and no duplicate badge or mission XP on replay. Local exploration preview remains
enabled and retains its existing unsaved completion/reward behavior.

With no next chapter ready, the existing continuation returns to Explore Chapters
rather than promising an unavailable chapter. Chapter 15 now has five published
missions, a final challenge and a chapter badge. That is an authored chapter
sequence, not certification of complete MATATAG coverage or learning effectiveness.
Independent historical, teacher and Grade 5 comprehension review remains pending.

## Files and publication safeguards

- data/chapter15-challenge-content.json: authored challenge, badge and tasks.
- functions/build-chapter15-challenge.cjs: resolves current source clues and builds
  data/chapter15-challenge-migration.json.
- functions/apply-chapter15-challenge.cjs: dry run by default; --apply publishes.
- tests/chapter15-challenge.test.cjs and chapter15-challenge-browser.cjs: data,
  grading, prerequisites, completion and recovery checks.

Runtime curriculum remains in Firestore. The plan creates twelve documents
(challenge, ten questions and badge) and updates the chapter/era descriptions.
Eighteen prerequisites guard the five missions and referenced lesson clues.
No learner records are included in the publication batch. The publication audit
now places the Cavite enrichment immediately after its original mission, before
building dependencies on the revised clues. Original publication plans are kept.

418 local checks and the publication-chain audit passed. The authored challenge
browser check passed the mission gate, ten activities, two-part evidence grading,
draft recovery, fail/pass boundary, once-only badge and unavailable-next-content
fallback. These are mocked browser checks, not live learner acceptance testing.
Live dry run, atomic publication, backup and every-field readback passed. No Hosting
deployment was performed. Refresh learning content in Live Server to try it.
