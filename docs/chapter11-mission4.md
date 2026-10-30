# Chapter 11 Mission 4: Diplomacy, Adaptation, Conflict, and Resistance

> Publication update - 28 October 2026: This release is now published to Firestore, backed up and field-verified. See [Chapters 7-14 publication](chapters7-14-publication.md). Older status sections below record the original authoring stage.

## Status and learning structure

Built locally on 28 October 2026. Unpublished. No Firestore requests, writes, student accounts or Hosting deployment. Earlier releases and Chapter 11 Missions 1-3 must be published first. Independent historical, teacher, curriculum alignment and Grade 5 readability review remain pending.

Six scenes compare negotiation and commitments, adaptation alongside resistance, opposition beyond armed fighting, conditions and constrained choices, aims versus outcomes, and an all-topic chapter recap. Each includes three clues, a decision, feedback, vocabulary and authored Explain help. Five accessible SVG guides are modern labelled clue cards, not original treaty pages, maps or reconstructed battles.

The mission reuses Kudarats marker-dated 1645 agreement, the UCLA account of Ifugao strategies and Saleebys dated Sulu source collection. It does not invent new historical meetings, speeches, prices or exact community decision rules. Fictional proposal, exchange and portfolio cards are labelled teaching models.

Diplomacy is an action, not merely no fighting. Adaptation can accompany maintaining local affairs. Resistance means opposition to a demand or imposed authority; not every form is armed conflict. To interpret a refusal or absence as resistance, the connection to opposition still needs evidence. People could act within constraints without equal power or unlimited freedom. Agreement, aim, implementation and outcome remain distinct.

Conflict and harm are acknowledged without attacks, targets, reenactment or points for harm. Students are not asked to prescribe fighting, surrender or religious change for a real historical community. Religion, region and leader are not universal private motives. Uncertain outcomes remain uncertain rather than being completed with invented victory or failure. Historical analysis is kept separate from present-day territorial or legal claims.

Five medium main-quiz questions, one per topic, pass at three correct. Ten main-bank questions provide two finite variants per topic; ten separate easy/hard practice questions retain mapped lesson review and existing practice policy. Configured reward: 50 XP and a symbolic Community Response Portfolio through existing one-time reward behavior. Runtime content comes from Firestore after publication; JSON is authoring input.

## Files and guarded publication

- data/chapter11-mission4-lessons.json and data/chapter11-mission4-assessments.json: authored inputs.
- functions/build-chapter11-mission4.cjs: repeatable local builder.
- data/chapter11-mission4-migration.json: 29 creates and two guarded descriptions.
- functions/apply-chapter11-mission4.cjs: original project only; dry run by default; --apply commits atomically with rollback snapshot and planned-field readback.

Eleven prerequisites retain the earlier release chain and require active Chapter 11 Missions 1-3. Catalog descriptions must match Mission 3. Student access requires owned Chapter 10 completion and all three owned prior Chapter 11 missions. No learner records, challenge or chapter badge are written. All four missions are locally authored, but their completion does not yet complete Chapter 11: its evidence challenge remains to be built.

After availability and earlier publication are confirmed, inspect the apply scripts dry run, run with --apply, then repeat without flags to verify zero changes. Review collisions or expected-field mismatches rather than bypassing guards. Live preflight, commit/readback and an authenticated walkthrough remain pending.

## Sources and limits

- [NHCP: Sultan Dipatuan Kudarat marker](https://philhistoricsites.nhcp.gov.ph/registry_database/sultan-dipatuan-kudarat-c-1590-1671/): named agreement and changing relationships. A later marker is not a full meeting transcript or every local outcome.
- [UCLA Anthropology: Indigenous Archaeology in the Philippines](https://anthro.ucla.edu/publication/indigenous-archaeology-in-the-philippines-decolonizing-ifugao-history/): resistance alongside local strategies, economic opportunities and changing organization. The summary is not every communities council procedure or a record of the fictional exchange model.
- [Najeeb M. Saleeby: The History of Sulu, 1908](https://www.gutenberg.org/cache/epub/41771/pg41771-images.html): treaty accounts, colonial positions and limits of actual authority. Treaty texts, translated versions and the later colonial-setting narrative are distinct sources; dated judgments and stereotypes are not adopted as universal facts.

The synthesis connects prior lessons rather than claiming a complete typology of every regional response. More detailed case and source notes remain in chapter11-mission1.md through chapter11-mission3.md. Classroom effectiveness and complete curriculum alignment remain unverified.

## Verification

All 281 non-emulator unit checks passed. The six-scene Chrome fixture passed rendering, clues, decisions, authored help, image loading and recovery. Tests cover topic coverage, finite variants, separate adaptive practice, mapped review, source/response/harm boundaries, three owned prior completions and guarded descriptions. Migration syntax passed. Mocked fixtures do not replace live security or actual student validation.

Next: build the Chapter 11 evidence challenge across all four missions.
