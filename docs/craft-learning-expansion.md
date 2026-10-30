# Chapter 4 Mission 2 — materials and making knowledge

Four existing documents were updated in original Firestore: scenes 1, 2 and 5 and mission teaching metadata. The technology and design-context scenes, order, assessment banks, rewards and student completions remain unchanged.

The material-choice task compares two explicitly fictional observations against a purpose requiring flexible prepared strands. It does not assign invented measurements to a named plant or rank a material as best for every product. The worked preparation–making–checking sequence explains learned knowledge and testing a result against its purpose. It is not a complete weaving tutorial or a reproduction of a community pattern.

The recap connects material properties, practical technology, design restrictions and continuity/change. It maps all five assessed topics and leads to the regional-diversity mission. Three observation cards, applied decisions, authored help and two complete accessible SVG teaching diagrams support the revised scenes. The existing Evidence Journal remains available.

Source framing uses the National Museum's [mats and baskets collection](https://www.nationalmuseum.gov.ph/our-collections/ethnology/mats-and-baskets/) and [Entwined gallery](https://www.nationalmuseum.gov.ph/exhibitions/anthropology/entwined/). Living-craft examples illustrate knowledge/material relationships, not identical precolonial practices. No sacred or restricted pattern is copied, and no practical cutting, harvesting or firing instructions are supplied. Teacher/source review, current-curriculum alignment and Grade 5 comprehension remain pending.

Authoring: `data/craft-learning-pilot.json`. Builder: `functions/build-craft-learning.cjs`. Guarded migration: `functions/apply-craft-learning.cjs`, dry-run by default, with backup, atomic `--apply` and field readback. Runtime text and image references remain in Firestore. Include SVG assets with normal website deployment; Hosting was not deployed. Existing content-version checks can restart unfinished lessons without changing completed rewards.

135 local non-emulator unit tests passed. Chrome loaded the diagrams and completed all three revised scenes, decisions and authored help with recovery checks. Firestore readback verified all four documents. Full authenticated acceptance of the revised Chapter 4 missions remains pending; software checks do not establish learning outcomes.

Subsequent authenticated full-Chapter 4 acceptance passed on 28 October 2026 (Asia/Manila): all 20 scenes, four quizzes, fail/review/practice/fresh retry, journal, four artifacts, 100% challenge, badge, correct available-content continuation, refresh and replay protection. Both temporary runs were cleaned. See validation/chapter4-revised-live-2026-10-28.md. Teacher and Grade 5 learning review remain pending.
