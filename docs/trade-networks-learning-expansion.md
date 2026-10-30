# Chapter 3 Mission 2 — named trade evidence and networks

Published to original Firestore on 27 October 2026. Four existing documents were updated: scenes 1, 2 and 5 and mission teaching metadata. Scene order, the other two scenes, quiz/practice banks, rewards and student completions were preserved.

The network scene now works through origin, an explicitly fictional exchange stop and a later context. The diagram is a network model, not a geographic map or documented voyage. Modern country names locate production regions without projecting current political borders onto the past. Chinese, Vietnamese and Thai examples are identified as belonging to a collection spanning different periods, not one simultaneous shipment.

The ceramic scene compares named Changsha production with Mt. Kamhantik in Mulanay, Quezon and separate cargo evidence from the Belitung wreck near Sumatra. It does not claim one ship connected those finds. The recap maps all five assessed topics and connects networks, needs, route evidence and local choices to the next goods/technology mission.

Two SVG teaching summaries are included in `assets/story/`, with equivalent descriptions and uncropped display. Three observation cards, applied decisions, worked examples and authored help support each revised scene. These are guided interpretation tasks, not a reconstruction of a real trading voyage.

Sources: [National Museum stoneware and porcelain](https://www.nationalmuseum.gov.ph/our-collections/archaeology/stoneware-and-porcelainware/) and its [maritime archaeological evidence overview](https://www.nationalmuseum.gov.ph/2022/09/20/the-9th-to-10th-century-archaeological-evidence-of-maritime-relations-between-the-philippines-and-the-islands-of-southeast-asia/). Teacher/source review, current-curriculum alignment and Grade 5 comprehension remain pending.

Authoring: `data/trade-networks-learning-pilot.json`. Builder: `functions/build-trade-networks-learning.cjs`. Guarded migration: `functions/apply-trade-networks-learning.cjs`, dry-run by default; `--apply` backs up, commits atomically and reads back every target field. Runtime text and image references remain in Firestore. Include the SVG files with normal website deployment; Hosting was not deployed. Existing content-version policy can restart unfinished lessons without changing completed rewards.

127 local non-emulator unit tests passed. Chrome loaded the illustrations and completed all three revised scenes, decisions and authored help, with story recovery checks. Original Firestore readback verified all four documents. A full authenticated walkthrough of the revised mission remains pending; the earlier Chapter 3 acceptance predates this teaching change.

Subsequent full revised-Chapter 3 authenticated acceptance passed all 20 scenes, four quizzes, fail/review/practice/fresh retry, journal saves/display, artifacts, 100% challenge, badge, Chapter 4 continuation and replay reward protection. Temporary records/account removed. See validation/chapter3-revised-live-2026-10-27.md. Teacher and Grade 5 review remain pending.
