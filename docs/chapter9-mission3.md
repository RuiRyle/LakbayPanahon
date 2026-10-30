# Chapter 9 Mission 3: Agriculture, Monopolies, and Economic Policies

> Publication update - 28 October 2026: This release is now published to Firestore, backed up and field-verified. See [Chapters 7-14 publication](chapters7-14-publication.md). Older status sections below record the original authoring stage.

## Status and learning structure

Built locally on 28 October 2026. Unpublished. No Firestore requests, writes, student accounts or Hosting deployment. Earlier releases, including Chapter 9 Missions 1-2, must be published first. Independent historical, teacher, curriculum alignment and Grade 5 readability review remain pending.

Six scenes investigate household and market uses of crops, economic policy and buyer choice, the tobacco monopoly, income and costs, policy change, and a five-topic recap. Each has three explorable clues, a decision, feedback, vocabulary and authored Explain help. Five accessible SVG diagrams are modern teaching guides, not original farm records or maps of monopoly districts.

The mission explains that food crops can also be sold, cash crops do not guarantee wealth, and an official aim is not proof of outcomes. The monopoly example distinguishes government revenue from growers experiences and limits compulsory cultivation claims to designated districts. Tobacco is historical subject matter; no activity encourages cultivation, handling or use. No brands or consumption instructions are provided.

The NHCP marker supplies March 1782 as formal establishment and 1882 as abolition. Sources also discuss earlier orders and preparations; the lesson does not collapse every legal and operational stage into one date. The end of the monopoly is not taught as the end of farming, trade or taxation. The later date in the Pelzer article title is not used to override the marker or the article opening, which discusses 1782-1882.

A fictional eight-token receipt minus five tokens of listed costs leaves three. The lesson labels this as a model, not historical pesos, a universal crop price or a complete farm budget. It asks whether unlisted costs and unpaid work are missing. The reward recognizes explanation, not extraction or tobacco production.

Five medium quiz questions, one per topic, pass at three correct. Ten main-bank questions provide two finite variants per topic. Ten separate easy/hard practice questions retain mapped lesson review and existing adaptive policy. Configured reward is 50 XP and a symbolic Agriculture Policy Evidence Journal through existing one-time reward behavior. Runtime instructional content will come from Firestore; JSON is authoring input.

## Publication

- data/chapter9-mission3-lessons.json and data/chapter9-mission3-assessments.json: authoring inputs.
- functions/build-chapter9-mission3.cjs: repeatable local builder.
- data/chapter9-mission3-migration.json: 29 new curriculum documents and two guarded catalog description updates.
- functions/apply-chapter9-mission3.cjs: original project only; dry run by default; --apply commits atomically, saves a rollback snapshot and verifies planned fields.

Nine prerequisites retain the earlier release chain and require active Chapter 9 Missions 1-2. Description guards expect the Mission 2 release. Student access requires both owned prior mission completions. No learner records, chapter challenge or badge are written. Missions 4-5 remain unfinished; passing Mission 3 alone does not complete Chapter 9.

After database availability and earlier publication are confirmed, run the apply script without flags, inspect its dry run, use --apply, then repeat without flags to confirm zero changes. Review collisions or changed expected fields rather than bypassing guards. Live preflight, commit/readback and an authenticated walkthrough remain pending.

## Sources and limits

- [NHCP registry: Abolition of Tobacco Monopoly](https://philhistoricsites.nhcp.gov.ph/registry_database/abolition-of-tobacco-monopoly/): formal establishment and abolition dates. The marker is later commemoration, not a grower diary.
- [W. Wolters, A Comparison Between the Taxation Systems in the Philippines under Spanish Rule and Indonesia under Dutch Rule during the 19th Century](https://www.asj.upd.edu.ph/mediabox/archive/ASJ-21-1983/wolters.pdf): printed page 93 describes designated districts, compulsory cultivation, official purchase and prices, revenue and burdens. The mission does not reproduce its broad social labels or make district rules universal.
- [Karl J. Pelzer, The Spanish Tobacco Monopoly in the Philippines and the Dutch Forced Cultivation System, Archipel 8, 1974](https://www.persee.fr/doc/arch_0044-8613_1974_num_8_1_1192): opening page 147 discusses the revenue aim and changing markets. It does not establish every households outcome or all agricultural policy.

The household and buyer-choice exercises are explicitly fictional reasoning models. This introductory mission is not exhaustive regional agricultural history or a complete treatment of every monopoly. Passing is not evidence of classroom effectiveness or complete curriculum mastery.

## Verification

All 231 non-emulator unit checks passed. The six-scene Chrome fixture passed rendering, clues, decisions, authored help, image loading and recovery. Tests cover topic coverage, finite retries, separate practice, mapped review, model arithmetic and boundaries, scope/date wording, both owned prior completions and guarded descriptions. Migration syntax passed. Mocked fixtures do not replace live security checks, publication validation or classroom review.

Next: Chapter 9 Mission 4, The Manila-Acapulco Galleon Trade.
