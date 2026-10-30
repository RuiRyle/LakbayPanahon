# Chapter 4 Mission 4 — evidence portfolio and synthesis

Four existing curriculum documents were updated in original Firestore: scenes 1, 3 and 5 and mission objectives/recap. The identity and responsibility scenes, order, assessment banks, rewards and student completions were preserved.

The lesson connects Butuan boat evidence, the Laguna Copperplate writing source and museum craft-knowledge descriptions. Learners use a claim, two evidence links and a limit, keeping the examples' distinct contexts visible. A living-craft overview is not treated as a dated excavation proving every early technique. Modern shared identity is not projected unchanged onto every precolonial community.

Two accessible SVG teaching cards provide the source portfolio and explanation structure. Three observation cards, applied decisions and authored help support each revised scene. The recap maps all five assessed topics, reinforces heritage responsibility and prepares the chapter challenge. This is guided synthesis through choices, not free-form writing assessment or automatic proof of mastery. Saved journal clues remain optional references rather than new reward requirements.

Sources include the National Museum's [writing gallery](https://www.nationalmuseum.gov.ph/2022/10/21/baybayin-ancient-and-traditional-scripts-of-the-philippines-gallery/), [craft collection](https://www.nationalmuseum.gov.ph/our-collections/ethnology/mats-and-baskets/) and [Butuan conservation overview](https://www.nationalmuseum.gov.ph/2022/10/24/preserving-our-heritage-towards-the-future-of-our-museums/). Teacher/source review, current-curriculum alignment and Grade 5 comprehension remain pending.

Authoring: `data/heritage-learning-pilot.json`. Builder: `functions/build-heritage-learning.cjs`. Migration: `functions/apply-heritage-learning.cjs`, dry-run by default, with backup, guarded atomic apply and readback. Runtime teaching/image references remain in Firestore. Include the SVG assets with normal website deployment; Hosting was not deployed. Existing content-version checks can restart unfinished activities without changing completed rewards.

139 local non-emulator unit tests passed. Chrome loaded the illustrations and completed all three revised scenes, decisions and authored help with recovery checks. Original Firestore readback verified all four documents. Learning outcomes and independent teacher approval are not established by software checks.

Subsequent authenticated full-Chapter 4 acceptance passed on 28 October 2026 (Asia/Manila): all 20 scenes, four quizzes, fail/review/practice/fresh retry, journal, four artifacts, 100% challenge, badge, correct available-content continuation, refresh and replay protection. Both temporary runs were cleaned. See validation/chapter4-revised-live-2026-10-28.md. Teacher and Grade 5 learning review remain pending.
