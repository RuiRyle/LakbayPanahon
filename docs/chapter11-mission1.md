# Chapter 11 Mission 1: Communities Beyond Effective Spanish Control

> Publication update - 28 October 2026: This release is now published to Firestore, backed up and field-verified. See [Chapters 7-14 publication](chapters7-14-publication.md). Older status sections below record the original authoring stage.

## Status and learning structure

Built locally on 28 October 2026. Unpublished. No Firestore requests, writes, student accounts or Hosting deployment. Earlier releases and Chapter 10 must be published first. Independent historical, teacher, curriculum alignment and Grade 5 readability review remain pending.

This release creates partial Chapter 11, Indigenous Autonomy and the Limits of Colonial Rule, in Era 3. The roadmap has four missions in this chapter. Six scenes introduce claims versus effective control, local decision-making, contact versus conquest, connected change, source comparison and an all-topic recap. Each has three clues, a decision, feedback, vocabulary and authored Explain help. Five accessible SVG guides are modern labelled clue cards, not territorial maps, original treaties or universal council diagrams.

Ifugao research supplies a bounded case of resisting conquest while acting, adapting and engaging with economic opportunities. Mountains are not treated as the sole explanation, resistance as complete isolation, or autonomy as no rules or equal power for everyone. Later missions will develop Muslim polities, Cordillera histories and different forms of response in more detail.

A limited Sulu example distinguishes claims, treaty wording and a military post from day-to-day authority beyond it. Saleebys 1908 work is read as a dated account produced in an American colonial setting, not a neutral voice for every community. The mission does not repeat derogatory language, graphic material or stereotypes from the work. It does not settle present-day legal or territorial questions or infer timeless boundaries.

Fictional source desks and comparison cards are labelled models. Students are not asked to disclose ancestry, faith or family identity. No fighting reenactment or religious practice is required. Colonial labels are not cultural rankings. Community knowledge and archaeology can help investigate gaps without being treated as one universal voice or an unchanged statement across centuries.

Five medium main-quiz questions, one per topic, pass at three correct. Ten main-bank questions provide two finite variants per topic; ten separate easy/hard practice questions retain mapped lesson review and existing practice policy. Configured reward: 50 XP and a symbolic Autonomy Evidence Journal through existing one-time reward behavior. Runtime instructional data comes from Firestore after publication; JSON is authoring input.

## Files and publication

- data/chapter11-mission1-lessons.json and data/chapter11-mission1-assessments.json: authored inputs.
- functions/build-chapter11-mission1.cjs: repeatable local builder.
- data/chapter11-mission1-migration.json: 30 creates, including the partial chapter, and one guarded era description.
- functions/apply-chapter11-mission1.cjs: original project only; dry run by default; --apply commits atomically with rollback snapshot and field readback.

Eight publication prerequisites require active Chapter 10, its challenge, badge and five missions. The era description must match the Chapter 10 challenge release. Student access requires owned Chapter 10 completion; continuation offers Chapter 11 only with ready content and an active mission. No learner records, chapter badge or challenge are written. Missions 2-4 and its challenge remain pending. Passing this mission does not complete Chapter 11.

After availability and earlier publication are confirmed, inspect the apply scripts dry run, run with --apply, then repeat without flags to verify zero changes. Review collisions and changed expected fields rather than bypassing guards. Live preflight, commit/readback and an authenticated walkthrough remain pending.

## Sources and limits

- [UCLA Anthropology: Indigenous Archaeology in the Philippines, 2022](https://anthro.ucla.edu/publication/indigenous-archaeology-in-the-philippines-decolonizing-ifugao-history/): research summary of Stephen Acabado and Marlon Martins work, covering Ifugao resistance, active strategies, economic connections and community collaboration. The mission does not date all terraces or use the summary as proof of every communities institutions.
- [Najeeb M. Saleeby: The History of Sulu, 1908](https://www.gutenberg.org/cache/epub/41771/pg41771-images.html): the concluding discussion of Spanish jurisdiction and the collection of treaty and trade accounts support a bounded comparison of asserted and actual authority. The authors conclusions and colonial vocabulary are not adopted as universal facts. Treaty texts, translations and the authors later narrative are distinct evidence. The mission does not reconstruct every treaty clause or current sovereignty claim.

Additional Cordillera sources were explored but not used for detailed claims: NCCA retrieval returned 502; NSF full text timed out; a previously indexed National Museum PDF returned 404. The available UCLA research summary and dated Sulu account are the instructional sources retained in this plan. Introductory examples do not establish exhaustive regional coverage or classroom learning effectiveness.

## Verification

All 269 non-emulator unit checks passed. The six-scene Chrome fixture passed rendering, clues, decisions, authored help, image loading and recovery. Tests cover topic coverage, finite variants, separate adaptive practice, mapped review, autonomy/contact/source limits, owned Chapter 10 gating, honest continuation and guarded descriptions. Migration syntax passed. Mocked fixtures do not replace live security or actual student validation.

Next: Chapter 11 Mission 2, Muslim Polities and Communities in Mindanao and Sulu.
