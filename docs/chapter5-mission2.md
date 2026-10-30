# Chapter 5 Mission 2: Magellan's expedition and early encounters

## Student learning

This mission follows the approved roadmap after European Exploration and Its Motives. Six scenes teach a selected encounter sequence, Homonhon assistance and exchange, interpreting and Limasawa, local decisions in Cebu, source viewpoints, and a final supported report. Every scene has three explorable clues, a decision with feedback, vocabulary and authored help. Four local SVG diagrams illustrate event order, exchange, communication and source checks. They are teaching diagrams, not original images or a navigation map.

The lesson distinguishes seeing land from landing, assistance from surrender, a recorded religious event from universal conversion, and one leader's decision from everyone's consent. Religious events are taught as history; the student is not asked to practise a faith. Classroom examples are marked fictional. The content does not invent original speeches or claim that the expedition began local history.

The existing student workflow handles the five-question quiz (three correct to pass), one medium question per topic, two bank variants per topic and separate easy/hard practice. Each weak topic maps back to its teaching scene and the recap. Two quiz variants per topic provide a finite question pool; unlimited never-seen retries are not promised. Passing awards the configured 50 XP and symbolic Encounter Reporter Journal through the existing one-time reward behavior.

Only Missions 1-2 are available. Missions 3-4 and the chapter challenge remain unfinished; no chapter badge or challenge was added. Existing independent-era access remains unchanged.

## Authoring and guarded publication

Lesson input: `data/chapter5-mission2-lessons.json`.
Assessment input: `data/chapter5-mission2-assessments.json`.
Builder: `node functions/build-chapter5-mission2.cjs`.
Publication: `node functions/apply-chapter5-mission2.cjs` (dry run), adding `--apply` commits.

The plan creates 29 documents: one mission, one quiz, six scenes, ten main questions, ten practice questions and one collectible. Two existing era/chapter descriptions are updated with expected-value guards. The 31 changes were committed atomically to the original `lakbaypanahon-1797e` Firestore database, backed up and read back field by field. No learner data is part of that publication plan. Runtime learning data comes from Firestore; JSON files remain authoring inputs. Local illustrations need the current website files; Firebase Hosting was not deployed.

## Source basis

- [NHCP Homonhon marker](https://philhistoricsites.nhcp.gov.ph/registry_database/homonhon-ruta-ng-ekspedisyon-magallanes-elcano-sa-pilipinas/): landfall, supplies and exchange. Its dated event descriptions distinguish landfall on 17 March from assistance on 18 March.
- [NHCP Cebu marker](https://philhistoricsites.nhcp.gov.ph/registry_database/cebu-ruta-ng-ekspedisyon-magallanes-elcano-sa-pilipinas/): existing trading place, Humabon, arrival and baptisms.
- [NQC discussion of the NHCP Limasawa decision](https://www.nqc.gov.ph/en/resources/ending-the-limasawa-controversy/): the recorded Easter Sunday Mass and the commission's recognized site. This is presented as the NHCP position, not a claim that no historical debate ever existed.
- [NQC expedition route resource](https://www.nqc.gov.ph/en/map/): selected sequence and interpreting during encounters.
- [Library of Congress discussion of early encounters](https://blogs.loc.gov/international-collections/2021/10/negotiating-empire-part-i-from-magellan-to-the-founding-of-manila-16th-18th-centuries/): Pigafetta's account, local interests and the limits of a single viewpoint.

This is source-informed teaching content. Independent historical, teacher, curriculum alignment and Grade 5 readability review remain pending. Software checks do not establish learning effectiveness or full curriculum coverage.

## Verification

145 non-emulator unit checks passed. The Chrome story fixture verified all six new scenes, clue exploration, decisions, authored help, recovery and image loading. Publication readback verified every planned Firestore field. A final dry run should show zero changes after publication.

The real signed-in Chapter 5 walkthrough also passed: a temporary account completed both missions through actual lesson and quiz controls, restored saved scene progress after refresh, received configured XP/collectibles, and received no duplicate XP on replay. No premature chapter completion or badge was granted. The temporary account and its owned records were removed. Report: `docs/validation/chapter5-live-2026-10-28.json`.
