# Chapter 9 Mission 5: Effects of Colonial Economic Policies on Communities

> Publication update - 28 October 2026: This release is now published to Firestore, backed up and field-verified. See [Chapters 7-14 publication](chapters7-14-publication.md). Older status sections below record the original authoring stage.

## Status and learning structure

Built locally on 28 October 2026. Unpublished. No Firestore requests, writes, student accounts or Hosting deployment. Earlier releases and Chapter 9 Missions 1-4 must be published first. Independent historical, teacher, curriculum alignment and Grade 5 readability review remain pending.

Six scenes connect the earlier chapter through household resources, time and work, production and selling choices, different outcomes, recorded responses and a five-topic report recap. Each has three clues, a decision, feedback, vocabulary and authored Explain help. Five accessible SVG teaching guides are labelled modern examples rather than original household accounts.

A fictional resource comparison leaves nine tokens from twelve and four from seven after the same three-token demand. A fictional eight-slot calendar leaves five after three slots are assigned away. These are reasoning models, not actual rates, rice measures, money, service days or universal legal rules. Students are not asked to disclose private family finances or problems.

The mission keeps tribute, labor and compulsory produce delivery distinct. Payment is not proof of freely chosen participation. One government or merchant total is not every households experience. A complaint is not proof of a successful outcome, and an official accounts silence is not universal agreement. Sumuroys Palapag case is dated and limited to a named example, without invented dialogue, fighting reenactment or graphic detail. Tobacco monopoly references concern policy scope rather than use or promotion.

Five medium quiz questions, one per topic, pass at three correct. Ten main-bank questions provide two finite variants per topic. Ten separate easy/hard practice questions retain mapped lesson review and existing practice policy. Configured reward: 50 XP and a symbolic Community Economy Evidence Journal through existing one-time reward behavior. Runtime instructional data comes from Firestore after publication; JSON remains authoring input.

## Files and publication

- data/chapter9-mission5-lessons.json and data/chapter9-mission5-assessments.json: authored inputs.
- functions/build-chapter9-mission5.cjs: repeatable local builder.
- data/chapter9-mission5-migration.json: 29 creates and two guarded catalog description updates.
- functions/apply-chapter9-mission5.cjs: original project only; dry run by default; --apply commits atomically, saves a rollback snapshot and verifies planned fields.

Eleven prerequisites retain the earlier release chain and require Chapter 9 Missions 1-4. Catalog descriptions must match Mission 4. Student access requires all four owned prior completions. No learner records, chapter challenge or badge are written. Completing all five missions does not yet complete Chapter 9: its final evidence challenge remains to be built.

After availability and earlier publication are confirmed, inspect the apply scripts dry run, run with --apply, then repeat without flags to confirm zero changes. Review collisions and changed expected fields rather than bypassing guards. Live preflight, commit/readback and an authenticated walkthrough remain pending.

## Sources and limits

- [W. Wolters, A Comparison Between the Taxation Systems in the Philippines under Spanish Rule and Indonesia under Dutch Rule during the 19th Century](https://www.asj.upd.edu.ph/mediabox/archive/ASJ-21-1983/wolters.pdf): designated monopoly districts, production and official purchase, with differing institutional and local interests. This does not establish one identical rule or household effect for every island and period.
- [NHCP registry: Agustin Sumuroy](https://philhistoricsites.nhcp.gov.ph/registry_database/agustin-sumuroy/): Palapag, protest against forced labor and abuses, and 1 June 1649. The later marker is not an eyewitness diary or every participants private testimony.
- [Kristyl Obispado, The 16th century Carrera del Pacifico, Philippine Review of Economics 60(2), 2023](https://pre.econ.upd.edu.ph/index.php/pre/article/viewFile/1046/970): household production, weaving and cargo work in the early trade. Unnamed contributors are not assumed absent; particular payment and household outcomes require their own evidence.

This synthesis reuses concepts taught in Missions 1-4 rather than introducing invented historical household budgets. Models illustrate possible relationships; they are not proof of a particular community outcome. Classroom learning effectiveness and complete curriculum coverage remain unverified.

## Verification

All 239 non-emulator unit checks passed. The six-scene Chrome fixture passed rendering, clues, decisions, authored help, image loading and recovery. Tests cover quiz variants, separate adaptive practice, review mappings, model arithmetic and boundaries, scope and source limits, four owned prior completions and guarded catalog descriptions. Migration syntax passed. Mocked fixtures do not replace live security or authenticated student validation.

Next: build the Chapter 9 evidence challenge across all five missions.
