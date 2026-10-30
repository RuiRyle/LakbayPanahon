# Chapter 12 Mission 3: Religious and Political Revolts

> Publication update - 28 October 2026: This release is now published to Firestore, backed up and field-verified. See [Chapters 7-14 publication](chapters7-14-publication.md). Older status sections below record the original authoring stage.

## Status and learning structure

Built locally on 28 October 2026. Unpublished. No Firestore requests, writes, student accounts or Hosting deployment. Earlier releases and Chapter 12 Missions 1-2 must be published first. Independent historical, teacher, curriculum alignment and Grade 5 readability review remain pending.

Six scenes examine overlapping concerns, Dagohoys grievance and local organization, Apolinario de la Cruz and the Cofradia, movement duration versus a founders life, respectful source comparison and a five-topic recap. Each has three clues, a decision, feedback, vocabulary and authored Explain help. Five accessible SVG guides include a movement-span timeline. They are modern teaching aids rather than authentic registers, rituals, government charts or historical testimony.

The Dagohoy case connects a reported burial dispute with later local organization without making one trigger every participants motive. The 1744-1829 span labels the movement, not the founders birth/death or personal leadership of every stage. CulturEd explicitly states uncertainty about his death and continuation after him; the timeline leaves the personal date unfilled.

The Cofradia case identifies a religious association and the later markers commemoration of religious freedom and social rights. It does not turn that later language into every members exact words or reconstruct the whole 1841 chronology. The source spelling Hermano Puli and the familiar variant Hermano Pule are identified without confusing him with other people named de la Cruz.

Religious concerns and political authority can overlap. A shared theme is not proof of coordination, identical aims or a universal modern national program. Specific institutional actions do not make every believer responsible. Students do not adopt a faith, perform a burial ceremony or prayer, disclose religion, reenact conflict or earn points for retaliation. No graphic harm is illustrated. Sorting and portfolio cards are labelled fictional models.

Five medium quiz questions, one per topic, pass at three correct. Ten main-bank questions provide two finite variants per topic; ten separate easy/hard practice questions retain mapped lesson review and existing practice policy. Configured reward: 50 XP and the symbolic Religious and Political Evidence Journal through existing one-time reward behavior. Runtime content comes from Firestore after publication; JSON is authoring input.

## Files and guarded publication

- data/chapter12-mission3-lessons.json and data/chapter12-mission3-assessments.json: authored inputs.
- functions/build-chapter12-mission3.cjs: repeatable local builder.
- data/chapter12-mission3-migration.json: 29 creates and two guarded catalog descriptions.
- functions/apply-chapter12-mission3.cjs: original project only; dry run by default; --apply commits atomically with rollback snapshot and planned-field readback.

Nine prerequisites preserve the earlier release chain and require Chapter 12 Missions 1-2. Catalog descriptions must match Mission 2. Student access requires both owned prior mission completions under existing independent-era access. No learner records, challenge or chapter badge are written. Missions 4-5 and the final challenge remain pending. Passing Mission 3 does not complete Chapter 12.

After availability and earlier publication are confirmed, inspect the apply scripts dry run, run with --apply, then repeat without flags to verify zero changes. Review collisions or changed expected fields rather than bypassing guards. Live preflight, commit/readback and an authenticated walkthrough remain pending.

## Sources and limits

- [NCCA CulturEd: Francisco Dagohoy](https://philippineculturaleducation.com.ph/dagohoy-francisco/): reported burial concern, local organization, uncertain death and continuation after the founder. The entries opening wording about leadership across the whole span is read alongside its explicit later qualification; no lifelong leadership claim is taught. Graphic details and supernatural name-origin claims are not reproduced.
- [NHCP: In Memory of Francisco Dagohoy](https://philhistoricsites.nhcp.gov.ph/registry_database/in-memory-of-francisco-dagohoy/): the named movement span and independent-government commemoration. This brief later marker does not define every institution, territorial extent or household membership, nor establish a modern republic.
- [NHCP legacy registry: Apolinario de la Cruz](https://nhcphistoricsites.blogspot.com/2021/07/apolinario-de-la-cruz-18151841.html): named association, Lucban setting and commemorated faith/social-rights concerns. The current registry page timed out; the official legacy registry supplied the marker text. Its brief death wording is not used to reconstruct the conflict or execution, and later rights language is not an invented historical quotation.

This introductory treatment is not a complete account of every religious or political revolt or every Cofradia stage. Regional-history, community and curriculum review remain important; classroom learning effectiveness is unverified.

## Verification

All 296 non-emulator unit checks passed. The six-scene Chrome fixture passed rendering, clues, decisions, authored help, image loading and recovery. Tests cover topic coverage, finite variants, separate practice, review mappings, date/source/belief boundaries, both owned prior completions and guarded descriptions. Migration syntax passed. Mocked fixtures do not replace live security or actual student validation.

Next: Chapter 12 Mission 4, Leaders, Communities, and Regional Participation.
