# Chapter 5 Mission 4: Expeditions After Magellan

> Publication update ? 2026-10-28: This release is now published to Firestore with guarded writes, backup and field readback. See [Chapter 6 publication verification](chapter6-publication.md). Earlier status sections below describe the original authoring stage.

## Status

Implemented locally on 28 October 2026. **Not published.** A new Mission 3 preflight still returned HTTP 429, `Quota exceeded`, from the original Firestore project. No Mission 4 publication was attempted while this blocking condition remained. The live catalog still contains Missions 1-2; Missions 3-4 are prepared locally. Firebase Hosting has not been deployed.

## Learning sequence

Six interactive scenes teach:

1. The continued voyage after Mactan and Victoria's 1522 return under Elcano.
2. Selected later expedition departures: Loaisa 1525, Saavedra 1527 and Villalobos 1542. Departure and arrival are explicitly distinguished.
3. Continuing trade and route interests, practical constraints and actual outcomes.
4. The Villalobos expedition's association with the name Filipinas and Prince Felipe; naming is not universal local consent or the beginning of local history.
5. The distinction between expedition, arrival, naming and continuing colonial rule. Legazpi's 1565 Cebu settlement is a preview of the next chapter, not a claim of immediate control everywhere.
6. A supported expedition comparison, with topic review and honest next-step information.

Each scene includes three clues, a decision and feedback, vocabulary and authored help. Four accessible local SVG teaching diagrams accompany the scenes. They are sequence/comparison guides, not exact maps, original images or original dialogue. Fictional comparison and exhibit tasks are identified as teaching prompts.

The main quiz uses five medium questions, one per topic, with three correct required to pass. Ten main-bank questions provide two variants per topic; the finite pool does not promise unlimited never-seen retries. Ten separate easy/hard practice questions support the existing adaptive review policy. Weak topics map to their teaching scene and the final recap. Runtime learning content comes from Firestore once published; JSON files are authoring inputs.

The configured mission reward is 50 XP and a symbolic Expedition Comparison Journal collectible through existing one-time reward behavior. No chapter challenge or badge is added. Completing this mission must not be presented as already passing an unpublished challenge or unlocking an unfinished next chapter.

## Authoring and publication

- `data/chapter5-mission4-lessons.json`: lesson authoring.
- `data/chapter5-mission4-assessments.json`: quiz and harder practice authoring.
- `functions/build-chapter5-mission4.cjs`: generates the curriculum plan.
- `data/chapter5-mission4-migration.json`: 29 new curriculum documents plus two guarded catalog description changes.
- `functions/apply-chapter5-mission4.cjs`: original project, dry run by default, atomic commit with creation/update preconditions, backup and readback when `--apply` is supplied.

Publish **Mission 3 before Mission 4**. Mission 4 expects the era and chapter descriptions produced by Mission 3. This protects against publishing out of sequence; do not remove the expected-value guards to bypass a mismatch. Neither publication plan includes learner collections.

After Firestore availability returns:

```powershell
node functions/apply-chapter5-mission3.cjs
node functions/apply-chapter5-mission3.cjs --apply
node functions/apply-chapter5-mission3.cjs
node functions/apply-chapter5-mission4.cjs
node functions/apply-chapter5-mission4.cjs --apply
node functions/apply-chapter5-mission4.cjs
node tests/chapter5-mission4-live-walkthrough.cjs
```

Each post-publication dry run should report zero changes. Stop and review any content collision or changed expected field. The prepared live walkthrough uses real lesson/quiz controls for Missions 1-4 on one isolated temporary account, then removes its owned records and account. It has not been run because Missions 3-4 are not published and Firestore is quota-blocked.

## Source basis

- [Spanish Army Museum: Elcano and the completed circumnavigation](https://ejercito.defensa.gob.es/museo/HECHOS_HISTORICOS/HECHOS_HISTORICOS/09.06_sept_SE_COMPLETO_LA_PRIMERA_VUELTA_AL_MUNDO_POR_ELCANO.html?__locale=es): Victoria's return under Elcano in 1522.
- [National Museum library digital collection](https://library.nationalmuseum.gov.ph/digital-collection/digi/PI02/home.htm): the Loaisa, Saavedra, Villalobos and Legazpi expedition records. Selected departure years are not presented as a complete route list or identical arrival dates.
- [NCCA: Gateway to the Orient, from Legazpi to Malaspina](https://ncca.gov.ph/about-culture-and-arts/in-focus/philippines-gateway-to-the-orient-from-legazpi-to-malaspina/): continued commercial interest, return-route difficulties, the 1542 departure/1543 arrival distinction and the naming connection. The lesson avoids treating naming as an instant national ceremony and does not repeat the claim that this voyage first established the Earth's roundness.
- [US Naval History and Heritage Command: Villalobos](https://www.history.navy.mil/research/histories/ship-histories/danfs/v/villalobos-i.html): Villalobos's departure from Mexico in 1542. Ship counts are not taught or assessed here.
- [Library of Congress: Negotiating Empire](https://blogs.loc.gov/international-collections/2021/10/negotiating-empire-part-i-from-magellan-to-the-founding-of-manila-16th-18th-centuries/): the later Spanish settlement in Cebu and the importance of local interests to the development of colonial authority.

Selected sources support an introductory comparison, not exhaustive expedition history or complete Philippine-history coverage. Independent teacher, historical, curriculum alignment and Grade 5 readability review remain pending.

## Verification

All 151 non-emulator unit checks passed. The Chrome story fixture passed six new scenes, clue exploration, correct decisions, authored help, recovery and image loading. Syntax checks passed for the builder, guarded migration and prepared live walkthrough. No successful Mission 4 live preflight, commit, readback or signed-in walkthrough is claimed.

Next content task: author and review the Chapter 5 challenge across all four missions, then its badge and continuation behavior. Its absence is still shown explicitly in the chapter descriptions.

## Challenge preparation update

The Chapter 5 challenge and its badge are now authored locally; see `docs/chapter5-challenge.md`. They remain unpublished with Missions 3-4 because the original Firestore project is quota-blocked. The previous next-task note describes the Mission 4 authoring milestone; it does not indicate a live challenge.
