# Chapter 10 Mission 2: Education, Language, and Religious Life

> Publication update - 28 October 2026: This release is now published to Firestore, backed up and field-verified. See [Chapters 7-14 publication](chapters7-14-publication.md). Older status sections below record the original authoring stage.

## Status and learning structure

Built locally on 28 October 2026. Unpublished. No Firestore requests, writes, student accounts or Hosting deployment. Earlier releases and Chapter 10 Mission 1 must be published first. Historical, teacher, curriculum alignment and Grade 5 readability review remain pending.

Six scenes cover earlier community learning and institutional settings, the 1593 Doctrina Christiana, language and translation, the 1863 education policy, religious life and an all-topic report recap. Each includes three clues, a decision, feedback, vocabulary and authored Explain help. Five accessible SVG guides are modern labelled clue cards, not reproduced religious pages, school registers or original manuscripts.

The mission separates production of a book from circulation, reading, understanding and acceptance. Spanish and Tagalog in one material do not establish everyones language ability. The 1863 policy is distinguished from actual implementation, access, attendance and demonstrated learning. Earlier communities are not described as having no knowledge, and later schools do not automatically erase community learning.

Religious institutions and teaching are studied as historical subjects. Students do not recite religious passages, adopt a belief, perform ceremonies or disclose personal/family religion. A recorded public activity is not every participants private belief. Local interpreters and missing voices remain visible. The neutral translation exercise and source desks are fictional models, not invented historical conversations.

Five medium quiz questions, one per topic, pass at three correct. Ten main-bank questions provide two finite variants per topic; ten separate easy/hard practice questions retain mapped lesson review and existing practice policy. Configured reward: 50 XP and the symbolic Learning History Evidence Journal through existing one-time reward behavior. Runtime instructional content comes from Firestore after publication; JSON is authoring input.

## Files and publication

- data/chapter10-mission2-lessons.json and data/chapter10-mission2-assessments.json: authored inputs.
- functions/build-chapter10-mission2.cjs: repeatable local builder.
- data/chapter10-mission2-migration.json: 29 creates and two guarded catalog description updates.
- functions/apply-chapter10-mission2.cjs: original project only; dry run by default; --apply commits atomically, saves a rollback snapshot and verifies planned fields.

Nine prerequisites retain the earlier publication chain and require active Chapter 10 Mission 1. Catalog descriptions must match that release. Student access requires owned Chapter 9 completion and owned Chapter 10 Mission 1 completion within the existing path. No learner records, challenge or chapter badge are written. Missions 3-5 and the chapter challenge remain pending; passing Mission 2 does not complete Chapter 10.

After availability and earlier publication are confirmed, inspect the apply scripts dry run, run with --apply, then repeat without flags to verify zero changes. Review collisions and expected-field mismatches rather than bypassing guards. Live preflight, commit/readback and an authenticated walkthrough remain pending.

## Sources and limits

- [Library of Congress: Doctrina Christiana catalog](https://www.loc.gov/item/48031307/): named material, Manila, 1593, Spanish and Tagalog. Direct item retrieval returned 403 in this session; catalog search text and the Librarys related historical discussion supported the limited description. No page transcription or broad literacy statistics are introduced.
- [DepEd Ozamiz: Historical Perspective of the Philippine Educational System](https://ozamiz.deped.gov.ph/history/): pre-colonial learning, religious orientation of colonial institutional education and the 1863 policy. The lesson does not adopt the overbroad description that earlier learning had no methods or that every earlier tutor was replaced. It also does not infer universal immediate attendance from a decree.
- [Library of Congress: Catholicism during the Spanish Colonial Period](https://blogs.loc.gov/international-collections/2018/07/catholicism-in-the-philippines-during-the-spanish-colonial-period-1521-1898/): institutions, local intermediaries and context-dependent responses, including curator Joshua Kuehs follow-up explanation. These sources do not reveal every learners private beliefs or establish identical experiences across the colonial period.

This introductory selection is not a complete history of every regional school, language or faith community. Curriculum alignment and classroom learning effectiveness remain unverified.

## Verification

All 250 non-emulator unit checks passed. The six-scene Chrome fixture passed rendering, clue exploration, decisions, authored help, image loading and recovery. Tests cover topic coverage, finite variants, separate practice, mapped review, dated material/policy limits, respectful religious-history wording, owned prior completion and guarded descriptions. Migration syntax passed. Mocked fixtures do not replace live security or actual student validation.

Next: Chapter 10 Mission 3, Social Hierarchies and Everyday Experiences.
