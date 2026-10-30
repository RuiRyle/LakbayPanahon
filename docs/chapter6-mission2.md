# Chapter 6 Mission 2: Spanish Settlements in Cebu and Manila

> Publication update ? 2026-10-28: This release is now published to Firestore with guarded writes, backup and field readback. See [Chapter 6 publication verification](chapter6-publication.md). Earlier status sections below describe the original authoring stage.

## Status

Built locally on 28 October 2026. Not published to Firestore; no live database reads, writes or student accounts were used for this task. Publication of the earlier Chapter 5 releases and Chapter 6 Mission 1 remains pending. Database availability was not rechecked in this task. Firebase Hosting was not deployed.

## Student learning

Six interactive scenes compare colonial developments in Cebu (1565) and Manila (1571), existing communities, trade connections, local responses, and the actual reach of governing institutions. The final scene connects these ideas into a supported comparison. Every scene has three explorable clues, a decision and feedback, vocabulary and authored help. Four accessible SVG teaching diagrams accompany the scenes; they are not exact maps, reconstructed town plans or original historical images.

The lesson distinguishes colonial establishment dates from the beginning of local history. It names Tupas in Cebu and Sulayman in Maynila without presenting either as every resident's viewpoint. The Bangkusay activity retains the marker's identification of a leader from Macabebe instead of substituting Rajah Sulayman. It does not claim the marker proves that person's complete identity. Fictional exhibit and report tasks are identified as teaching tools, not original speeches. Violence is discussed without graphic images or combat rewards.

The main quiz has five medium questions, one per topic, and requires three correct to pass. Ten main-bank questions provide two variants per topic; the finite pool does not promise unlimited never-seen retries. Ten separate easy/hard practice questions support the existing adaptive evidence policy. Weak topics map back to their teaching scenes and the final recap. Runtime content comes from Firestore after publication; JSON files are authoring inputs.

The configured mission reward is 50 XP and a symbolic Two-Port Comparison Journal collectible through existing one-time reward behavior. Mission 2 requires the student's own saved Mission 1 completion, as well as the existing Chapter 5 prerequisite for Chapter 6. No Chapter 6 challenge or badge is added. Missions 3-4 remain unfinished.

## Authoring and publication

- `data/chapter6-mission2-lessons.json`: six lesson inputs.
- `data/chapter6-mission2-assessments.json`: quiz variants and harder practice inputs.
- `functions/build-chapter6-mission2.cjs`: generates the content plan.
- `data/chapter6-mission2-migration.json`: 29 new curriculum documents and two guarded catalog-description updates.
- `functions/apply-chapter6-mission2.cjs`: dry run by default; original project only, atomic commit with backup/preconditions and readback when `--apply` is supplied.

Publish Chapter 5 Missions 3-4, its challenge, and Chapter 6 Mission 1 first. Eight prerequisites require the earlier Chapter 5 records and active Chapter 6 Mission 1. The two descriptions must match the Mission 1 release. Do not remove guards to force publication over changed content. No learner collections are in the plan.

After those releases and restored database availability:

```powershell
node functions/apply-chapter6-mission2.cjs
node functions/apply-chapter6-mission2.cjs --apply
node functions/apply-chapter6-mission2.cjs
```

The final dry run should report zero changes. A real signed-in walkthrough of Chapter 6 Missions 1-2 remains pending; no live preflight, commit or readback is claimed here.

## Sources and review limits

- [NCCA: Gateway to the Orient from Legazpi to Malaspina](https://ncca.gov.ph/about-culture-and-arts/in-focus/philippines-gateway-to-the-orient-from-legazpi-to-malaspina/): the colonial developments in Cebu and Manila, trade and governing institutions.
- [Intramuros Administration: Intramuros](https://intramuros.gov.ph/2015/01/04/intramuros/): the 1571 Spanish city on the site of the earlier polity associated with Sulayman/Soliman. Later walls are not presented as built in a single day in 1571.
- [NHCP registry: Cebu agreement](https://philhistoricsites.nhcp.gov.ph/registry_database/unang-kasunduan-ng-kapyapaan-sa-pilipinas/): named participants in the 1565 agreement, not universal consent or every person's private motives.
- [NHCP registry: Memorare (Bangkusay)](https://philhistoricsites.nhcp.gov.ph/registry_database/memorare-bangkusay/): resistance in 1571 and the leader identified by origin in Macabebe. The lesson does not assess casualty counts or invent dialogue.
- [Library of Congress: Negotiating Empire](https://blogs.loc.gov/international-collections/2021/10/negotiating-empire-part-i-from-magellan-to-the-founding-of-manila-16th-18th-centuries/): existing regional trade, merchants and local interests in the development of the colonial presence.

These selected sources support an introductory comparison, not complete histories of both places or all colonial institutions. Independent historical, teacher, curriculum alignment and Grade 5 readability review remain pending.

## Verification

All 166 non-emulator unit checks passed. The Chrome fixture passed all six scenes, clue exploration, decisions, authored help, recovery and image loading. Checks cover two variants per quiz topic, separate easy/hard practice, mapped review, owned Mission 1 prerequisites, guarded descriptions and no premature chapter completion or badge. The builder and migration syntax checks passed. Local fixtures use mocked Firestore and do not establish live security behavior or learning effectiveness.

Next content task: Chapter 6 Mission 3, Expansion of Colonial Control and Local Responses.
