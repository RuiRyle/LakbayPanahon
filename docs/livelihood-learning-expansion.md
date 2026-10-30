# Chapter 1 — Trade and Livelihood teaching expansion

Published to the original Firestore project `lakbaypanahon-1797e` on 27 October 2026. Seven existing curriculum documents were updated: the six lesson scenes and mission teaching metadata. Existing illustrations, quiz/practice banks, passing scores, XP, artifact configuration and student completions remain unchanged.

The sequence is now:

1. `mission2-scene1`: resources, farming work and food, with a worked resource-to-product example.
2. `mission2-scene2`: fishing knowledge, equipment and food needs; compare with farming without making location determine everyone's work.
3. `mission2-scene3`: distinguish what each community can offer from what it needs, and explain barter and intercommunity exchange.
4. `mission2-scene5`: connect a purpose, materials and craft skills using pottery and weaving examples; remove the stray “Copy” in the decision prompt.
5. `mission2-scene4`: apply those ideas in the existing trade-plan investigation.
6. `mission2-scene6`: explain the investigation using resources, skills, products and needs, then prepare for the chapter challenge.

Previously, the recap preceded the investigation. The scene IDs and image references are preserved; their filenames do not necessarily match the new display order. Only the investigation's `order` field changed: stocks, needs, agreement, validation, saved plans, required explanation and reward boundary were not rewritten. Five teaching scenes have expanded text, three non-repeated observation cards, applied decisions and authored help. Existing understanding checks remain. The recap maps to all five assessed topics.

The existing ten main-quiz variants already assess farming, fishing, craftsmanship, barter and intercommunity trade. They were reviewed against the new teaching and retained. The normal five-question selection, three-correct pass mark and fresh retry behavior continue. This update strengthens instruction rather than adding assessment volume.

## Sources and limits

Source references include the National Museum's [archaeological tool collection](https://www.nationalmuseum.gov.ph/our-collections/archaeology/tools/), [mats and baskets](https://www.nationalmuseum.gov.ph/our-collections/ethnology/mats-and-baskets/) and [Batanes archaeological examples](https://www.nationalmuseum.gov.ph/2022/02/22/batanes-neolithic-artifacts/). Living craft examples explain skill and material relationships; they are not treated as proof that all precolonial communities worked identically. Community scenarios and exchange quantities are fictional teaching examples, not historical price lists or accounts of named villages.

`data/livelihood-learning-pilot.json` supplies authored teaching. `functions/build-livelihood-learning-pilot.cjs` generates the guarded migration; `functions/apply-livelihood-learning.cjs` defaults to preflight and supports atomic `--apply`, backup and readback verification. Runtime content remains in Firestore. No frontend Hosting deployment or new Firestore collection is required. Existing content-version checks can restart an unfinished lesson after teaching/order changes; completed missions and rewards stay saved.

## Validation

114 non-emulator unit tests passed. Focused Chrome checks exercised all five expanded teaching scenes and their existing understanding checks. The trade browser suite verified invalid/valid plans, refresh, reflection and revision. The authenticated original-project walkthrough completed the reordered lesson, rejected an invalid exchange, preserved a plan through refresh, required explanation after a valid plan, reached the recap/completion, passed the quiz and confirmed configured XP plus the artifact only at the quiz boundary. Temporary account and owned records were removed. Two final wording refinements were separately guarded/read back and the focused browser check passed again.

See `validation/livelihood-expanded-live-2026-10-27.json`. Independent teacher review and Grade 5 comprehension remain pending; software checks do not certify learning outcomes.
