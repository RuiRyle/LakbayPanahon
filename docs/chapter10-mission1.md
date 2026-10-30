# Chapter 10 Mission 1: Changes in Settlements and Housing

> Publication update - 28 October 2026: This release is now published to Firestore, backed up and field-verified. See [Chapters 7-14 publication](chapters7-14-publication.md). Older status sections below record the original authoring stage.

## Status and learning structure

Built locally on 28 October 2026. Unpublished. No Firestore requests, writes, student accounts or Hosting deployment. Earlier pending releases and Chapter 9 must be published first. Independent historical, teacher, curriculum alignment and Grade 5 readability review remain pending.

This release creates a partial Chapter 10, Social and Cultural Transformation, within Era 3. Six scenes cover settlement connections, combined house materials, ventilation, work and domestic uses, construction/change/conservation, and a five-topic report recap. Each has three clues, a decision, feedback, vocabulary and authored Explain help. Five accessible SVG guides include fictional settlement, house cutaway and window-panel diagrams. These are models rather than measured plans, authentic buildings or airflow tests.

Vigan is the named case. The lesson distinguishes earlier settlement activity from colonial planning; mixed materials from the literal assumption that every part of a bahay na bato was stone; and town beginnings from construction, alteration and repair dates. It does not treat one wealthy merchant house as every familys dwelling or rank residents by materials. A modern museum display or conservation assessment is not the full record of earlier life.

The modern conservation example uses the UN account of post-2022-earthquake documentation of Vigan houses, including Syquia Mansion and Cabildo House. It teaches source dates and documentation, without graphic disaster detail or building-repair instructions. No activity requires entry into private houses, climbing damaged structures or disclosure of a students home layout.

Five medium main-quiz questions, one per topic, pass at three correct. Ten main-bank questions provide two finite variants per topic. Ten separate easy/hard practice questions retain mapped lesson review and existing practice policy. Configured reward: 50 XP and a symbolic Settlement and Housing Evidence Journal through existing one-time reward behavior. Runtime instructional content comes from Firestore after publication; JSON is authoring input.

## Files, access and publication

- data/chapter10-mission1-lessons.json and data/chapter10-mission1-assessments.json: authored inputs.
- functions/build-chapter10-mission1.cjs: repeatable local builder.
- data/chapter10-mission1-migration.json: 30 creates, including the partial chapter, and one guarded era description update.
- functions/apply-chapter10-mission1.cjs: original project only; dry run by default; --apply commits atomically, saves a rollback snapshot and verifies fields.

Eight publication prerequisites require active Chapter 9, its challenge, badge and five missions. The era description must match the Chapter 9 challenge release. No learner records are written. Student access requires owned Chapter 9 completion within the existing Era 3 path. Continuation from Chapter 9 offers Chapter 10 only when ready content with an active mission exists. Passing this mission alone does not complete Chapter 10. Missions 2-5, its challenge and final badge remain pending.

After availability and earlier publication are confirmed, inspect the apply scripts dry run, run with --apply, then repeat without flags to confirm zero changes. Review collisions or expected-field mismatches rather than bypassing guards. Live preflight, commit/readback and an authenticated walkthrough remain pending.

## Sources and limits

- [UNESCO World Heritage Centre: Historic City of Vigan](https://whc.unesco.org/en/list/502/): earlier trading activity, later planned layout and selected building features/use. The lesson does not date every surviving feature to the towns beginnings or extend the named pattern to every community.
- [NHCP: Guidelines on Identification and Recognition of Heritage Houses, 2020](https://philhistoricsites.nhcp.gov.ph/wp-content/uploads/2023/07/NHCP-GUIDELINES-ON-THE-IDENTIFICATION-AND-RECOGNITION-OF-CULTURAL-PROPERTIES-AS-HERITAGE-HOUSES.pdf): material combinations, regional variation and local craftsmanship. The activity does not attempt a legal heritage classification or use current classification rules as colonial building regulations.
- [UN Philippines: Raising the roof, 19 November 2024](https://philippines.un.org/en/283842-raising-roof-building-resilience-through-conserving-historic-homes-unesco-world-heritage): documentation and assessment after the 2022 earthquake. It supports a modern conservation example, not an exact reconstruction of earlier appearances.

Introductory examples do not replace regional settlement histories or establish complete curriculum coverage. Classroom learning effectiveness remains unverified.

## Verification

All 246 non-emulator unit checks passed. The six-scene Chrome fixture passed rendering, clues, decisions, authored help, image loading and recovery. Tests cover topic coverage, finite variants, separate adaptive practice, review mappings, model/source/date limits, owned Chapter 9 gating, honest continuation and guarded era description. Migration syntax passed. Mocked fixtures do not replace live security or actual student validation.

Next: Chapter 10 Mission 2, Education, Language, and Religious Life.
