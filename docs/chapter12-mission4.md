# Chapter 12 Mission 4: Leaders, Communities, and Regional Participation

> Publication update - 28 October 2026: This release is now published to Firestore, backed up and field-verified. See [Chapters 7-14 publication](chapters7-14-publication.md). Older status sections below record the original authoring stage.

Built locally on 28 October 2026. Unpublished. No Firestore requests, writes, student accounts or Hosting deployment. Historical, teacher, curriculum alignment and Grade 5 readability review remain pending.

Six scenes cover leadership versus wider community participation, Gabriela Silangs continuation, regional reach versus joining, differing roles and constraints, source portfolios and a recap. Each has three clues, a decision with feedback, vocabulary and authored Explain help. Five accessible SVG guides are modern clue cards rather than original registers, portraits, maps or eyewitness accounts.

The mission records Gabrielas continuation of the Ilocos uprising in 1763 without inventing speeches or member counts. It does not use disputed birth dates or the markers sweeping first-woman claim. Sumuroys regional spread does not establish universal membership. The Dagohoy example illustrates changing movement stages without treating a founders life as the whole movement. Fictional role cards do not invent actual participant jobs or households.

Students do not disclose family identity or resources, assign roles from gender/religion/ancestry, select targets or reenact harm. Missing names are not proof of no contribution. A commemorative leader summary is not a complete community biography. Later Mission 5 will develop outcomes and significance.

The five-question medium quiz passes at three correct. Ten main-bank items provide two finite variants per topic, with ten separate easy/hard practice items and mapped lesson review. Configured reward: 50 XP and a symbolic Participation Evidence Journal through existing one-time reward behavior. Runtime content comes from Firestore after publication; JSON is authoring input.

## Publication

Authoring inputs: data/chapter12-mission4-lessons.json and data/chapter12-mission4-assessments.json. Builder: functions/build-chapter12-mission4.cjs. Generated plan: data/chapter12-mission4-migration.json. Apply script: functions/apply-chapter12-mission4.cjs.

The plan has 29 creates and two guarded catalog descriptions, with ten prerequisites retaining the earlier chain and Chapter 12 Missions 1-3. Description expectations match Mission 3. The original-project apply script defaults to dry run; --apply commits atomically with rollback snapshot and field readback. Publish earlier releases first, inspect the dry run, apply, then repeat the dry run to verify zero changes. Review collisions instead of bypassing guards.

Student access requires all three owned prior completions. No learner records, final challenge or badge are written. Mission 5 and the chapter challenge remain pending. Live preflight, commit/readback and an authenticated walkthrough have not run.

## Sources and limits

- [NHCP: Maria Josefa Gabriela Silang](https://philhistoricsites.nhcp.gov.ph/registry_database/maria-josefa-gabriela-silang-1723-1763/): recorded continuation of leadership. Later commemoration does not provide every meeting, participant or motive; birth-year discrepancies and universal first claims are not taught.
- [NHCP: Agustin Sumuroy](https://philhistoricsites.nhcp.gov.ph/registry_database/agustin-sumuroy/): named beginning and regional spread, not a full local participant register. Graphic death details are omitted.
- [NCCA CulturEd: Francisco Dagohoy](https://philippineculturaleducation.com.ph/dagohoy-francisco/): explicit continuation after the founder and uncertainty about his death, not evidence that one person led every year.

This introductory selection does not establish complete participation histories or classroom learning effectiveness.

## Verification

All 300 non-emulator unit checks passed. The Chrome fixture passed six-scene rendering, clue exploration, decisions, authored help, image loading and recovery. Tests cover banks, review mappings, source/role limits, owned prior-completion gating and guarded descriptions. Migration syntax passed. Mocked Firestore does not establish live security or actual student behavior.

Next: Chapter 12 Mission 5, Outcomes and Historical Significance of Early Revolts.
