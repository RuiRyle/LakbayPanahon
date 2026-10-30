# Chapter 13 final challenge

> Publication update - 28 October 2026: This release is now published to Firestore, backed up and field-verified. See [Chapters 7-14 publication](chapters7-14-publication.md). Older status sections below record the original authoring stage.

Reforms and Ideas Evidence Challenge. Locally authored and verified on 2026-10-28; not published to Firestore or Hosting.

Ten activities connect the four missions: six evidence decisions and four matching tasks. Students investigate century boundaries, decree versus implementation, government income versus household wellbeing, charter dates, newspaper contents and the limits of shared-grievance claims. Matching covers economic/political terms, reform institutions, international documents and local responses. Each evidence decision requires both a supporting lesson clue and its supported conclusion. Seven complete activities out of ten is a pass.

The existing flow requires the learner's own four mission completions. The Reforms and Ideas Investigator badge is awarded once through existing chapter completion behavior. No additional chapter XP is configured. Draft resume, failure, retry and replay use the existing challenge flow. Until Chapter 14 is actually ready, continuation returns to Explore Chapters rather than promising unavailable content.

Authoring input: data/chapter13-challenge-content.json. Rebuild with node functions/build-chapter13-challenge.cjs. Generated plan: data/chapter13-challenge-migration.json. Runtime curriculum continues to come from Firestore, not the local authoring inputs.

Every evidence card references an existing scene clue. The six tasks rotate clue and answer positions. Sources are inherited from the four mission plans; the challenge introduces no new historical cases. It keeps official steps separate from effects, founding dates separate from contents, and similar concerns separate from proof of coordination. Evidence must support the claim rather than merely concern the same broad period.

Publication plan: 14 writes, comprising a challenge, ten activities, one badge and two guarded catalog-description updates. Eighteen prerequisites require all four active missions and the exact active scene-clue lists used by evidence tasks. Publish earlier mission plans in order first. No learner records are written by the migration. The apply script was syntax checked only; neither apply nor its default dry run was executed because even the dry run would read live Firestore.

Validation: 326 non-emulator local checks passed. A mocked-data Chrome walkthrough passed the four-mission gate, all ten authored activities, two-part evidence grading, draft resume, 60-percent fail/70-percent pass, one-time badge and unavailable-content fallback. These checks do not verify live database permissions or deployed behavior.

Pending: independent teacher/curriculum review, ordered Firestore publication, authenticated live walkthrough and Hosting deployment.

Next content task: Chapter 14 Mission 1, Contributions and Lessons of Early Resistance.
