# Era 4 Chapter 12 Mission 1: Causes and Forms of Resistance

> Publication update - 28 October 2026: This release is now published to Firestore, backed up and field-verified. See [Chapters 7-14 publication](chapters7-14-publication.md). Older status sections below record the original authoring stage.

## Status and learning structure

Built locally on 28 October 2026. Unpublished. No Firestore requests, writes, student accounts or Hosting deployment. Earlier pending releases remain necessary before applying this migration. Historical, teacher, curriculum alignment and Grade 5 readability review remain pending.

This release creates Era 4, Resistance and the Beginnings of National Consciousness, and partial Chapter 12, Early Resistance to Spanish Colonial Rule. The roadmap has five missions in Chapter 12. Only Mission 1 is included; Chapters 13-14 and all later rewards remain unbuilt.

Six scenes distinguish grievances and causes, policy effects, petitions versus uprisings, participation and varied concerns, causes/actions/outcomes, and an all-topic recap. Every scene has three clues, a decision, feedback, vocabulary and authored Explain help. Five accessible SVG guides are modern labelled clue cards, not original testimonies, participant registers or graphic artwork.

The Palapag/Sumuroy case connects forced labor and abuses with the uprising beginning 1 June 1649. The Basi case introduces the monopoly connection in 1807 without claiming a complete chronology or every participants motive. The 1698 Bacolor petition distinguishes a formal request for relief from an uprising; petitions are not automatically labelled independence movements or assumed successful.

A leader, location, religion or occupation does not explain every participants motives. Affected residents are not automatically participants. A grievance, aim and outcome are different claims. Later markers and paintings are not automatically eyewitness transcripts. These introductory cases do not project one fully shared national program onto all early resistance.

Students are not asked to disclose identity, select targets, reenact fighting or punishment, or use alcohol. No graphic Basi artwork is reproduced. Harm is acknowledged without game points for harming people. Fictional report, sorting and source-desk cards are labelled as models. Uncertain outcomes are not filled with invented success or failure.

Five medium quiz questions, one per topic, pass at three correct. Ten main-bank questions provide two finite variants per topic; ten separate easy/hard practice questions retain mapped lesson review and existing practice policy. Configured reward: 50 XP and a symbolic Causes and Forms Evidence Journal through existing one-time reward behavior. Runtime content comes from Firestore after publication; JSON is authoring input.

## Files, access and publication

- data/chapter12-mission1-lessons.json and data/chapter12-mission1-assessments.json: authored inputs.
- functions/build-chapter12-mission1.cjs: repeatable local builder.
- data/chapter12-mission1-migration.json: 31 creates, including the new era and partial chapter; no existing catalog descriptions are overwritten.
- functions/apply-chapter12-mission1.cjs: original project only; dry run by default; --apply commits atomically with rollback snapshot and field readback.

Seven publication prerequisites require active Chapter 11, its challenge, badge and four missions. These are release-order checks, not a new student lock between eras. Existing independent-era access lets students enter the first ready chapter of Era 4 without completing Era 3. Passing Mission 1 does not complete Chapter 12. Missions 2-5, final challenge and badge remain pending. No learner records are written by the migration.

Publish earlier releases in order, including the Chapter 11 challenge. After availability and prerequisites are confirmed, inspect the apply scripts dry run, run with --apply, then repeat without flags to verify zero changes. Review collisions rather than bypassing guards. Live preflight, commit/readback and an authenticated walkthrough remain pending.

## Sources and limits

- [NHCP: Agustin Sumuroy marker](https://philhistoricsites.nhcp.gov.ph/registry_database/agustin-sumuroy/): Palapag, forced labor and abuses, and 1 June 1649. The later marker does not establish every participants full motive.
- [CCP Encyclopedia: Basi Revolt](https://epa.culturalcenter.gov.ph/3/82/2142/): the connection between the 1807 revolt and government monopoly, described in the entry for the later paintings. Only the bounded policy connection is used; graphic descriptions and uncertain detailed chronology are not reproduced. No artwork or source wording is copied.
- [Grace Liza Y. Concepcion, They Are Not Foreigners, UP Diliman summary](https://history.upd.edu.ph/publications/they-are-not-foreigners/): the 1698 Bacolor request concerning tribute-collection duties. The summary supports the distinction of a formal request; it is not a full petition transcript or proof of every requested outcome.

The introduction is not comprehensive coverage of early regional, religious or political resistance. Later missions must develop cases, participation and historical significance. Classroom learning effectiveness remains unverified.

## Verification

All 288 non-emulator unit checks passed. The six-scene Chrome fixture passed rendering, clues, decisions, authored help, images and recovery. Tests cover topic coverage, finite variants, separate practice, review mappings, named dates, grievance/action/outcome boundaries, independent-era access and no premature chapter completion. Migration syntax passed. Mocked fixtures do not replace live security or actual student validation.

Next: Chapter 12 Mission 2, Early Regional Uprisings.
