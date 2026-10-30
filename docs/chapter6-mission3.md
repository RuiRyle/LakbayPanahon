# Chapter 6 Mission 3: Expansion of Colonial Control and Local Responses

> Publication update ? 2026-10-28: This release is now published to Firestore with guarded writes, backup and field readback. See [Chapter 6 publication verification](chapter6-publication.md). Earlier status sections below describe the original authoring stage.

## Status

Implemented locally on 28 October 2026. Not published. No live Firestore requests, writes or student test accounts were used in this task, and database availability was not rechecked. Earlier pending releases must be published first. Hosting was not deployed.

## Learning and behavior

Six scenes teach connections beyond a colonial base; pressure versus agreement; negotiation, adaptation and resistance; uneven effective reach; distinct introductory Ifugao and Sulu examples; and a final supported explanation. Each includes three explorable clues, a decision with feedback, vocabulary and authored help. Four accessible SVG teaching diagrams illustrate links, response categories, reach checks and distinct autonomy examples. They are not exact maps or original images/speeches.

The lesson does not rank communities by their relationship with colonial institutions. Terrain is one possible factor, not destiny. A claimed boundary or written order is not automatically proof of enforcement. Negotiation, adaptation and resistance are actions in context, not permanent identities imposed on whole peoples. The Ifugao resistance and Sulu diplomacy examples retain their distinct settings; the 1726 Sulu treaty is explicitly not placed within Legazpi's 1565 expedition. These examples preview fuller treatment in Chapter 11 rather than replacing it.

The main quiz uses five medium questions, one per topic, passing at three correct. Ten bank items provide two variants per topic; unlimited never-seen retries are not promised. Ten separate easy/hard practice questions use the existing review evidence policy and topic-to-scene mappings. The sixth recap maps all five topics. Runtime content comes from Firestore after publication; JSON files remain authoring inputs.

The configured reward is 50 XP and a symbolic Local Responses Evidence Journal, awarded through existing one-time reward behavior. The reward recognizes learning rather than violence. Mission 3 requires both prior Chapter 6 missions through the student's own saved progress, plus the existing Chapter 5 prerequisite. No chapter challenge or badge is created. Mission 4 and the Chapter 6 challenge are still unfinished.

## Files and publication

- `data/chapter6-mission3-lessons.json`: lesson authoring.
- `data/chapter6-mission3-assessments.json`: quiz variants and harder practice authoring.
- `functions/build-chapter6-mission3.cjs`: builds the plan.
- `data/chapter6-mission3-migration.json`: 29 new curriculum documents and two guarded catalog-description updates.
- `functions/apply-chapter6-mission3.cjs`: original project, dry run by default; atomic commit with backup, preconditions and field-by-field readback when `--apply` is supplied.

Nine prerequisites require the earlier Chapter 5 records and Chapter 6 Missions 1-2. Description preconditions require the Mission 2 release. Publish Chapter 5 Missions 3-4, its challenge, Chapter 6 Mission 1, then Mission 2 before this release. Do not remove expected-value guards to override a content mismatch. The plan contains no student records.

When the database is available and those releases are published:

```powershell
node functions/apply-chapter6-mission3.cjs
node functions/apply-chapter6-mission3.cjs --apply
node functions/apply-chapter6-mission3.cjs
```

The repeat dry run should report zero changes. Live preflight, commit, readback and signed-in walkthrough remain pending; none is claimed here.

## Sources and review

- [Library of Congress: Negotiating Empire](https://blogs.loc.gov/international-collections/2021/10/negotiating-empire-part-i-from-magellan-to-the-founding-of-manila-16th-18th-centuries/): regional connections, merchants and local interests in maintaining the colonial presence. Its account informs the selected example, not a universal model for all places.
- [National Museum: About the Book and the Specimens](https://www.nationalmuseum.gov.ph/wp-content/uploads/2022/07/About-the-Book-and-the-Specimens.pdf): description of research on Indigenous archaeology and Ifugao resistance to Spanish conquest. This is an introductory source summary, not an exhaustive account of every highland community.
- [NCCA: The History of the Muslim in the Philippines](https://ncca.gov.ph/about-ncca-3/subcommissions/subcommission-on-cultural-communities-and-traditional-arts-sccta/central-cultural-communities/the-history-of-the-muslim-in-the-philippines/): Sulu diplomacy and conflict, including the later 1726 treaty. The lesson does not assume all Muslim communities were politically identical or that diplomacy proves identical interpretation of treaty terms.

Worked examples and report cards are explicitly fictional teaching tools. Historical claims are separated from general reasoning questions. Independent historical, teacher, curriculum alignment and Grade 5 readability review remain pending. The content does not establish complete curriculum coverage or learning effectiveness.

## Verification

All 174 non-emulator unit checks passed. The Chrome story fixture passed six scenes, clue exploration, correct decisions, authored help, recovery and local image loading. Checks verify five-topic blueprint coverage, distinct retry items, separate practice, owned prior-mission prerequisites, guarded descriptions and no premature chapter completion. Syntax checks passed for the builder and migration. Fixtures use mocked Firestore; live student behavior and security enforcement still need later verification.

Next content task: Chapter 6 Mission 4, The Meaning, Motives, and Methods of Colonization, followed by the chapter challenge.
