# Chapter 7 Mission 2: Local Government and Indigenous Leadership

> Publication update - 28 October 2026: This release is now published to Firestore, backed up and field-verified. See [Chapters 7-14 publication](chapters7-14-publication.md). Older status sections below record the original authoring stage.

## Status

Built locally on 28 October 2026. Unpublished. No live Firestore requests, writes or student accounts were used; database availability was not rechecked. Earlier pending releases and Chapter 7 Mission 1 must be published first. Hosting was not deployed.

## Student learning

Six illustrated scenes distinguish central/provincial/town levels, the town-level gobernadorcillo, earlier leadership and changing colonial roles, intermediaries and requests, local-record viewpoints, and a supported report. Each includes three explorable clues, a decision with feedback, vocabulary and authored help. Four accessible SVG guides show roles and relationships rather than claim a single unchanged chart for every colonial year.

The lesson separates gobernadorcillo from governor-general. Provincial titles such as alcalde mayor and corregidor are contextual introductions, not identical modern positions. Cabeza de barangay is introduced as a title, without assigning one unchanged set of duties across periods. Principal�a/principales concerns a privileged/prominent local group, not every Indigenous person. The lesson recognizes earlier leadership, continuity of influence and institutional change without making all communities identical.

Petitions and rosters are distinguished from evidence of results or fair representation. Fictional message, museum-label and request exercises are explicitly teaching tools, not original records. Historical selection is not equated with modern universal elections. The mission does not reconstruct every local administrative or selection system; later content and teacher review remain necessary.

The main quiz selects five medium questions, one per topic, with three correct to pass. Ten main questions provide two variants per topic; the finite bank does not promise unlimited never-seen retries. Ten separate easy/hard practice questions use the existing adaptive evidence policy. Difficult topics map back to their teaching scenes and final recap. Runtime instructional data comes from Firestore after publication; JSON files are authoring inputs.

Configured reward: 50 XP and a symbolic Local Leadership Evidence Journal through existing one-time reward behavior. The student's own Mission 1 completion gates Mission 2, alongside the existing Chapter 6 prerequisite. No Chapter 7 challenge, badge or premature completion is added. Missions 3-4 remain unfinished.

## Publication

Authoring files: `data/chapter7-mission2-lessons.json` and `data/chapter7-mission2-assessments.json`.
Builder: `functions/build-chapter7-mission2.cjs`.
Plan: `data/chapter7-mission2-migration.json`.
Guarded migration: `functions/apply-chapter7-mission2.cjs`.

The plan creates 29 curriculum documents and updates two descriptions with expected-value guards. Eight prerequisites require the earlier Chapter 6 records and active Chapter 7 Mission 1. No learner records are included. Publish earlier pending Chapter 5 and Chapter 6 releases, then Chapter 7 Mission 1 before this plan. Review collisions or changed expected fields instead of bypassing guards.

After database availability and prerequisites are confirmed:

```powershell
node functions/apply-chapter7-mission2.cjs
node functions/apply-chapter7-mission2.cjs --apply
node functions/apply-chapter7-mission2.cjs
```

Apply uses backup, atomic commit and field-by-field readback. The final dry run should report zero changes. No live preflight, commit, readback or signed-in walkthrough has run for this release.

## Sources and limits

- [NCCA: Gateway to the Orient](https://ncca.gov.ph/about-culture-and-arts/in-focus/philippines-gateway-to-the-orient-from-legazpi-to-malaspina/): provincial administrative titles and relationships. Its overview is not treated as a fixed organization chart for every period.
- [Municipality of San Andres: Spanish-era officials overview](https://sanandrescat.gov.ph/mayors-spanish-era-san-andres-catanduanes/): introductory town-level gobernadorcillo role. A local government overview does not establish identical practice in every town or every colonial year.
- [National Archives: Erecci�n de los Pueblos request collection](https://erecciones.nationalarchives.gov.ph/oprequest): examples and descriptions of local administrative records and requests. The exercises are not transcriptions of those records. An archival series does not prove every community's founding or every resident's consent.
- [Library of Congress: Negotiating Empire](https://blogs.loc.gov/international-collections/2021/10/negotiating-empire-part-i-from-magellan-to-the-founding-of-manila-16th-18th-centuries/): prominent local participants and interests in colonial relationships, without equating them with the whole population.
- [Philippine Historical Association Historical Bulletin, 2015](https://pssc.org.ph/wp-content/pssc-archives/Historical%20Bulletin/PHA%20HB%202015.pdf): historical discussion of local offices and changing arrangements. The lesson avoids claiming a precise universal selection procedure from a broad introduction.

Independent historical, teacher, curriculum alignment and Grade 5 readability review remain pending. Introductory role distinctions do not replace detailed local histories or establish learning effectiveness.

## Verification

All 189 non-emulator unit checks passed. The six-scene Chrome fixture passed clue exploration, decisions, authored help, recovery and image loading. Tests verify blueprint coverage, retry variants, separate practice, mapped review, owned Mission 1 prerequisites, guarded descriptions and no premature chapter completion. Builder and migration syntax checks passed. Fixtures use mocked Firestore; live student and security verification remain pending.

Next: Chapter 7 Mission 3, The Encomienda System and Tribute.
