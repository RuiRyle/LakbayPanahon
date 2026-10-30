# Chapter 8 Mission 3: Changes in Beliefs, Practices, and Community Life

> Publication update - 28 October 2026: This release is now published to Firestore, backed up and field-verified. See [Chapters 7-14 publication](chapters7-14-publication.md). Older status sections below record the original authoring stage.

## Status

Built locally on 28 October 2026. Unpublished. No live Firestore requests, writes or temporary student accounts were used; availability was not rechecked. Earlier releases and Chapter 8 Missions 1-2 must be published first. Hosting was not deployed.

## Learning design

Six illustrated scenes distinguish belief, practice and institution; investigate a parish and community space; keep makers visible in religious art; compare continuity and change; check modern heritage against dated historical evidence; and synthesize a supported report. Each includes three explorable clues, a decision with feedback, vocabulary and authored help. Five accessible SVG teaching guides accompany the lessons. They are not original artifacts, ceremony photographs or reconstructed buildings.

Named examples include Silang's parish establishment in 1595, religious art discussed by NCCA and the National Museum, and the National Museum's Moryonan exhibition. The lesson explicitly separates a parish's beginning from the age of later building features, commissioned purpose from makers' private beliefs, and present-day heritage descriptions from proof of unchanged colonial practice. The modern Moryonan example teaches source limits; it does not assert an origin date for every practice or costume feature.

Local makers, intermediaries and existing skills remain visible. A new religious institution does not imply every older practice disappeared, and different actions in one place do not establish a universal mixture of belief. Fictional captions and report cases are identified as teaching exercises. Students are not asked to pray, venerate an object, reproduce a penitential practice, profess belief or disclose their religion. Graphic penitential imagery is not used.

The main quiz selects five medium questions, one per topic, passing at three correct. Ten main-bank items provide two variants per topic; the finite pool does not promise unlimited never-seen retries. Ten separate easy/hard practice questions use existing review policy, with topic-to-scene mappings and a five-topic recap. Runtime content comes from Firestore after publication; JSON files remain authoring inputs.

Configured reward: 50 XP and a symbolic Community Change Evidence Journal through existing one-time reward behavior. Both prior owned mission completions are required, alongside the existing Chapter 7 prerequisite. No Chapter 8 challenge, badge or premature completion is added. Mission 4 remains unfinished.

## Authoring and publication

- `data/chapter8-mission3-lessons.json`: six lesson inputs.
- `data/chapter8-mission3-assessments.json`: quiz variants and harder practice.
- `functions/build-chapter8-mission3.cjs`: builds the plan.
- `data/chapter8-mission3-migration.json`: 29 new curriculum documents and two guarded catalog descriptions.
- `functions/apply-chapter8-mission3.cjs`: original project only, dry run by default; atomic commit with backup/preconditions and readback when `--apply` is supplied.

Nine prerequisites require earlier Chapter 7 records and Chapter 8 Missions 1-2. Descriptions must match the Mission 2 release. Publish earlier pending content in sequence first. No learner records are included. Review changed expected fields or collisions instead of bypassing guards.

When database availability and prerequisites are confirmed:

```powershell
node functions/apply-chapter8-mission3.cjs
node functions/apply-chapter8-mission3.cjs --apply
node functions/apply-chapter8-mission3.cjs
```

The repeat dry run should report zero changes. Live preflight, commit, readback and signed-in walkthrough remain pending.

## Sources and limits

- [National Museum: Silang Church](https://www.nationalmuseum.gov.ph/2021/12/16/silang-church/): parish establishment and later built heritage. The lesson does not date all visible features to 1595.
- [NCCA: The Spanish Colonial Tradition in Philippine Visual Arts](https://ncca.gov.ph/about-ncca-3/subcommissions/subcommission-on-the-arts-sca/visual-arts/the-spanish-colonial-tradition-in-philippine-visual-arts/): religious commissions and artisans. Broad statements in this overview are not treated as every maker's private testimony.
- [National Museum: Sculptures](https://www.nationalmuseum.gov.ph/our-collections/fine-arts/sculptures/): local sculptural traditions and religious objects. Objects are not used to infer every viewer's belief or the disappearance of all earlier traditions.
- [National Museum: Moryonan](https://www.nationalmuseum.gov.ph/exhibitions/nm-marinduque-romblon-area-museum/moryonan/): a named living-heritage exhibition, including mask-making. It is evidence of a modern description, not automatic proof of an unchanged colonial form.
- [Library of Congress: Catholicism during the Spanish Colonial Period](https://blogs.loc.gov/international-collections/2018/07/catholicism-in-the-philippines-during-the-spanish-colonial-period-1521-1898/): local intermediaries and the limits of missionary viewpoints. The lesson does not repeat dated population figures or rank people by conversion.

Independent historical, teacher, curriculum alignment and Grade 5 readability review remain pending. Introductory examples do not replace detailed regional religious history or establish learning effectiveness. Mission 4 will develop responses, adaptation and resistance further.

## Verification

All 212 non-emulator unit checks passed. The six-scene Chrome fixture passed clue exploration, decisions, authored help, recovery and image loading. Checks cover blueprint coverage, retry variants, separate practice, mapped review, date/source-limit wording, both owned prior missions, guarded descriptions and no premature chapter completion. Builder and migration syntax checks passed. Fixtures use mocked Firestore; live security and student verification remain pending.

Next: Chapter 8 Mission 4, Indigenous Responses, Adaptation, and Resistance.
