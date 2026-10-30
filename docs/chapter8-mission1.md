# Chapter 8 Mission 1: Missionaries and the Spread of Christianity

> Publication update - 28 October 2026: This release is now published to Firestore, backed up and field-verified. See [Chapters 7-14 publication](chapters7-14-publication.md). Older status sections below record the original authoring stage.

## Status

Built locally on 28 October 2026. Unpublished. No live Firestore requests, writes or temporary student accounts were used. Database availability was not rechecked. Earlier pending chapters and their challenges must be published first. Hosting was not deployed.

## Learning design

Six scenes investigate missionary aims, the distinction between 1521 events and a 1565 Augustinian arrival example, communication and the 1593 Doctrina Christiana, colonial context, different responses and source viewpoints, and a supported report. Each scene has three explorable clues, a decision with feedback, vocabulary and authored help. Four accessible SVG teaching guides accompany the scenes. They are not original pages or ceremony photographs.

The mission studies religious history without asking students to pray, recite religious material, profess belief or disclose their own religion. Assessments test historical reasoning. Catholic, Muslim, Indigenous and other religious histories are treated respectfully; communities are not ranked by adoption of a faith. Earlier traditions are not described as an empty space.

Missionary aims, documented arrivals, production of teaching material, its reception and private belief are distinct claims. A ceremony record or a text does not establish universal conversion. Local responses can differ over time and place. Religious work is studied within colonial power, pressure and local political interests without assuming every participant had one motive. The following missions develop patronage, community changes and responses further.

The main quiz selects five medium questions, one per topic, and requires three correct to pass. Ten bank questions supply two variants per topic; the pool is finite. Ten separate easy/hard practice questions use existing adaptive review policy, with topics mapped to teaching scenes and recap. Runtime content comes from Firestore after publication; JSON remains authoring input.

Configured reward: 50 XP and a symbolic Religious History Evidence Journal through existing one-time reward behavior. The reward recognizes historical learning, not conversion or religious practice. No Chapter 8 badge or challenge is created. Only Mission 1 is authored in this release.

## Progression and publication

Chapter 8 follows Chapter 7 within Era 2 and requires the student's own saved Chapter 7 completion. Another person's completion does not unlock it. Existing continuation logic can offer Chapter 8 only when an active, ready chapter with active mission content exists; this migration does not alter progression policy or student records.

- `data/chapter8-mission1-lessons.json`: six lesson authoring inputs.
- `data/chapter8-mission1-assessments.json`: quiz and harder practice inputs.
- `functions/build-chapter8-mission1.cjs`: builds the plan.
- `data/chapter8-mission1-migration.json`: 30 new documents and one guarded era-description update.
- `functions/apply-chapter8-mission1.cjs`: original database only, dry run by default; atomic commit with backup/preconditions and readback with `--apply`.

Seven prerequisites require Chapter 7, its four missions, its challenge and its badge. The era description must match the Chapter 7 challenge release. Publish earlier pending content in sequence first. No learner collection is included. Review collisions or changed expected fields rather than bypassing guards.

After database availability and earlier publication:

```powershell
node functions/apply-chapter8-mission1.cjs
node functions/apply-chapter8-mission1.cjs --apply
node functions/apply-chapter8-mission1.cjs
```

The repeat dry run should show zero changes. Live preflight, commit, readback and signed-in walkthrough remain pending.

## Sources and limits

- [Library of Congress: Catholicism in the Philippines during the Spanish Colonial Period](https://blogs.loc.gov/international-collections/2018/07/catholicism-in-the-philippines-during-the-spanish-colonial-period-1521-1898/): missionary activity in a setting with earlier religious traditions. Its missionary-source discussion is not treated as every local voice.
- [NHCP marker: Mga Relihiyosong Agustino sa Pilipinas](https://philhistoricsites.nhcp.gov.ph/registry_database/mga-relihiyosong-agustino-sa-pilipinas/): the named Augustinian arrival with Urdaneta in 1565. The lesson does not assess every order's arrival year or infer conversion from arrival.
- [Library of Congress: Doctrina Christiana, 1593](https://www.loc.gov/item/48031307/): the surviving Spanish/Tagalog teaching text and writing systems. The lesson avoids a disputed universal printing-priority exercise and does not infer readership or belief from production.
- [Library of Congress: Negotiating Empire](https://blogs.loc.gov/international-collections/2021/10/negotiating-empire-part-i-from-magellan-to-the-founding-of-manila-16th-18th-centuries/): the interaction of religious events, local interests, alliances and coercion.
- [Australian National University: The Philippines at the Turn of the Sixteenth Century, Christianity](https://intersections.anu.edu.au/monograph1/mintz_christianity.html): missionary communication through local languages. Its discussion does not establish identical understanding by every speaker.

Fictional reports are classroom tools, not authentic quotations. Independent historical, teacher, curriculum alignment and Grade 5 readability review remain pending. This introductory mission does not replace later religious-institution and community-response content or establish learning effectiveness.

## Verification

All 204 non-emulator unit checks passed. The six-scene Chrome fixture passed clues, decisions, authored help, recovery and image loading. Checks cover assessment coverage, retry variants, separate practice, scene mapping, religious-neutrality wording, owned Chapter 7 prerequisites, no premature chapter completion and continuation only with available mission content. Builder and migration syntax checks passed. Fixtures use mocked Firestore; live security and student verification remain pending.

Next: Chapter 8 Mission 2, The Patronato Real and Religious Authority.
