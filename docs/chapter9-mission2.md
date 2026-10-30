# Chapter 9 Mission 2: Polo y Servicios and Bandala

> Publication update - 28 October 2026: This release is now published to Firestore, backed up and field-verified. See [Chapters 7-14 publication](chapters7-14-publication.md). Older status sections below record the original authoring stage.

## Status

Built locally on 28 October 2026. Unpublished. No Firestore requests, writes, student accounts or Hosting deployment. Earlier releases and Chapter 9 Mission 1 must be published first. Historical, teacher, curriculum alignment and Grade 5 readability review remain pending.

## Learning design

Six illustrated scenes distinguish required labor, time and household burdens, compulsory produce delivery, delivery versus payment, Sumuroys named response, and a five-topic report recap. Each includes three clues, a decision, feedback, vocabulary and authored Explain help. Five accessible SVG diagrams are modern teaching guides rather than original orders or receipts.

A fictional six-slot schedule leaves four slots when two are assigned to required work and travel. It models a time cost, not historical days, age eligibility, exemptions or a universal legal quota. Those details need a specific period and setting. Labor is not confused with produce delivery; forced sale is not described as freely chosen. A payment promise is not proof that the producer received payment. Fictional source-desk exercises do not claim to reproduce a particular surviving transaction.

The Sumuroy example follows the NHCP marker for Palapag, Samar, protest against forced labor and abuses, and 1 June 1649. CulturEd supplies the Cavite shipbuilding connection. The mission uses Sumuroy without choosing between conflicting expanded names in the two sources. It does not invent speeches, require fighting reenactments or reproduce graphic details. A single case is not every workers experience.

Five medium quiz questions, one per topic, pass at three correct. Ten main-bank items provide two finite variants per topic. Ten separate easy/hard practice items use mapped lesson review and existing practice policy. Configured reward: 50 XP and a symbolic Labor and Produce Evidence Journal through existing one-time reward behavior. Runtime learning content comes from Firestore after publication; JSON is authoring input.

## Files and guarded publication

- data/chapter9-mission2-lessons.json and data/chapter9-mission2-assessments.json: authoring inputs.
- functions/build-chapter9-mission2.cjs: repeatable plan builder.
- data/chapter9-mission2-migration.json: 29 creates and two guarded catalog description updates.
- functions/apply-chapter9-mission2.cjs: original project only; dry run by default, --apply commits atomically with rollback snapshot and field readback.

Eight publication prerequisites preserve the earlier release chain and require active Chapter 9 Mission 1. Catalog descriptions must match that release. No learner records, chapter badge or challenge are written. Student access requires the owned prior mission completion; completing both available missions does not complete Chapter 9. Missions 3-5 and its final challenge remain pending.

When database availability and earlier publication are confirmed, run the apply script without flags and inspect the dry run, use --apply, then repeat the dry run to verify zero changes. Review collisions and expected-field mismatches rather than bypassing guards. Live preflight, commit/readback and an authenticated walkthrough remain pending.

## Sources and scope

- [Ma. Carmen V. Penalosa, The Origins and Rise of Philippine Political Corruption, Historical Bulletin LI, 2017](https://pssc.org.ph/wp-content/pssc-archives/Historical%20Bulletin/PHA%20HB%202017.pdf): printed page 96 (PDF page 106) distinguishes tribute, forced labor and compulsory agricultural sales to government. The lesson does not adopt every broad interpretation in the article or reconstruct universal labor rules.
- [NHCP registry: Agustin Sumuroy](https://philhistoricsites.nhcp.gov.ph/registry_database/agustin-sumuroy/): named place, protest and date. The marker is later commemoration, not an eyewitness diary.
- [NCCA CulturEd: Sumuroy](https://philippineculturaleducation.com.ph/sumuroy/): the Cavite shipbuilding demand. Its narrative is not a source for invented dialogue or every workers private motives.

These introductory examples do not cover every labor regulation or bandala transaction. Passing is a learning milestone, not evidence of complete curriculum mastery or classroom effectiveness.

## Verification

All 227 non-emulator unit checks passed. The six-scene Chrome fixture passed rendering, clues, decisions, authored help, image loading and recovery. Tests cover quiz variants, separate practice, review mappings, model boundaries, demand/delivery/payment distinctions, the named case, owned prior-mission gating and guarded descriptions. Migration syntax passed. Fixtures use mocked Firestore; live security and actual signed-in student validation remain pending.

Next: Chapter 9 Mission 3, Agriculture, Monopolies, and Economic Policies.
