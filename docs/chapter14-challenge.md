# Chapter 14 final challenge

> Publication update - 28 October 2026: This release is now published to Firestore, backed up and field-verified. See [Chapters 7-14 publication](chapters7-14-publication.md). Older status sections below record the original authoring stage.

Contributions and Wider Belonging Evidence Challenge. Locally authored and checked on 2026-10-28; not published to Firestore or Hosting.

Ten activities connect all five missions: five evidence decisions and five matching tasks. Each evidence decision requires both a supporting lesson clue and its supported conclusion, counted together as one activity. Seven of ten is a pass. Matching includes contributions/outcomes/remembrance, named regional settings, agency/autonomy/collaboration, evidence for cooperation or belonging, and dated local-to-wider public concerns.

The existing challenge flow requires the learner's own five prior mission completions. Passing awards the Contributions and Wider Belonging Investigator chapter badge once through existing completion behavior. No additional chapter XP or era completion reward is configured. Saved drafts, failure, retry and replay use existing behavior. With no next chapter actually ready, continuation returns to Explore Chapters rather than promising unavailable content.

Every evidence card references an existing active scene clue rather than duplicating its discovery text. Correct clue and answer positions rotate. Sources are inherited from the five mission plans; no new historical cases are introduced. The challenge preserves limits on movement dates versus lifespans, common place versus identical events, a named Indigenous case versus every community, cooperation versus universal agreement, and dedication versus every readers response. It does not test graphic details or treat accusations as proof.

Authoring input: data/chapter14-challenge-content.json. Rebuild with node functions/build-chapter14-challenge.cjs. Output: data/chapter14-challenge-migration.json. Runtime educational data remains in Firestore; local files are authoring/publication inputs.

Publication plan: 14 writes, comprising one challenge, ten activities, one badge and two guarded catalog-description updates. Eighteen prerequisites require the five active missions and the exact active scene-clue lists referenced. The earlier mission plans must be published in order first. No learner records are written by the content migration. The apply script was syntax checked only; neither apply nor its default dry run was executed because even the dry run would read live Firestore.

Validation: 349 non-emulator local checks passed. A mocked-data Chrome walkthrough passed all ten authored activities, the five-mission gate, two-part evidence grading, draft resume, 60-percent fail/70-percent pass, one-time badge and unavailable-next-content fallback. These checks do not verify deployed database permissions or authenticated operation.

Chapter 14 now has five locally authored missions and its challenge. This is a content-authoring milestone, not a declaration that the project or live student workflow is complete. Pending: independent teacher/curriculum review, cross-chapter content and progression review, ordered Firestore publication, authenticated end-to-end walkthrough and Hosting deployment. Next priority is a cross-chapter review and publication inventory rather than inventing another chapter outside the supplied roadmap.
