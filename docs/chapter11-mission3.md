# Chapter 11 Mission 3: Cordillera Communities and Indigenous Autonomy

> Publication update - 28 October 2026: This release is now published to Firestore, backed up and field-verified. See [Chapters 7-14 publication](chapters7-14-publication.md). Older status sections below record the original authoring stage.

## Status and learning structure

Built locally on 28 October 2026. Unpublished. No Firestore requests, writes, student accounts or Hosting deployment. Earlier releases and Chapter 11 Missions 1-2 must be published first. Independent historical, teacher, curriculum alignment and Grade 5 readability review remain pending.

Six scenes distinguish regional diversity, local strategies, landscape history and archaeological context, exchange versus authority, collaborative evidence and an all-topic recap. Each includes three clues, a decision, feedback, vocabulary and authored Explain help. Five accessible SVG teaching guides include a fictional two-layer context diagram, explicitly not the actual Old Kiyyangan excavation profile or a universal terrace chronology.

Ifugao is a named case within the Cordillera region, not a substitute for all regional communities. The mission explains strategies and changing organization alongside terrain. It does not make mountains the only cause, resistance a guarantee of equal power, or autonomy proof of isolation and timelessness. A teaching council or exchange card is not presented as a surviving meeting or transaction.

The archaeology scene introduces recorded context and the limits of a date. It does not assign one exact age to every terrace, reproduce sacred objects or ask students to dig or collect finds. Old Kiyyangan is named as an archaeological setting associated with Museum collections, without asserting an unsupported complete site chronology.

Living communities are not museum objects. Later textiles and collection records retain their dates rather than proving all colonial designs. Collaborative research is not one voice automatically speaking for every person or period. Students are not asked to disclose identity, perform rituals, copy community patterns or handle heritage objects.

Five medium quiz questions, one per topic, pass at three correct. Ten main-bank questions provide two finite variants per topic; ten separate easy/hard practice questions retain mapped lesson review and existing practice policy. Configured reward: 50 XP and a symbolic Cordillera Evidence Journal through existing one-time reward behavior. Runtime instructional data comes from Firestore after publication; JSON is authoring input.

## Files and guarded publication

- data/chapter11-mission3-lessons.json and data/chapter11-mission3-assessments.json: authored inputs.
- functions/build-chapter11-mission3.cjs: repeatable local builder.
- data/chapter11-mission3-migration.json: 29 creates and two guarded catalog descriptions.
- functions/apply-chapter11-mission3.cjs: original project only; dry run by default; --apply commits atomically with rollback snapshot and planned-field readback.

Ten prerequisites retain the earlier release chain and require Chapter 11 Missions 1-2. Catalog descriptions must match Mission 2. Student access requires owned Chapter 10 completion and both owned prior Chapter 11 missions. No learner records, challenge or chapter badge are written. Mission 4 and its final challenge remain pending. Passing this mission does not complete Chapter 11.

After availability and earlier publication are confirmed, inspect the apply scripts dry run, run with --apply, then repeat without flags to verify zero changes. Review collisions or changed expected fields rather than bypassing guards. Live preflight, commit/readback and an authenticated walkthrough remain pending.

## Sources and limits

- [UCLA Anthropology: Indigenous Archaeology in the Philippines, 2022](https://anthro.ucla.edu/publication/indigenous-archaeology-in-the-philippines-decolonizing-ifugao-history/): Acabado and Martins research summary supports Ifugao strategies, changing organization, economic connections and community collaboration. Its statement challenging older terrace narratives is not converted into a single age for every terrace. No detailed council procedure, excavation sequence or transaction is invented from a summary.
- [National Museum: Cordillera](https://www.nationalmuseum.gov.ph/our-museums/regional-area-and-site-museums/cordillera/): varied regional textile traditions, makers, later collection dates, Ifugao objects and Old Kiyyangan collections. A modern museum account is not every colonial communitys government or an exact territorial map. The page includes a relative age for a bench; this changing age claim is not used.

The chapter remains introductory. Additional regional histories and community review are needed before claiming comprehensive Cordillera coverage. No present-day legal autonomy or boundary question is decided. Classroom learning effectiveness remains unverified.

## Verification

All 277 non-emulator unit checks passed. The six-scene Chrome fixture passed rendering, clues, decisions, authored help, image loading and recovery. Tests cover topic coverage, finite variants, separate practice, mapped review, community/source/context limits, both owned prior completions and guarded descriptions. Migration syntax passed. Mocked fixtures do not replace live security or actual student validation.

Next: Chapter 11 Mission 4, Diplomacy, Adaptation, Conflict, and Resistance.
