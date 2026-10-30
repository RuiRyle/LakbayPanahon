# Chapter 3 Mission 4 — maritime centers and supporting work

Published to original Firestore on 27 October 2026. Four existing documents changed: scenes 1, 2 and 5 and mission teaching metadata. The people/work and change scenes, scene order, assessment banks, rewards and student completions remain unchanged.

A fictional harbor relationship diagram connects river, landing place and sea with food producers, makers and boat workers. It is explicitly not a map of ancient Butuan or a universal port layout. A worked example explains why location alone is insufficient for a thriving center.

The Butuan comparison separates boat construction evidence from imported-ceramic evidence. It requires dates and context before combining the finds and does not invent one ship/cargo event. The [National Museum's 2006 Tentative List submission](https://whc.unesco.org/en/tentativelists/2071/) is identified as an attributed source, not proof of World Heritage inscription or the latest excavation counts. The [National Museum conservation overview](https://www.nationalmuseum.gov.ph/2022/10/24/preserving-our-heritage-towards-the-future-of-our-museums/) provides additional framing.

The recap maps all five assessed topics and connects all four maritime missions to the chapter challenge and subsequent heritage chapter. Three observation cards, applied decisions, authored help and two complete accessible SVG illustrations support the revision. This is guided explanation, not an interactive port-building simulation.

Authoring: `data/maritime-centers-learning-pilot.json`. Builder: `functions/build-maritime-centers-learning.cjs`. Migration: `functions/apply-maritime-centers-learning.cjs`, dry-run by default, with backup, atomic guarded `--apply` and readback verification. Runtime teaching and image references remain in Firestore. Include illustrations in normal website deployment; Hosting was not deployed. Content-version checks may restart unfinished lessons; completed rewards were not migrated.

131 local non-emulator unit tests passed. Chrome loaded the illustrations and completed all three revised scenes, decisions and authored help with recovery checks. Firestore readback verified all four documents. Full authenticated acceptance of the revised chapter, teacher/source review, current-curriculum alignment and Grade 5 comprehension remain pending. Earlier live Chapter 3 acceptance predates these teaching edits.

Subsequent full revised-Chapter 3 authenticated acceptance passed all 20 scenes, four quizzes, fail/review/practice/fresh retry, journal saves/display, artifacts, 100% challenge, badge, Chapter 4 continuation and replay reward protection. Temporary records/account removed. See validation/chapter3-revised-live-2026-10-27.md. Teacher and Grade 5 review remain pending.
