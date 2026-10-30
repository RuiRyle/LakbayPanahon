# Chapter 5 Mission 3: Lapulapu and the Battle of Mactan

> Publication update ? 2026-10-28: This release is now published to Firestore with guarded writes, backup and field readback. See [Chapter 6 publication verification](chapter6-publication.md). Earlier status sections below describe the original authoring stage.

## Availability

Implemented locally on 28 October 2026. **Not published to Firestore.** The original project returned HTTP 429, `RESOURCE_EXHAUSTED`, `Quota exceeded.` during migration preflight. A subsequent single-document read returned the same error. The migration did not reach its commit step. A failed read does not establish whether a document exists.

The previous live curriculum remains Missions 1-2. Mission 3's local assets and authoring files are ready; no Firebase Hosting deployment was performed. A real signed-in walkthrough of Mission 3 is pending publication and restored database availability.

## Learning design

Six scenes cover local authority, causes and coercion, shoreline constraints, the outcome on 27 April 1521, evidence versus dramatic retelling, and a final explanation. Every scene includes three clues, a decision with feedback, vocabulary and authored help. The sixth scene maps back to all five quiz topics for review.

Four local SVG diagrams show competing decisions, a conceptual shore profile, before/result/afterward, and source checking. The shore profile is explicitly not to scale and does not claim exact positions or movements. No graphic injuries, personal combat simulation or reward for harming people is included. The mission reward recognizes explanation and evidence use.

The five-question main quiz uses one medium question per topic, passing at three correct. Ten questions supply two variants per topic. Separate easy/hard practice questions use the existing review evidence policy and map weak topics back to the matching lesson. The pool is finite; never-seen questions on unlimited retries are not promised. Existing behavior handles grading, lesson progress, targeted practice and one-time rewards.

Configured rewards: 50 XP and a symbolic Mactan Evidence Journal collectible. No chapter challenge or badge is added. Mission 4 and the chapter challenge remain unfinished. The new mission retains the existing order and access logic; it does not bypass Missions 1-2.

## Content and publication

- `data/chapter5-mission3-lessons.json`: six lesson authoring inputs.
- `data/chapter5-mission3-assessments.json`: quiz and harder practice authoring inputs.
- `functions/build-chapter5-mission3.cjs`: builds the Firestore plan.
- `data/chapter5-mission3-migration.json`: 29 new documents and two guarded era/chapter description updates.
- `functions/apply-chapter5-mission3.cjs`: original project only, dry run by default; backs up and atomically commits with preconditions when `--apply` is supplied, then verifies fields by readback.

When Firestore is available again, run:

```powershell
node functions/apply-chapter5-mission3.cjs
node functions/apply-chapter5-mission3.cjs --apply
node functions/apply-chapter5-mission3.cjs
node tests/chapter5-mission3-live-walkthrough.cjs
```

The final dry run should report zero changes. If a precondition detects edited catalog content, review the plan against the current documents rather than discarding the guard. Runtime instructional data comes from Firestore; local JSON is used for authoring and publication only.

The live walkthrough uses real lesson and quiz controls for Missions 1-3 on one isolated temporary account. It checks restoration after refresh, configured XP and collectibles, replay protection and absence of premature chapter completion. It cleans up that account and its owned records. It has been prepared but has **not run** for Mission 3 because of the quota error.

## Source basis and limits

- [NHCP Mactan marker](https://philhistoricsites.nhcp.gov.ph/registry_database/mactan-ruta-ng-ekspedisyon-magallanes-elcano-sa-pilipinas/): demands, refusal, coercion, the event date and the defenders' role.
- [NHCP Lapulapu marker](https://philhistoricsites.nhcp.gov.ph/registry_database/lapulapu-2/): leadership in the defense of Mactan.
- [NQC: Battle of Mactan Beyond Textbooks](https://www.nqc.gov.ph/en/resources/battle-of-mactan-beyond-textbooks/): different local positions, the constraints on the boats' approach, and uncertainty about Lapulapu's individual presence among combatants in Pigafetta's account.
- [NQC route resource](https://www.nqc.gov.ph/en/map/): the battle in the expedition's continuing sequence.
- [NHCP Antonio Pigafetta marker](https://philhistoricsites.nhcp.gov.ph/registry_database/antonio-pigafetta/): participant and witness context.

The lesson distinguishes a collective victory and leadership from an unsupported personal duel. It does not turn a lack of identification into proof of absence. It avoids invented ages, exact appearance or authentic-sounding speeches. Fictional report and exhibit activities are teaching tools, not quotations. It separates local resistance in 1521 from a modern republic and from later colonial history.

Independent historical content, teacher, curriculum alignment and Grade 5 readability review remain pending. These software checks do not establish learning effectiveness or complete coverage of Philippine history.

## Completed checks

148 non-emulator unit checks passed. The Chrome story fixture verified all six Mactan scenes, clue exploration, decisions, authored help, recovery and image loading. The initial live dry run found 31 planned changes. The subsequent publication attempt stopped in preflight on the quota error; no commit or successful publication readback occurred.
