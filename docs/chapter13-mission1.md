# Chapter 13 Mission 1

> Publication update - 28 October 2026: This release is now published to Firestore, backed up and field-verified. See [Chapters 7-14 publication](chapters7-14-publication.md). Older status sections below record the original authoring stage.

Economic and Political Changes in the 18th Century. Locally authored and checked on 2026-10-28; not published to Firestore or Hosting.

Six scenes introduce century boundaries, Manila-Acapulco trade continuing through the period, temporary British occupation in Manila, government rules shaping production, and the difference between decision, implementation and experience. Five modern labelled diagrams support clue exploration, decisions and authored Explain help. This is a selected introduction; later missions cover reforms and ideas more closely.

Sources:

- [Intramuros Administration](https://intramuros.gov.ph/2015/01/04/intramuros/): trade-route period and temporary occupation. A claim about Manila is not extended to every community.
- [National Tobacco Administration historical account](https://www.nta.da.gov.ph/tobacco/): revenue goals, compulsory production and quotas. Only historical passages are used; promotional language, stereotypes and graphic punishment are excluded. The lesson does not encourage tobacco use.
- [NHCP monopoly marker](https://philhistoricsites.nhcp.gov.ph/registry_database/abolition-of-tobacco-monopoly/): decree in 1780, establishment in March 1782 and abolition in 1882. The marker text was available in indexed results; direct retrieval timed out. Independent source review remains required. The later abolition date is explicitly outside the mission period.

The quiz uses five medium questions, one per topic, selected from ten equivalent variants. Ten separate easy/hard practice questions use the existing adaptive evidence policy. Passing requires three correct; the finite bank cannot promise unlimited unseen retries. The existing one-time mission reward is configured as 50 XP and a Century Evidence Journal token.

Authoring files: data/chapter13-mission1-lessons.json and data/chapter13-mission1-assessments.json. Build with node functions/build-chapter13-mission1.cjs. Runtime content continues to come from Firestore, not these local authoring inputs.

Publication plan: 31 changes, 30 creates and one guarded era-description update. Eight prerequisites require the Chapter 12 release, its challenge, badge and all five missions. Existing journey logic requires the learner's own Chapter 12 completion. This partial chapter has no completion badge or challenge yet. No learner data is changed by the content migration. The apply script was syntax checked only; even its default dry run would read live Firestore.

Validation: 311 non-emulator local checks passed. The mocked-data Chrome walkthrough passed all six scenes, clue exploration, decisions, authored help, images and recovery. Teacher/curriculum review, authenticated live verification, ordered publication and Hosting deployment remain pending.

Next: Chapter 13 Mission 2, Colonial Reforms and Their Effects.
