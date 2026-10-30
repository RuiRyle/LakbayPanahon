# Chapter 2 Mission 1 — social position and unequal choices

Published to original Firestore project `lakbaypanahon-1797e` on 27 October 2026. Four existing documents were updated: three teaching scenes and mission objectives/recap. The other three scenes, scene order, quiz/practice banks, XP, artifact configuration and existing student completions remain unchanged.

## Teaching changes

- Scene 2 distinguishes work from social status and compares duties, living arrangements and freedom in a specifically identified historical account. It defines social status explicitly to support the existing quiz terminology.
- Scene 5 works through two fictional cases using responsibility, choice and restriction. Students explain the stated inequality without inventing exact titles from insufficient information or treating social position as personal worth.
- Scene 6 connects leadership, relatives, customs and social position, maps all five assessed topics and leads into beliefs/traditions.

Two SVG teaching illustrations accompany the comparison and fictional cases, with full accessible descriptions and uncropped display. Three observation cards, four-choice applied decisions and authored vocabulary/help support each revised scene. Existing understanding checks are retained. Evidence Journal saving remains available through the shared lesson controls.

## Source boundaries

The named Tagalog comparison is attributed to [Juan de Plasencia's 1589 account](https://www.gutenberg.org/files/13701/13701-h/13701-h.htm), accessed in Blair and Robertson's translated collection. The lesson identifies the author as a Spanish missionary and the record as an outside account written after Spanish arrival, not a transparent account of all precolonial communities. Modern spellings are used for the teaching labels.

The source distinguishes maharlika service duties and different dependent conditions described as aliping namamahay and aliping sa gigilid. Restrictions and the possibility of being sold in the latter description are stated without reenactment, human-ownership rewards or ranking classmates. The comparison is not a universal social pyramid. [CulturEd's timawa entry](https://philippineculturaleducation.com.ph/timawa/) and [maharlika entry](https://philippineculturaleducation.com.ph/maharlika/) supply additional cultural-education references. Similar descriptions are not treated as proof that regional terms had identical rights and duties. This is a limited worked comparison, not an exhaustive account of every Visayan or Tagalog social category.

The two fictional people are teaching examples, not named historical biographies or sufficient evidence for assigning exact status labels. Describing a custom does not justify unequal freedom. No personal family history or role assignment is required from students. Independent historical, teacher and Grade 5 comprehension review remains pending.

## Maintenance and validation

`data/social-roles-learning-pilot.json` contains authored text. `functions/build-social-roles-learning.cjs` creates the guarded migration; `functions/apply-social-roles-learning.cjs` defaults to preflight and supports backed-up atomic `--apply` plus readback verification. Runtime teaching, feedback, source URLs and image references come from Firestore. The two SVG assets must accompany normal website deployment; Hosting was not deployed. Live Server serves the current files. Content-version checks can restart an unfinished lesson; completed missions and rewards were not migrated or relocked.

117 non-emulator unit tests passed. Chrome completed the three revised scenes, their existing understanding checks and authored help, loaded the illustrations and exercised story recovery. The comparison diagram was visually inspected. Firestore readback verified all four target documents. Classroom learning outcomes and current-curriculum alignment are not established by these software checks.

Authenticated original-project acceptance subsequently passed all six mission scenes, diagram loading, comparison-scene refresh, quiz-draft refresh, passing the unchanged five-question quiz, configured XP/artifact and replay without duplicate XP. Temporary accounts and owned records from both runs were removed. The initial run stopped on a test-only check that treated an unset initial XP field as NaN; the corrected run uses the app's existing zero default and passed. See validation/social-roles-live-2026-10-27.json.
