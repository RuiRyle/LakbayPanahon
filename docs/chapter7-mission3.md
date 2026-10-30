# Chapter 7 Mission 3: The Encomienda System and Tribute

> Publication update - 28 October 2026: This release is now published to Firestore, backed up and field-verified. See [Chapters 7-14 publication](chapters7-14-publication.md). Older status sections below record the original authoring stage.

## Status and scope

Built locally on 28 October 2026. **Unpublished.** No live Firestore requests, writes or temporary student accounts were used. Database availability was not rechecked. Hosting was not deployed.

Six scenes distinguish encomienda collection rights from automatic land ownership; required tribute from gifts; stated obligations from performance; demands from actual collection and household effects; source types and unresolved complaints; and a final supported report. Each scene includes three clues, a decision with feedback, vocabulary and authored help. Four accessible SVG teaching guides accompany the scenes. They are not authentic grants, receipts or universal payment schedules.

The lesson does not imply land dispossession never occurred: it requires appropriate evidence for a land claim rather than deriving ownership automatically from collection rights. It does not invent one tribute amount, currency conversion or identical rule for every community. Protection and religious instruction are introduced as stated obligations, not proof of performance; students are not asked to practise a religion. Fictional household/report exercises are clearly teaching tools, not original records. Collecting resources is not a player reward mechanic.

The main quiz selects five medium questions, one per topic, with three correct required to pass. Ten main-bank questions provide two variants per topic; the pool is finite. Ten separate easy/hard practice questions use existing adaptive review policy and map topics back to their lessons and recap. Runtime instructional data comes from Firestore after publication; JSON is authoring input.

Configured reward: 50 XP and a symbolic Tribute Evidence Journal via existing one-time reward behavior. Both owned prior mission completions are required, alongside existing chapter prerequisites. Mission 4 and the chapter challenge remain unfinished. No chapter badge or completion is added.

## Files and publication

- `data/chapter7-mission3-lessons.json`: six lesson inputs.
- `data/chapter7-mission3-assessments.json`: quiz and harder practice authoring.
- `functions/build-chapter7-mission3.cjs`: builds the curriculum plan.
- `data/chapter7-mission3-migration.json`: 29 new documents and two guarded catalog-description updates.
- `functions/apply-chapter7-mission3.cjs`: original project only, dry run by default; atomic commit, backup, preconditions and readback with `--apply`.

Nine publication prerequisites require earlier Chapter 6 records and Chapter 7 Missions 1-2. Descriptions must match the Mission 2 release. Publish the pending Chapter 5/6 content and Chapter 7 Missions 1-2 first. No learner data is in the plan. Review collisions or changed expected fields rather than bypassing guards.

After restored database availability and earlier publication:

```powershell
node functions/apply-chapter7-mission3.cjs
node functions/apply-chapter7-mission3.cjs --apply
node functions/apply-chapter7-mission3.cjs
```

The repeat dry run should report zero changes. Live preflight, commit, readback and signed-in walkthrough remain pending.

## Sources and review limits

- [Eric A. Anderson, The Encomienda in Early Philippine Colonial History, Asian Studies](https://asj.upd.edu.ph/mediabox/archive/ASJ-14-2-1976/anderson-encomienda-philippine-history.pdf): historical scholarship on the institution and its documentary limits. This secondary study is not a modern governing rule or a complete account of every household.
- [The Philippine Islands, Volume VII: The Collection of Tributes, 1591](https://www.gutenberg.org/cache/epub/13701/pg13701-images.html): translated historical discussions of collection and obligations. The collection preserves different arguments and viewpoints; neither its editorial framing nor a participant's claim is treated as every affected person's experience. The lesson paraphrases broad distinctions, not a universal rate or an original household story.
- [Cebu provincial history series: History of Alcoy](https://alcoycebu.gov.ph/wp-content/uploads/2023/10/HISTORY-OF-ALCOY-CEBU.pdf): distinction between an encomienda and a land grant. The local publication is not treated as a deed or evidence settling every land claim.
- [DepEd Learning Portal resource](https://lrmds.deped.gov.ph/detail/19794): tribute and encomienda as instructional topics. Its inclusion does not independently certify the authored mission's curriculum alignment.

Independent historical, teacher, curriculum alignment and Grade 5 readability review remain pending. Broader taxation, labor and economic-policy topics require later chapters. The introductory distinctions do not establish complete curriculum coverage or learning effectiveness.

## Verification

All 193 non-emulator unit checks passed. The six-scene Chrome fixture passed clue exploration, correct decisions, authored help, recovery and image loading. Checks cover five-topic blueprint coverage, distinct retry questions, separate practice, mapped review, both owned prior mission completions, guarded descriptions and no premature chapter completion. Builder and migration syntax checks passed. Fixtures use mocked Firestore; live student and security verification remain pending.

Next: Chapter 7 Mission 4, Reduccion and the Reorganization of Settlements, followed by the chapter challenge.
