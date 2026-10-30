# Chapter 6 Mission 4: The Meaning, Motives, and Methods of Colonization

> Publication update ? 2026-10-28: This release is now published to Firestore with guarded writes, backup and field readback. See [Chapter 6 publication verification](chapter6-publication.md). Earlier status sections below describe the original authoring stage.

## Status

Built locally on 28 October 2026. **Unpublished.** No live Firestore requests, writes or student accounts were used for this task. Database availability was not rechecked; the earlier releases remain pending publication. Hosting was not deployed.

## Learning design

Six scenes distinguish colonization from a brief visit, examine economic/political/religious aims, identify methods, investigate effects and local responses, check source viewpoints, and synthesize a supported explanation. Each scene has three explorable clues, a decision with feedback, vocabulary and authored help. Four accessible SVG teaching diagrams illustrate meaning, aim/method/effect comparisons, methods in context and consequences for people. They are teaching models, not original images, dialogue or maps.

The central scaffold is: What was wanted? How was it pursued? What happened to people? The lesson distinguishes explanation from justification, and intention from actual result. It introduces tribute as a required payment without inventing one amount for every community. Other methods are named as previews; the mission does not claim to replace the later chapters on institutions, labor, taxation and religion. Religious aims are studied without requiring religious practice. Fictional family records, sponsor cards and exhibit captions are explicitly teaching exercises, not recovered historical documents.

The five-question main quiz uses one medium question per topic, with three correct required to pass. Ten main-bank questions provide two variants per topic. Ten separate easy/hard practice questions use the existing review evidence policy. Topic tags map review back to the relevant teaching scene and the final recap. The finite bank does not promise unlimited never-seen retries. Runtime content comes from Firestore once published; JSON files are authoring inputs.

The configured reward is 50 XP and a symbolic Colonization Explanation Journal through existing one-time reward behavior. Mission 4 requires the student's own saved completion of all three earlier missions and the existing Chapter 5 prerequisite. No Chapter 6 challenge or badge is created. Completing all four missions alone does not mark the chapter complete.

## Publication files and order

- `data/chapter6-mission4-lessons.json`: lesson input.
- `data/chapter6-mission4-assessments.json`: quiz variants and harder practice input.
- `functions/build-chapter6-mission4.cjs`: generates the plan.
- `data/chapter6-mission4-migration.json`: 29 new curriculum documents and two guarded description updates.
- `functions/apply-chapter6-mission4.cjs`: original project only, dry run by default; atomic commit with backup, preconditions and readback when `--apply` is supplied.

Ten preflight prerequisites require the earlier Chapter 5 release records and Chapter 6 Missions 1-3. The descriptions must match the Mission 3 release. Publish Chapter 5 Missions 3-4 and its challenge, then Chapter 6 Missions 1-3 before this migration. No learner records are part of the plan. Review collisions or expected-value mismatches rather than bypassing guards.

After database access returns and those releases are published:

```powershell
node functions/apply-chapter6-mission4.cjs
node functions/apply-chapter6-mission4.cjs --apply
node functions/apply-chapter6-mission4.cjs
```

The final dry run should report zero changes. Live preflight, commit, readback and signed-in walkthrough remain pending.

## Sources and review limits

- [Philippine Embassy Madrid: Q&A with historian Aitor Anduaga](https://www.philembassymadrid.com/qa-anduaga): religious, economic and geopolitical motives. These broad categories are not treated as every participant's identical private priorities.
- [DepEd Learning Portal resource](https://lrmds.deped.gov.ph/detail/19794): instructional topics including tribute/encomienda, compulsory labor and military force. This topic reference does not constitute independent approval or full curriculum alignment of the authored mission.
- [NCCA: Gateway to the Orient](https://ncca.gov.ph/about-culture-and-arts/in-focus/philippines-gateway-to-the-orient-from-legazpi-to-malaspina/): trade, settlements, government and religious institutions as aspects of colonial presence. The lesson does not adopt celebratory colonial framing as a judgment of local people's worth.
- [Library of Congress: Negotiating Empire](https://blogs.loc.gov/international-collections/2021/10/negotiating-empire-part-i-from-magellan-to-the-founding-of-manila-16th-18th-centuries/): local interests, coercion and negotiation in early colonial relationships.

General reasoning examples are distinguished from claims about a named historical household. The mission avoids uniform burdens, invented authentic speeches and assumptions of universal consent. Independent historical, teacher, curriculum alignment and Grade 5 readability review remain pending. Software checks do not establish learning effectiveness or complete coverage of Philippine history.

## Verification

All 178 non-emulator unit checks passed. The six-scene Chrome fixture passed clue exploration, decisions, authored help, recovery and image loading. Checks cover blueprint coverage, distinct retry questions, separate adaptive practice, topic mappings, owned prior-mission completion, guarded descriptions and absence of premature chapter completion. Builder and migration syntax checks passed. Browser fixtures use mocked Firestore; live student and security verification remain pending.

Next: build the Chapter 6 challenge and badge, then verify the full chapter after ordered publication.

## Challenge authoring update

The Chapter 6 challenge and badge are now authored locally; see `docs/chapter6-challenge.md`. They remain unpublished, together with the four missions, pending ordered publication and live student verification. Earlier statements that the challenge was being prepared describe the Mission 4 authoring milestone.
