# Chapter 10 Mission 3: Social Hierarchies and Everyday Experiences

> Publication update - 28 October 2026: This release is now published to Firestore, backed up and field-verified. See [Chapters 7-14 publication](chapters7-14-publication.md). Older status sections below record the original authoring stage.

## Status and learning structure

Built locally on 28 October 2026. Unpublished. No Firestore requests, writes, student accounts or Hosting deployment. Earlier releases and Chapter 10 Missions 1-2 must be published first. Independent historical, teacher, curriculum alignment and Grade 5 readability review remain pending.

Six scenes distinguish unequal power from human worth; local office from conduct; social/tax categories from biography; opportunities from practical access; the Bacolor petition from universal claims; and a five-topic report recap. Each contains three clues, a decision, feedback, vocabulary and authored Explain help. Five accessible SVG guides are modern labelled clue cards, not authentic petitions, registers or a fixed social pyramid.

The lesson explains hierarchy and privilege without presenting ancestry as a measure of intelligence, character or worth. Students do not rank classmates, disclose ancestry or report family finances. The term mestizo is introduced as a source category, not guaranteed wealth, one occupation or one identical background across all records. Principalia is bounded to local elite roles and families, with context-dependent meaning. A title is not proof of fair conduct or universal approval.

Bacolor, Pampanga, in 1698 supplies a named petition about tribute-collection duties. It is not every communitys experience. Request, investigation and documented outcome remain distinct; speeches, signatures, rates and motives are not invented. Fictional learner and record cards demonstrate questions to ask rather than claiming to reproduce a historical census or complete biography.

Five medium quiz questions, one per topic, pass at three correct. Ten main-bank questions provide two finite variants per topic; ten separate easy/hard practice questions retain mapped lesson review and existing practice policy. Configured reward: 50 XP and a symbolic Social Experience Evidence Journal through existing one-time reward behavior. Runtime content comes from Firestore after publication; JSON is authoring input.

## Files and guarded publication

- data/chapter10-mission3-lessons.json and data/chapter10-mission3-assessments.json: authored inputs.
- functions/build-chapter10-mission3.cjs: repeatable local builder.
- data/chapter10-mission3-migration.json: 29 creates and two guarded descriptions.
- functions/apply-chapter10-mission3.cjs: original project only; dry run by default; --apply commits atomically with rollback snapshot and field readback.

Ten prerequisites retain the earlier chain and require Chapter 10 Missions 1-2. Catalog descriptions must match Mission 2. Student access requires owned Chapter 9 completion and both owned prior Chapter 10 missions. No learner records, chapter challenge or badge are written. Missions 4-5 and the final challenge remain pending; passing this mission does not complete Chapter 10.

After availability and earlier publication are confirmed, inspect the apply scripts dry run, run with --apply, then repeat without flags to verify zero changes. Review collisions or expected-value mismatches rather than bypassing guards. Live preflight, commit/readback and an authenticated walkthrough remain pending.

## Sources and limits

- [Grace Liza Y. Concepcion, They Are Not Foreigners, UP Diliman research summary](https://history.upd.edu.ph/publications/they-are-not-foreigners/): Bacolor petition, roles, local relationships and investigation. The summary supports the bounded case; full archival procedures and individual biographies are not reconstructed from it.
- [Filomeno V. Aguilar Jr., Gregorio Sancianco, Colonial Tribute, and Social Identities, 2019](https://archium.ateneo.edu/history-faculty-pubs/21/): repository abstract summarizes a critique connecting tribute with social divisions. The mission does not invent tax rates or claim the abstract establishes every persons experience.
- [Cesar Adib Majul, Principales, Ilustrados, Intellectuals and the Original Concept of a Filipino National Community](https://asj.upd.edu.ph/mediabox/archive/ASJ-15-1977/majul-ilustrados-principales-filipino-nation.pdf): contextual discussion of principalia and local office. Broad claims in the older framework are not adopted as universal rules for every period or region. The repository filename includes 1977, while the paper footnote identifies a 1978 conference; no exact publication-year claim is made here.

This introductory selection does not replace regional social histories or teach a complete catalog of colonial legal classifications. It avoids making a single permanent ancestry ladder the explanation for all social experience. Classroom learning effectiveness remains unverified.

## Verification

All 254 non-emulator unit checks passed. The six-scene Chrome fixture passed rendering, clues, decisions, authored help, image loading and recovery. Tests cover topic coverage, finite variants, separate adaptive practice, mapped review, human-worth and source-scope boundaries, both owned prior completions and guarded descriptions. Migration syntax passed. Mocked fixtures do not replace live security or actual student validation.

Next: Chapter 10 Mission 4, Arts, Architecture, and Cultural Practices.
