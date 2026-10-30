# Chapter 9 Mission 4: The Manila-Acapulco Galleon Trade

> Publication update - 28 October 2026: This release is now published to Firestore, backed up and field-verified. See [Chapters 7-14 publication](chapters7-14-publication.md). Older status sections below record the original authoring stage.

## Status and learning design

Built locally on 28 October 2026. Unpublished. No Firestore requests, writes, student accounts or Hosting deployment. Earlier releases and Chapter 9 Missions 1-3 must be published first. Independent historical, teacher, curriculum alignment and Grade 5 readability review remain pending.

Six scenes cover the Pacific connection, cargo and production origins, peoples work, voyage records, uneven effects and a five-topic recap. Every scene has three clues, a decision, feedback, vocabulary and authored Explain help. Five accessible SVG guides include a port-and-flow schematic showing Asian goods toward Acapulco and silver toward Manila. It is explicitly not a geographic map, exact sailing track or universal cargo manifest.

The period 1565-1815 describes this connection rather than all Philippine exchange. Acapulco is located in present-day Mexico, historically New Spain. The lesson separates loading port from production place, departure from arrival, and cargo value from workers consent, payment or equal benefits. The Covadonga is a named source example, not the identity of every teaching ship. No attack reenactment, graphic content or points for harm are used. Fictional source desks and role cards are labelled as teaching examples.

The main quiz selects five medium questions, one per topic, passing at three correct. Ten main-bank questions provide two finite variants per topic. Ten separate easy/hard practice questions retain mapped lesson review and existing practice policy. Configured reward: 50 XP and the symbolic Galleon Network Evidence Journal through existing one-time reward behavior. Runtime content comes from Firestore after publication; JSON is authoring input.

## Files and publication

- data/chapter9-mission4-lessons.json and data/chapter9-mission4-assessments.json: authoring inputs.
- functions/build-chapter9-mission4.cjs: repeatable local builder.
- data/chapter9-mission4-migration.json: 29 creates and two guarded catalog description updates.
- functions/apply-chapter9-mission4.cjs: original project only; dry run by default; --apply commits atomically, saves a rollback snapshot and verifies planned fields.

Ten publication prerequisites preserve the release chain and require active Chapter 9 Missions 1-3. Catalog descriptions must match Mission 3. Student access requires all three owned prior completions. No learner records, challenge or chapter badge are written. Mission 5 and the chapter challenge remain unfinished; completing this mission alone does not complete Chapter 9.

After database availability and earlier publication are confirmed, inspect the apply scripts dry run, run with --apply, then repeat without flags to verify zero changes. Review collisions or expected-value mismatches rather than bypassing guards. Live preflight, commit/readback and an authenticated walkthrough remain pending.

## Sources and limits

- [Metropolitan Museum: The Manila Galleon Trade, 1565-1815](https://www.metmuseum.org/essays/the-manila-galleon-trade-1565-1815): goods, silver, the Pacific connection and selected artistic exchanges. These examples are not every ships cargo or evidence of universal benefits.
- [The National Archives: Papers of Nuestra Senora de Covadonga](https://www.nationalarchives.gov.uk/explore-the-collection/stories/papers-of-nuestra-senora-de-covadonga/): named ship papers, trade directions and capture as a specific voyage outcome. Search-indexed source text was available; direct retrieval returned 403. Detailed voyage chronology and cargo quantities are not reconstructed from it.
- [Kristyl Obispado, The 16th century Carrera del Pacifico, Philippine Review of Economics 60(2), 2023](https://pre.econ.upd.edu.ph/index.php/pre/article/viewFile/1046/970): household production, weaving and cargo work in the early trade. The lesson does not extend every sixteenth-century arrangement unchanged across the full period.

This is an introductory network investigation, not a complete history of trans-Pacific navigation, all labor conditions or every trade regulation. It does not imply that the route began Philippine trade or that its ending stopped all exchange. Classroom learning effectiveness remains unverified.

## Verification

All 235 non-emulator unit checks passed. The six-scene Chrome fixture passed rendering, clues, decisions, authored help, image loading and recovery. Tests cover quiz variants, separate practice, review mappings, route directions, historical limits, owned prior-mission gating and guarded catalog descriptions. Migration syntax passed. Mocked fixtures do not replace live security or authenticated student validation.

Next: Chapter 9 Mission 5, Effects of Colonial Economic Policies on Communities.
