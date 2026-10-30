# Chapter 10 Mission 5: Continuity and Change in Filipino Society

> Publication update - 28 October 2026: This release is now published to Firestore, backed up and field-verified. See [Chapters 7-14 publication](chapters7-14-publication.md). Older status sections below record the original authoring stage.

## Status and learning structure

Built locally on 28 October 2026. Unpublished. No Firestore requests, writes, student accounts or Hosting deployment. Earlier releases and Chapter 10 Missions 1-4 must be published first. Independent historical, teacher, curriculum alignment and Grade 5 readability review remain pending.

Six scenes connect continuity with change, comparison of dated sources, policy with implementation, peoples actions within unequal conditions, living heritage and a five-topic report recap. Each includes three clues, a decision, feedback, vocabulary and authored Explain help. Five accessible SVG guides are modern labelled clue cards rather than original documents or authentic textile patterns.

This synthesis reuses bounded examples from earlier missions: Vigan, the 1863 education decree, the Bacolor petition of 1698 and the Field Museum textile dated to the early to mid-1960s. It does not introduce invented historical conversations, room plans or universal household experiences. Fictional comparison cards are labelled models.

The lesson distinguishes continuing a skill from keeping every use unchanged. A new institution does not automatically erase earlier knowledge. A comparison must ask the same question of appropriately identified sources. A feature outside a photograph is not necessarily absent from a building. A policy does not establish equal access or complete learning. Historical agency means acting within conditions and limits, rather than unlimited freedom or equal power. A later heritage object is not proof of every earlier design.

Students are not asked to disclose ancestry, faith, household resources or school difficulties. No religious practice or textile-pattern copying is required. Historical categories and opportunities are not measures of human worth.

Five medium main-quiz questions, one per topic, pass at three correct. Ten main-bank questions provide two finite variants per topic; ten separate easy/hard practice questions retain mapped lesson review and existing practice policy. Configured reward: 50 XP and the symbolic Continuity and Change Evidence Journal through existing one-time reward behavior. Runtime instructional content comes from Firestore after publication; JSON is authoring input.

## Files and guarded publication

- data/chapter10-mission5-lessons.json and data/chapter10-mission5-assessments.json: authored inputs.
- functions/build-chapter10-mission5.cjs: repeatable local builder.
- data/chapter10-mission5-migration.json: 29 creates and two guarded catalog descriptions.
- functions/apply-chapter10-mission5.cjs: original project only; dry run by default; --apply commits atomically with rollback snapshot and field readback.

Twelve prerequisites retain the earlier publication chain and require active Chapter 10 Missions 1-4. Catalog descriptions must match Mission 4. Student access requires owned Chapter 9 completion and all four owned prior Chapter 10 missions. No learner records, challenge or chapter badge are written. All five missions are locally authored, but completing them does not yet complete Chapter 10: the evidence challenge remains to be built.

After availability and earlier publication are confirmed, inspect the apply scripts dry run, run with --apply, then repeat without flags to verify zero changes. Review collisions or expected-field mismatches rather than bypassing guards. Live preflight, commit/readback and an authenticated walkthrough remain pending.

## Sources and limits

- [UNESCO: Historic City of Vigan](https://whc.unesco.org/en/list/502/): earlier activity, later planning and architectural traditions as a named case, not every communitys history.
- [DepEd Ozamiz: Historical Perspective of the Philippine Educational System](https://ozamiz.deped.gov.ph/history/): the 1863 policy context. The lesson does not adopt its overbroad statements about earlier learning having no methods or every tutor being replaced.
- [Grace Liza Y. Concepcion, They Are Not Foreigners, UP Diliman summary](https://history.upd.edu.ph/publications/they-are-not-foreigners/): the bounded Bacolor petition, local relationships and investigation. A request is not every outcome or every persons private motive.
- [Field Museum: Edwin P. Abaya Abel Iloko Towel](https://philippines.fieldmuseum.org/heritage/multimedia/1627247): the later dated textile and community account. It is not a colonial object simply because the skill has a longer history. No source photograph or design is copied.

Source scope and fuller case notes remain in chapter10-mission1.md through chapter10-mission4.md. Introductory synthesis does not establish complete regional coverage or classroom learning effectiveness.

## Verification

All 262 non-emulator unit checks passed. The six-scene Chrome fixture passed rendering, clues, decisions, authored help, image loading and recovery. Tests cover topic coverage, finite variants, separate adaptive practice, mapped review, source/comparison limits, four owned prior completions and guarded descriptions. Migration syntax passed. Mocked fixtures do not replace live security or actual student validation.

Next: build the Chapter 10 evidence challenge across all five missions.
