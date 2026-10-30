# Chapter 5 Mission 1: exploration motives

Implemented and published to the original Firestore project `lakbaypanahon-1797e` on 28 October 2026.

## Available learning

Era 2 introduces exploration and Spanish colonial rule. Chapter 5 currently contains **only Mission 1: European Exploration and Its Motives**. Its six interactive scenes cover trade motives, sponsorship, the broad outward route, motives versus outcomes, local perspectives and synthesis. Each scene includes three explorable clues, a decision with feedback and authored vocabulary/help. Three local SVG teaching diagrams accompany the content. The route illustration is explicitly a sequence diagram, not a geographic map or exact ship track.

The main quiz selects five medium questions using one slot per topic. Its ten-question bank supplies two variants per topic; fresh questions depend on the existing runtime selection policy and available bank. Ten separate practice questions cover easy and hard levels. Topic tags map review back to the relevant lesson and final recap. Passing uses the existing 3/5 threshold and one-time mission rewards (50 XP and a symbolic journal collectible).

No chapter challenge or badge is published: the remaining missions and challenge are still being prepared. Era access retains the existing independent-era model. This change does not add an automatic Chapter 4 to Era 2 redirect.

## Authoring and publication

- `data/chapter5-mission1-lessons.json`: lesson authoring input.
- `data/chapter5-mission1-assessments.json`: quiz authoring input.
- `functions/build-chapter5-mission1.cjs`: builds 31 Firestore documents, including practice and artifact metadata.
- `data/chapter5-mission1-migration.json`: generated publication plan.
- `functions/apply-chapter5-mission1.cjs`: dry run by default; `--apply` commits atomically with creation preconditions, backup and field-by-field readback. Never modifies learner collections.

Runtime lesson and assessment data comes from Firestore; JSON files are authoring inputs. Illustrations are local website assets. Live Server serves these assets immediately; Firebase Hosting was not deployed.

## Verification

All 142 non-emulator unit checks passed. The Chrome story fixture passed all six scenes, clue exploration, correct decisions, authored help, recovery and image loading. The original Firestore commit and every planned field were verified. A real signed-in student walkthrough of this new mission remains pending; fixture checks do not establish student learning effectiveness. Independent teacher, curriculum alignment, historical content and Grade 5 readability review remain pending.

## Source basis and teaching limits

The [Spanish Ministry of Culture's expedition archive overview](https://www.cultura.gob.es/cultura/archivos/difusion/registro-memoria-unesco/2023/vuelta-mundo-magallanes-elcano.html) informs the Spanish-backed westward spice objective. The [Library of Congress discussion of negotiating empire](https://blogs.loc.gov/international-collections/2021/10/negotiating-empire-part-i-from-magellan-to-the-founding-of-manila-16th-18th-centuries/) informs the distinction between expedition aims, encounters and local interests. The [National Quincentennial Committee route resource](https://www.nqc.gov.ph/en/map/) provides Philippine encounter context. These are selected sources, not complete coverage of Philippine history. Classroom funding situations and perspective prompts are explicitly fictional, not original quotations. Later events and colonial consequences require the remaining missions.

## Subsequent availability

Mission 2 has since been added; see `docs/chapter5-mission2.md`. The original publication notes above describe the Mission 1 release. Chapter 5 now offers Missions 1-2; Missions 3-4 and the final challenge remain in preparation.
