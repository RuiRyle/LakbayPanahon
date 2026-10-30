# Chapter 11 Mission 2: Muslim Polities and Communities in Mindanao and Sulu

> Publication update - 28 October 2026: This release is now published to Firestore, backed up and field-verified. See [Chapters 7-14 publication](chapters7-14-publication.md). Older status sections below record the original authoring stage.

## Status and learning structure

Built locally on 28 October 2026. Unpublished. No Firestore requests, writes, student accounts or Hosting deployment. Earlier releases and Chapter 11 Mission 1 must be published first. Independent historical, teacher, curriculum alignment and Grade 5 readability review remain pending.

Six scenes investigate distinct polities, Kudarats leadership, trade and work, agreements and practice, community/source perspectives and a five-topic report recap. Each has three clues, a decision, feedback, vocabulary and authored Explain help. Five accessible SVG guides include a timeline identifying Kudarats 1619-1671 leadership and the marker-dated 1645 peace agreement. Diagrams are modern teaching aids, not original treaties, territorial maps or exact reconstructions.

The mission keeps Sulu and Maguindanao distinct without treating all Mindanao as one polity, religion or community. Historical institutions are not equated with modern provinces. Trade, alliances, negotiation and varied work remain visible alongside conflict. Raids, captivity and coerced labor are acknowledged as harmful without graphic scenes or activities rewarding harm. Actions of particular actors are not attributed to every Muslim or every member of a named group.

The 1878 Sulu agreement example identifies text versions and asks about implementation; it does not settle every clause or present-day territorial questions. A later commemorative marker is not a transcript of every meeting. No speeches, signatures, exact borders or private motives are invented. Source desks and relationship cards are explicitly fictional models.

Students are not asked to adopt a faith, disclose ancestry or repeat insulting colonial labels. Religious identity is not an occupation, a universal motive or a measure of worth. Later source accounts retain their dates and perspectives rather than standing for every household.

Five medium main-quiz questions, one per topic, pass at three correct. Ten main-bank questions provide two finite variants per topic; ten separate easy/hard practice questions retain mapped lesson review and existing practice policy. Configured reward: 50 XP and a symbolic Polities and Communities Evidence Journal through existing one-time reward behavior. Runtime content comes from Firestore after publication; JSON is authoring input.

## Files and guarded publication

- data/chapter11-mission2-lessons.json and data/chapter11-mission2-assessments.json: authored inputs.
- functions/build-chapter11-mission2.cjs: repeatable local builder.
- data/chapter11-mission2-migration.json: 29 creates and two guarded catalog descriptions.
- functions/apply-chapter11-mission2.cjs: original project only; dry run by default; --apply commits atomically with rollback snapshot and field readback.

Nine prerequisites retain the earlier chain and require active Chapter 11 Mission 1. Catalog descriptions must match that release. Student access requires owned Chapter 10 completion and owned Chapter 11 Mission 1 completion. No learner records, challenge or chapter badge are written. Missions 3-4 and its challenge remain pending. Passing Mission 2 does not complete Chapter 11.

After availability and earlier publication are confirmed, inspect the apply scripts dry run, run with --apply, then repeat without flags to confirm zero changes. Review collisions or expected-field mismatches rather than bypassing guards. Live preflight, commit/readback and an authenticated walkthrough remain pending.

## Sources and limits

- [NHCP: Sultan Dipatuan Kudarat marker](https://philhistoricsites.nhcp.gov.ph/registry_database/sultan-dipatuan-kudarat-c-1590-1671/): named leadership, 1619-1671, alliance and the 1645 agreement. The marker is later commemoration, not an exact territorial survey or eyewitness transcript. Its broad territorial and nationalist wording is not turned into universal local control or modern boundaries.
- [Najeeb M. Saleeby: The History of Sulu, 1908](https://www.gutenberg.org/cache/epub/41771/pg41771-images.html): presents Spanish-copy and Sulu-text translations of the 1878 agreement alongside a later narrative. The lesson distinguishes text, translation and implementation, and does not adopt dated stereotypes or use the text to resolve current legal claims.
- [Sea Nomads, Sultans, and Raiders: History and Ethnogenesis in the Sulu Archipelago, Journal of Maritime Archaeology](https://link.springer.com/article/10.1007/s11457-025-09481-3): trade connections, varied communities, labor conditions and historical change. This is not used to assign raiding, coerced work or one lifestyle to every member of a religion or community. Modern regional classifications in source maps are not taught as current administrative geography.

The introductory selection does not cover every polity, leader, treaty or regional experience. Community and curriculum review are needed before claiming comprehensive coverage or classroom effectiveness.

## Verification

All 273 non-emulator unit checks passed. The six-scene Chrome fixture passed rendering, clues, decisions, authored help, image loading and recovery. Tests cover topic coverage, finite variants, separate practice, review mappings, named dates, distinct institutions, harm/source limits, owned prior-mission gating and guarded descriptions. Migration syntax passed. Mocked fixtures do not replace live security or actual student validation.

Next: Chapter 11 Mission 3, Cordillera Communities and Indigenous Autonomy.
