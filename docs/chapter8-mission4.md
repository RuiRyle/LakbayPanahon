# Chapter 8 Mission 4: Indigenous Responses, Adaptation, and Resistance

> Publication update - 28 October 2026: This release is now published to Firestore, backed up and field-verified. See [Chapters 7-14 publication](chapters7-14-publication.md). Older status sections below record the original authoring stage.

## Status

Built locally on 28 October 2026. Unpublished. No Firestore requests, writes, student accounts or Hosting deployment. Publish earlier releases in order first. Teacher, historical, curriculum alignment and Grade 5 readability review remain pending.

## Learning structure

Six scenes cover different responses, adaptation with continuity, Tamblot in Bohol, living heritage and dated evidence, an evidence-supported explanation, and a five-topic report recap. Every scene includes three clues, a decision, feedback, vocabulary and authored Explain help. Five accessible SVG diagrams are modern teaching aids, not historical artifacts or authentic textile patterns.

The Tamblot example follows NCCA CulturEd for the named place and 1621 beginning. It does not invent speeches or reproduce claims of supernatural events. Conflict is discussed without graphic detail or reenactment. Students are not rewarded for harm, religious allegiance or personal disclosure. Cooperation is not equated with agreement with every colonial demand. Fictional workshop and village exercises are explicitly labelled. The museum example distinguishes living traditions and dated collections from proof of unchanged colonial details.

Five medium questions are selected by topic; three correct passes. Ten main-bank questions provide two finite variants per topic. Ten separate easy/hard practice questions retain mapped lesson review and existing practice policy. Configured reward is 50 XP and one symbolic Community Response Evidence Journal through existing one-time reward behavior. Runtime content will come from Firestore after publication; JSON files are authoring inputs.

## Files and publication

- data/chapter8-mission4-lessons.json and data/chapter8-mission4-assessments.json: authored inputs.
- functions/build-chapter8-mission4.cjs: repeatable local builder.
- data/chapter8-mission4-migration.json: 29 creates and two guarded catalog description updates.
- functions/apply-chapter8-mission4.cjs: dry run by default; original project only; atomic commit, rollback snapshot and readback with --apply.

Ten prerequisites retain the Chapter 7 chain and require Chapter 8 Missions 1-3. Catalog descriptions must match the Mission 3 release. No learner records, chapter badge or chapter challenge are written. Completing this mission does not yet complete the chapter: its final challenge remains to be built.

After availability and earlier publication are confirmed, run the apply script without flags, inspect its dry run, then use --apply and repeat the dry run to confirm zero changes. Do not bypass collisions or expected-field mismatches.

## Sources

- [NCCA CulturEd: Tamblot](https://philippineculturaleducation.com.ph/tamblot/): named historical example, bounded to place and period; limited biographical evidence.
- [National Museum: Cordillera](https://www.nationalmuseum.gov.ph/our-museums/regional-area-and-site-museums/cordillera/): living textile knowledge, makers, traditional and contemporary work, and dated collections. It does not establish every colonial practice.
- [National Museum: Sculptures](https://www.nationalmuseum.gov.ph/our-collections/fine-arts/sculptures/): continuity with the prior mission's discussion of religious art and local skills. The workshop card is fictional, not a documented individual workshop.

This is an introductory selection, not a complete account of Indigenous resistance or all regional histories. Wider Cordillera resistance is not asserted from a modern museum exhibition alone.

## Verification

All 216 non-emulator unit checks passed. The Chrome fixture passed six-scene rendering, clue exploration, decisions, authored help, image loading and recovery. Tests check coverage, finite retry variants, separate adaptive practice, review mappings, source limits, prerequisites and guarded catalog updates. Migration syntax passed. Mocked fixtures do not replace authenticated live validation or classroom evaluation.

Next: build the Chapter 8 evidence challenge across its four missions.
