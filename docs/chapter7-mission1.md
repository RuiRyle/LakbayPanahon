# Chapter 7 Mission 1: The Governor-General and Central Government

> Publication update - 28 October 2026: This release is now published to Firestore, backed up and field-verified. See [Chapters 7-14 publication](chapters7-14-publication.md). Older status sections below record the original authoring stage.

## Status

Built locally on 28 October 2026. **Not published.** No live Firestore requests, writes or temporary student accounts were used for this task. Database availability was not rechecked. Earlier pending Chapter 5 and Chapter 6 releases must be published first. Hosting was not deployed.

## Learning design

Six illustrated interactive scenes teach the governor-general's relationship with the Spanish Crown, broad civil/military responsibilities, issue/delivery/implementation of orders, the Real Audiencia, source viewpoints and a final supported report. Every scene includes three explorable clues, a decision with feedback, vocabulary and authored help. Four accessible SVG teaching guides illustrate authority, duties, an order's stages and institutions. They are simplified models, not unchanged charts for every colonial year or original records.

The lesson distinguishes an office from its holder and a colonial governor-general from a modern elected Philippine president. Broad responsibilities do not mean one person carried out every task. The Audiencia is introduced as a court with other governmental functions; the governor-general's presiding role is not recast as modern separation of powers. Exact establishment dates, changing membership counts and later reforms are not assessed here. An institution's existence does not prove universal fairness or access. A recorded order requires separate evidence of implementation and effects.

Worked orders and exhibit captions are explicitly fictional classroom exercises, not authentic documents or speeches. Local experiences remain part of the inquiry rather than treating an official account as every resident's viewpoint. Later missions develop local government, tribute/encomienda and settlement reorganization.

The main quiz uses five medium questions, one per topic, with three correct required to pass. Ten main questions provide two variants per topic; the finite bank does not promise unlimited never-seen retries. Ten separate easy/hard practice questions use the existing review policy. Weak topics map back to the teaching scene and final recap. Runtime learning data comes from Firestore after publication; local JSON is authoring input.

The configured reward is 50 XP and a symbolic Central Government Evidence Journal through existing one-time reward behavior. No chapter challenge or badge is created. Chapter 7 remains partial, with only Mission 1 authored here.

## Progression

Chapter 7 follows Chapter 6 within the existing Era 2 order. It requires the student's own saved Chapter 6 completion; another person's completion cannot unlock it. Once the new chapter and mission are actually available, existing continuation logic can offer Chapter 7 after Chapter 6 completion. Missing mission content must retain the unavailable-content fallback. No progression policy or student record is changed by the migration.

## Authoring and publication

- `data/chapter7-mission1-lessons.json`: six lesson inputs.
- `data/chapter7-mission1-assessments.json`: quiz variants and harder practice inputs.
- `functions/build-chapter7-mission1.cjs`: builds the content plan.
- `data/chapter7-mission1-migration.json`: 30 new documents and one guarded era-description update.
- `functions/apply-chapter7-mission1.cjs`: original project only; dry run by default, atomic commit with backup/preconditions and field-by-field readback when `--apply` is supplied.

Seven preflight prerequisites require Chapter 6, its four active missions, challenge and badge. The era description must match the Chapter 6 challenge release. Publish earlier pending Chapter 5 releases and all Chapter 6 releases in sequence first. No learner collection is part of the plan. Review any expected-value mismatch rather than removing the guard.

After database availability and earlier publication are confirmed:

```powershell
node functions/apply-chapter7-mission1.cjs
node functions/apply-chapter7-mission1.cjs --apply
node functions/apply-chapter7-mission1.cjs
```

The final dry run should report zero changes. Live preflight, commit, readback and signed-in walkthrough remain pending.

## Source basis and review limits

- [Supreme Court of the Philippines: historical account of the Real Audiencia](https://sc.judiciary.gov.ph/10-3/): judicial and other governmental functions, with the governor-general as presiding officer in the described historical arrangement.
- [NCCA: Gateway to the Orient](https://ncca.gov.ph/about-culture-and-arts/in-focus/philippines-gateway-to-the-orient-from-legazpi-to-malaspina/): central and local colonial institutions and administrative relationships. The lesson does not adopt celebratory colonial framing as a measure of people's worth.
- [Charles Henry Cunningham, The Audiencia in the Spanish Colonies as Illustrated by the Audiencia of Manila](https://www.gutenberg.org/files/41443/41443-h/41443-h.htm): historical scholarship on responsibilities and institutional relationships. This older study is a secondary source, not a current government rule or an original order. Its legal descriptions are not treated as proof of actual fair performance everywhere.
- [Library of Congress: Negotiating Empire](https://blogs.loc.gov/international-collections/2021/10/negotiating-empire-part-i-from-magellan-to-the-founding-of-manila-16th-18th-centuries/): local interests and relationships as a counterweight to a simple one-sided account of central power.

Independent historical, teacher, curriculum alignment and Grade 5 readability review remain pending. This introductory overview does not replace detailed institutional history or establish learning effectiveness.

## Verification

All 185 non-emulator unit checks passed. The six-scene Chrome fixture passed clue exploration, decisions, authored help, recovery and image loading. Tests verify five-topic assessment coverage, retry variants, separate practice, mapped review, owned Chapter 6 prerequisites, no premature chapter completion and continuation only when an active mission exists. Builder and migration syntax checks passed. Fixtures use mocked Firestore; no live security or student walkthrough verification is claimed.

Next: Chapter 7 Mission 2, Local Government and Indigenous Leadership.
