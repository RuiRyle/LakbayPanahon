# Chapter 12 Mission 2: Early Regional Uprisings

> Publication update - 28 October 2026: This release is now published to Firestore, backed up and field-verified. See [Chapters 7-14 publication](chapters7-14-publication.md). Older status sections below record the original authoring stage.

## Status and learning structure

Built locally on 28 October 2026. Unpublished. No Firestore requests, writes, student accounts or Hosting deployment. Earlier releases and Chapter 12 Mission 1 must be published first. Historical, teacher, curriculum alignment and Grade 5 readability review remain pending.

Six scenes introduce chronology and setting, Tamblot in Bohol, Sumuroy in Palapag/Samar, Basi in Ilocos, comparison of sources and cases, and a five-topic recap. Each has three clues, a decision, feedback, vocabulary and authored Explain help. Five accessible SVG guides include a not-to-scale timeline showing selected beginnings in 1621, 1649 and 1807. It is not an exhaustive uprising chronology, an original source or evidence of a shared command.

The Tamblot case retains a bounded religious concern and the limits of biographical evidence. No supernatural assertion is presented as a verified event, no speeches are invented and no student performs a ritual. Sumuroys marker names forced labor and abuses and describes spread, without making every affected resident a participant. The Basi case distinguishes the 1807 event from its 1821 painting series; there is no alcohol activity, graphic artwork reproduction or detailed battle reenactment.

The selected cases are not all early uprisings, one coordinated event, or evidence that every participant already shared a single modern national program. Similar opposition does not prove identical aims. A leader or place name is not every residents full story. Fictional source cards remain teaching models rather than participant registers or original testimonies. Later missions will develop religious/political concerns, regional participation and outcomes further.

Five medium quiz questions, one per topic, pass at three correct. Ten main-bank questions provide two finite variants per topic; ten separate easy/hard practice questions retain mapped lesson review and existing practice policy. Configured reward: 50 XP and a symbolic Regional Uprisings Evidence Journal through existing one-time reward behavior. Runtime instructional content comes from Firestore after publication; JSON is authoring input.

## Files and guarded publication

- data/chapter12-mission2-lessons.json and data/chapter12-mission2-assessments.json: authored inputs.
- functions/build-chapter12-mission2.cjs: repeatable local builder.
- data/chapter12-mission2-migration.json: 29 creates and two guarded catalog descriptions.
- functions/apply-chapter12-mission2.cjs: original project only; dry run by default; --apply commits atomically with rollback snapshot and planned-field readback.

Eight prerequisites retain the earlier publication chain and require active Chapter 12 Mission 1. Catalog descriptions must match that release. Student access requires owned Chapter 12 Mission 1 completion under the existing independent-era policy. No learner records, challenge or chapter badge are written. Missions 3-5 and the challenge remain pending. Passing Mission 2 does not complete Chapter 12.

After availability and earlier publication are confirmed, inspect the apply scripts dry run, run with --apply, then repeat without flags to verify zero changes. Review collisions or changed expected fields rather than bypassing guards. Live preflight, commit/readback and an authenticated walkthrough remain pending.

## Sources and limits

- [NCCA CulturEd: Tamblot](https://philippineculturaleducation.com.ph/tamblot/): Bohol, 1621, the named role and religious concern, and limited biography. Graphic details and claims of supernatural success are not reproduced. The entry is not every participants private testimony.
- [NHCP: Agustin Sumuroy marker](https://philhistoricsites.nhcp.gov.ph/registry_database/agustin-sumuroy/): Palapag, 1 June 1649, forced labor and abuses, and spread beyond the initial setting. A later marker does not supply every local action, participant list or exact words. Graphic death details are omitted.
- [CCP Encyclopedia: Basi Revolt](https://epa.culturalcenter.gov.ph/3/82/2142/): the 1807 monopoly connection and later 1821 depiction. Graphic panel descriptions and detailed event chronology are not reproduced; the entry contains a panel-date statement that is not used for the introductory timeline. No source artwork or wording is copied.

A later entry, commemorative marker and art-history account have different purposes. This introduction does not replace primary-record comparison, regional histories or classroom review. Learning effectiveness remains unverified.

## Verification

All 292 non-emulator unit checks passed. The six-scene Chrome fixture passed rendering, clues, decisions, authored help, images and recovery. Tests cover topic coverage, finite variants, separate practice, review mappings, distinct dates/cases, source and participation limits, owned prior completion and guarded descriptions. Migration syntax passed. Mocked fixtures do not replace live security or actual student validation.

Next: Chapter 12 Mission 3, Religious and Political Revolts.
