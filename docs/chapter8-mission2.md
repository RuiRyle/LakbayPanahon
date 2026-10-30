# Chapter 8 Mission 2: The Patronato Real and Religious Authority

> Publication update - 28 October 2026: This release is now published to Firestore, backed up and field-verified. See [Chapters 7-14 publication](chapters7-14-publication.md). Older status sections below record the original authoring stage.

## Status

Built locally on 28 October 2026. Unpublished. No live Firestore requests, writes or student accounts were used; availability was not rechecked. Earlier releases and Chapter 8 Mission 1 must be published first. Hosting was not deployed.

## Learning design

Six scenes introduce royal patronage, support and resources, formal influence in church-office procedures, institutional cooperation and jurisdictional disputes, source viewpoints and local effects, and a supported report. Every scene includes three explorable clues, a decision and feedback, vocabulary and authored help. Three accessible SVG teaching guides accompany the scenes. They are not original appointment, funding or judicial documents.

The lesson treats Patronato Real as a historical institutional relationship rather than a claim that Crown and Church were identical or that every official and religious worker had one role. It distinguishes support authorized from delivered and used; presentation of a candidate from every later step; and a jurisdictional claim from a final outcome. The introductory model is not one unchanging legal chart for every church office or colonial year.

Local evidence remains necessary for claims about actual responses, benefit or consent. Fictional allocations, letters and report frames are explicitly teaching examples. Students are not asked to pray, profess belief, disclose their religion or judge the truth of a faith. Assessments concern historical evidence and institutional relationships.

The main quiz selects five medium questions, one per topic, passing at three correct. Ten main questions provide two variants per topic; the finite pool does not promise unlimited never-seen retries. Ten separate easy/hard practice questions use existing adaptive evidence policy and topic-to-scene review mappings. The final recap maps all five topics. Runtime content comes from Firestore after publication; JSON remains authoring input.

Configured reward: 50 XP and a symbolic Royal Patronage Evidence Journal through existing one-time reward behavior. Owned Mission 1 completion gates Mission 2 alongside existing Chapter 7 prerequisites. No Chapter 8 badge, final challenge or premature chapter completion is added. Missions 3-4 remain unfinished.

## Authoring and publication

- `data/chapter8-mission2-lessons.json`: lesson inputs.
- `data/chapter8-mission2-assessments.json`: quiz variants and harder practice inputs.
- `functions/build-chapter8-mission2.cjs`: generates the plan.
- `data/chapter8-mission2-migration.json`: 29 new curriculum documents and two guarded catalog descriptions.
- `functions/apply-chapter8-mission2.cjs`: original project only, dry run by default; atomic commit with backup/preconditions and readback when `--apply` is supplied.

Eight publication prerequisites require the earlier Chapter 7 records and active Chapter 8 Mission 1. Description preconditions expect the Mission 1 release. Publish earlier content in sequence first. No learner collection is included. Review changed expected fields or creation collisions rather than bypassing guards.

After database availability and prerequisites are confirmed:

```powershell
node functions/apply-chapter8-mission2.cjs
node functions/apply-chapter8-mission2.cjs --apply
node functions/apply-chapter8-mission2.cjs
```

The final dry run should show zero changes. No live preflight, commit, readback or signed-in walkthrough has run.

## Sources and limits

- [US National Park Service: Significance of Spanish Colonial Missions](https://www.nps.gov/subjects/travelspanishmissions/significance-of-missions.htm): royal support and the Crown's involvement in missionary activity. The lesson does not expand a broad description of control into a claim that no other institutional role existed.
- [Charles Henry Cunningham, The Audiencia in the Spanish Colonies](https://www.gutenberg.org/files/41443/41443-h/41443-h.htm), royal patronage discussion: historical scholarship on institutional roles, presentation and jurisdiction. This older secondary study is not a current rule or proof of identical practice in every period. The lesson does not supply a universal appointment procedure.
- [Philippiniana Sacra, 2021 special issue](https://philsacra.ust.edu.ph/findissues?id=83F37D13E546B39428B4A876A54C52AC): royal patronage as a factor in the Philippine missionary context. The issue overview is a research pointer, not evidence of every local effect.
- [Chaplains of the King: ecclesiastical chapters and vacant sees in Manila, 1598-1608](https://revista-hsj-historia.unavarra.es/HSJ-Historia/en/article/view/3229): research on particular jurisdictional disputes. Those cases are not generalized into constant disagreement by every participant in every year.
- [Library of Congress: Negotiating Empire](https://blogs.loc.gov/international-collections/2021/10/negotiating-empire-part-i-from-magellan-to-the-founding-of-manila-16th-18th-centuries/): local interests and the limits of a one-sided institutional account.

Independent historical, teacher, curriculum alignment and Grade 5 readability review remain pending. The mission is introductory; detailed theology, canonical procedure and complete institutional history are outside this lesson. Software checks do not establish learning effectiveness.

## Verification

All 208 non-emulator unit checks passed. The six-scene Chrome fixture passed clue exploration, decisions, authored help, recovery and image loading. Tests verify assessment coverage, retry variants, separate practice, mapped review, neutral wording, owned Mission 1 completion, guarded descriptions and no premature chapter completion. Builder and migration syntax checks passed. Fixtures use mocked Firestore; live security and student verification remain pending.

Next: Chapter 8 Mission 3, Changes in Beliefs, Practices, and Community Life.
