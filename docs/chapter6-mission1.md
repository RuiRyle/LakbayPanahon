# Chapter 6 Mission 1: Legazpi's Expedition

> Publication update ? 2026-10-28: This release is now published to Firestore with guarded writes, backup and field readback. See [Chapter 6 publication verification](chapter6-publication.md). Earlier status sections below describe the original authoring stage.

## Availability

Implemented locally on 28 October 2026. **Not published to Firestore.** This task deliberately used no live database reads, writes or student test accounts while the previously observed quota issue remained unresolved. Hosting was not deployed. Original live curriculum availability remains as last verified: Chapter 5 Missions 1-2, with Missions 3-4, the Chapter 5 challenge and this new mission awaiting ordered publication.

Chapter 6 is explicitly partial. Only Mission 1 is authored here. Missions 2-4 and the chapter challenge/badge are not created, and completing this mission must not be described as completing the chapter.

## Learning design

Six interactive scenes cover:

1. Legazpi's later expedition: departure from Mexico in 1564 versus events in the Philippine islands in 1565.
2. Spanish aims, command, navigation and crew responsibilities; an aim is not local consent.
3. Local opposition, force and a recorded agreement involving Tupas and Legazpi; neither conflict nor an agreement tells every individual's thoughts.
4. A Spanish settlement within an existing Cebu community; continued presence is not immediate control of every island.
5. The 1565 return connection to Mexico involving San Pedro, Urdaneta, Felipe de Salcedo, navigators and crew.
6. A supported report connecting chronology, different roles, local responses, settlement and the return journey.

Each scene includes three explorable clues, a decision with feedback, vocabulary and authored help. Four local SVG teaching diagrams cover event sequence, roles and aims, evidence checks and a conceptual settlement comparison. They are not exact maps, original images or original dialogue. Classroom report/exhibit tasks are identified as fictional teaching tools. Students are not asked to practise a faith to study a religious participant's role.

The five-question main quiz covers one medium question per topic, passing at three correct. Ten bank questions supply two variants per topic, with ten separate easy/hard practice questions and existing adaptive review policy. Difficult topics map to the relevant teaching scene and the final recap. The bank is finite and does not promise unlimited never-seen retries. Runtime instructional data comes from Firestore after publication; JSON is the authoring input.

Configured reward: 50 XP and a symbolic Cebu Expedition Journal collectible using existing one-time reward behavior. No Chapter 6 challenge or badge is included.

## Progression

The new chapter uses the existing Era 2 chapter order. An owned, saved Chapter 5 completion is required for Chapter 6 access. A different user's completion does not unlock it. Once Chapter 6 and its first mission are actually published, the existing Chapter 5 completion screen can offer Continue to Next Chapter. While they are absent, it retains Explore Chapters. This does not change independent-era access or award student progress through the migration.

The Chapter 5 browser fixture now verifies both availability states. Its live walkthrough assertion also checks whichever state is actually published instead of assuming Chapter 6 must remain unavailable forever.

## Authoring and publication

- `data/chapter6-mission1-lessons.json`: lesson input.
- `data/chapter6-mission1-assessments.json`: quiz and harder practice input.
- `functions/build-chapter6-mission1.cjs`: builds the publication plan.
- `data/chapter6-mission1-migration.json`: 30 new documents and one guarded era-description update.
- `functions/apply-chapter6-mission1.cjs`: dry run by default, original project only; atomic commit with backup, create/update preconditions and readback when `--apply` is supplied.

The plan creates a chapter, mission, quiz, six scenes, ten main questions, ten practice questions and a collectible. It does not write learner collections. Seven preflight prerequisites require Chapter 5, its four missions, its challenge and its badge to be published before Chapter 6. The era description must match the Chapter 5 challenge release.

After Firestore availability returns, publish Chapter 5 Mission 3, Mission 4 and the challenge in the order documented in `docs/chapter5-challenge.md`. Then:

```powershell
node functions/apply-chapter6-mission1.cjs
node functions/apply-chapter6-mission1.cjs --apply
node functions/apply-chapter6-mission1.cjs
```

The repeat dry run should show zero changes. Review any expected-value mismatch or creation collision rather than bypassing guards. No live preflight, commit, readback or signed-in Chapter 6 walkthrough has run yet.

## Source basis and limits

- [NCCA: Philippines, Gateway to the Orient from Legazpi to Malaspina](https://ncca.gov.ph/about-culture-and-arts/in-focus/philippines-gateway-to-the-orient-from-legazpi-to-malaspina/): departure, aims, continuing presence, local opposition and the importance of the return connection.
- [NHCP registry: Unang Kasunduan ng Kapyapaan sa Pilipinas](https://philhistoricsites.nhcp.gov.ph/registry_database/unang-kasunduan-ng-kapyapaan-sa-pilipinas/): the recorded Tupas-Legazpi agreement in Cebu. The lesson does not generalize the marker's title into a claim that no earlier agreement ever existed.
- [Spanish Naval History and Culture Institute: Urdaneta expedition](https://armada.defensa.gob.es/ArmadaPortal/page/Portal/ArmadaEspannola/cienciaorgano/prefLang-es/02cienciaihcn--10navegaciones--05expurdaneta): San Pedro, captain Felipe de Salcedo, navigators, crew and the return connection.
- [Library of Congress: Negotiating Empire](https://blogs.loc.gov/international-collections/2021/10/negotiating-empire-part-i-from-magellan-to-the-founding-of-manila-16th-18th-centuries/): the continuing Spanish presence in Cebu and the importance of local interests and connections.

The return scene intentionally avoids a claim of exclusive priority over all Pacific return voyages. It uses the year rather than resolving differing exact-day accounts. It credits shared work and does not treat a route as guaranteed safety. The mission does not introduce a graphic ceremony, use a delisted marker as present site authority or invent authentic-sounding speeches.

Independent historical, teacher, curriculum alignment and Grade 5 readability review remain pending. This is introductory source-informed content, not complete coverage of colonial institutions or Philippine history.

## Completed verification

All 162 non-emulator unit checks passed. The six-scene Chrome fixture passed clue exploration, decisions, authored help, recovery and image loading. Progression checks verified owned Chapter 5 prerequisites and no premature Chapter 6 challenge completion. The Chapter 5 challenge Chrome fixture passed both the unavailable-content fallback and the Chapter 6 continuation using the actual authored chapter/mission configuration.

The next content task is Chapter 6 Mission 2: Establishment of Spanish Settlements in Cebu and Manila. It should develop the comparison beyond this mission's overview.
