# Chapter 7 Mission 4: Reduccion and the Reorganization of Settlements

> Publication update - 28 October 2026: This release is now published to Firestore, backed up and field-verified. See [Chapters 7-14 publication](chapters7-14-publication.md). Older status sections below record the original authoring stage.

## Status

Built locally on 28 October 2026. Unpublished. No live Firestore requests, writes or student accounts were used, and availability was not rechecked. Earlier pending releases must be published first. Hosting was not deployed.

## Learning and behavior

Six illustrated scenes cover settlement concentration, administrative/religious aims, prescribed layouts versus actual use, daily activities, local responses and a final evidence report. Each includes three clues, a decision with feedback, vocabulary and authored help. Three accessible SVG assets include a fictional proposed-layout model and two evidence guides. The layout has no exact scale, household count or actual travel times and is not a reconstructed named town. Daily-life examples are fictional, not original household histories.

The lesson distinguishes policy and plan from implementation and effects. It recognizes earlier communities, avoids assuming universal relocation or consent, and asks about work, resources, family connections and institutions. Religious aims are studied without requiring religious practice. A later compilation of rules is not automatically projected onto all earlier settlements. Petitions and official reports are compared with residence evidence; a request is not a guaranteed outcome. Different settlement patterns are not used to rank people's worth.

The main quiz selects five medium questions, one per topic, with three correct to pass. Ten main questions provide two variants per topic; the finite pool does not promise unlimited never-seen retries. Ten separate easy/hard practice items use the existing adaptive review policy and scene mappings. The recap maps all five topics. Runtime content comes from Firestore after publication; JSON is authoring input.

Configured reward: 50 XP and a symbolic Settlement Evidence Journal through existing one-time reward behavior. All three owned prior mission completions are required, alongside existing chapter prerequisites. No Chapter 7 badge, challenge or chapter completion is added. The chapter challenge remains to be built.

## Publication files and order

- `data/chapter7-mission4-lessons.json`: lesson authoring.
- `data/chapter7-mission4-assessments.json`: quiz variants and harder practice.
- `functions/build-chapter7-mission4.cjs`: builds the plan.
- `data/chapter7-mission4-migration.json`: 29 new curriculum documents and two guarded descriptions.
- `functions/apply-chapter7-mission4.cjs`: original project only, dry run by default; atomic commit with backup/preconditions and readback when `--apply` is supplied.

Ten prerequisites require earlier Chapter 6 records and Chapter 7 Missions 1-3. Descriptions must match the Mission 3 release. Publish earlier pending Chapter 5/6 releases and Chapter 7 Missions 1-3 in order first. The plan includes no learner data. Review changed expected fields or collisions rather than bypassing guards.

When access and prerequisites are confirmed:

```powershell
node functions/apply-chapter7-mission4.cjs
node functions/apply-chapter7-mission4.cjs --apply
node functions/apply-chapter7-mission4.cjs
```

The repeat dry run should show zero changes. Live preflight, commit, readback and signed-in walkthrough remain pending.

## Source basis and review limits

- [NCCA Philippine History Source Book](https://ncca.gov.ph/wp-content/uploads/2021/09/PHILIPPINE-HISTORY-SOURCE-BOOK-FINAL-SEP022021.pdf): translated settlement legislation and introduction to reduccion. Prescriptions are not treated as complete evidence of actual occupation or an identical layout in every pueblo.
- [NCCA: Ethnic History, Cordillera](https://ncca.gov.ph/about-ncca-3/subcommissions/subcommission-on-cultural-heritagesch/historical-research/ethnic-history-cordillera/): regional discussion linking settlement concentration with religious instruction and tribute collection. This setting is not generalized into one experience of every highland or lowland community.
- [National Archives: Ereccion de los Pueblos](https://erecciones.nationalarchives.gov.ph/oprequest): local administrative records, petitions and settlement-related material. The classroom cases are not transcriptions or claims about specific unnamed archive households.

Household distance and convenience questions are explicitly hypothetical investigations, not asserted historical measurements. Independent historical, teacher, curriculum alignment and Grade 5 readability review remain pending. This is introductory settlement-policy content, not complete regional history or proof of learning effectiveness.

## Verification

All 197 non-emulator unit checks passed. The six-scene Chrome fixture passed clue exploration, correct decisions, authored help, recovery and image loading. Tests cover assessment coverage, retry variants, separate practice, scene mapping, three owned prior-mission prerequisites, guarded descriptions and no premature chapter completion. Builder and migration syntax checks passed. Fixtures use mocked Firestore and do not establish live database security or actual student outcomes.

Next: Chapter 7 challenge and badge, integrating the four missions.

## Challenge authoring update

The Chapter 7 challenge and badge are now authored locally; see `docs/chapter7-challenge.md`. They remain unpublished with the four missions. Earlier statements that the challenge was being prepared describe the Mission 4 authoring milestone.
