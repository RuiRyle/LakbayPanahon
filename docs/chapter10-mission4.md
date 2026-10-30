# Chapter 10 Mission 4: Arts, Architecture, and Cultural Practices

> Publication update - 28 October 2026: This release is now published to Firestore, backed up and field-verified. See [Chapters 7-14 publication](chapters7-14-publication.md). Older status sections below record the original authoring stage.

## Status and learning structure

Built locally on 28 October 2026. Unpublished. No Firestore requests, writes, student accounts or Hosting deployment. Earlier releases and Chapter 10 Missions 1-3 must be published first. Historical, teacher, curriculum alignment and Grade 5 readability review remain pending.

Six scenes examine makers and patrons, event versus depiction dates, architectural adaptation, a modern textile heritage story, source purpose and an all-topic report recap. Each contains three clues, a decision, feedback, vocabulary and authored Explain help. Five accessible SVG guides include a timeline distinguishing the 1807 Basi Revolt and the 1821 painting series. Guides do not reproduce graphic paintings, authentic textile patterns, sacred objects or exact building plans.

The National Museum example keeps attribution to Villanueva rather than treating the paintings as instantaneous eyewitness photographs. The UNESCO group illustrates design reworked through materials, features and Chinese and Philippine craftsmanship, without assuming identical buildings or equal power for everyone involved. The Field Museum example is explicitly dated to the early to mid-1960s; it is living-heritage evidence rather than proof of every colonial textile detail.

Students investigate historical religion and cultural objects without prayer, profession of faith or personal disclosure. No activity requires alcohol use, conflict reenactment, entering a site or copying a community pattern. Fictional workshop and source-desk exercises remain labelled models. Missing maker names are not proof of no contribution; later display labels are not automatically original records or full biographies.

Five medium quiz questions, one per topic, pass at three correct. Ten main-bank questions provide two finite variants per topic; ten separate easy/hard practice questions retain mapped lesson review and existing practice policy. Configured reward: 50 XP and the symbolic Arts and Culture Evidence Journal through existing one-time reward behavior. Runtime instructional content comes from Firestore after publication; JSON is authoring input.

## Files and guarded publication

- data/chapter10-mission4-lessons.json and data/chapter10-mission4-assessments.json: authored inputs.
- functions/build-chapter10-mission4.cjs: repeatable local builder.
- data/chapter10-mission4-migration.json: 29 creates and two guarded catalog descriptions.
- functions/apply-chapter10-mission4.cjs: original project only; dry run by default; --apply commits atomically with rollback snapshot and field readback.

Eleven prerequisites preserve the earlier chain and require active Chapter 10 Missions 1-3. Catalog descriptions must match Mission 3. Student access requires owned Chapter 9 completion and all three owned prior Chapter 10 missions. No learner records, challenge or chapter badge are written. Mission 5 and the final challenge remain pending; completing Mission 4 does not complete Chapter 10.

After availability and earlier publication are confirmed, inspect the apply scripts dry run, run with --apply, then repeat without flags to confirm zero changes. Review collisions or changed expected fields rather than bypassing guards. Live preflight, commit/readback and an authenticated walkthrough remain pending.

## Sources and limits

- [National Museum: The Basi Revolt](https://www.nationalmuseum.gov.ph/exhibitions/nm-ilocos-regional-museum-complex/the-basi-revolt/): fourteen oil paintings, event date 1807, making date 1821 and attribution to Esteban Pichay Villanueva. A dated depiction is not proof of every event detail or exact conversation. The mission does not teach a complete revolt chronology.
- [UNESCO: Baroque Churches of the Philippines](https://whc.unesco.org/en/list/677/): the four named sites, reinterpretation of design, materials and craftsmanship. It does not establish identical construction, dimensions, motives or beliefs across every building and participant.
- [Field Museum: Edwin P. Abaya Abel Iloko Towel](https://philippines.fieldmuseum.org/heritage/multimedia/1627247): a community heritage account dating the textile to the early to mid-1960s. The record title calls it a towel while its description calls it a bath robe; the lesson uses textile without resolving that catalog wording. No source photograph or design is copied. The bounded account is not every owners or weavers experience.

Introductory examples do not replace regional art histories, community consultation or complete curriculum review. Classroom learning effectiveness remains unverified.

## Verification

All 258 non-emulator unit checks passed. The six-scene Chrome fixture passed rendering, clues, decisions, authored help, image loading and recovery. Tests cover topic coverage, finite variants, separate practice, review mappings, event/artifact dates, source scope, respectful activity boundaries, all three owned prior completions and guarded descriptions. Migration syntax passed. Mocked fixtures do not replace live security or actual student validation.

Next: Chapter 10 Mission 5, Continuity and Change in Filipino Society.
