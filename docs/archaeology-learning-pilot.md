# Prologue Mission 3 — archaeological evidence

Expanded in the original Firestore project `lakbaypanahon-1797e` on 27 October 2026. The final package covers 27 curriculum documents: six scenes (one added), mission teaching metadata, ten quiz variants and ten distinct practice prompts. Existing mission/question IDs, completion records, XP, artifacts, passing rules and review-evidence configuration remain unchanged.

## Learning sequence

1. Connect the previous formation mission to the question of evidence for past human presence; locate Tabon and Callao and explain context.
2. Follow a worked Tabon evidence card: place, find, supported conclusion and limit.
3. Compare Callao and Tabon by location, evidence type and species identification. Explain fossil and species in plain language.
4. Distinguish modern research milestones from ancient ages. Interpret an explicitly fictional overlapping-range exercise.
5. Choose respectful care that protects a find's setting. Distinguish a saved learning reference from ownership of heritage.
6. Synthesize a museum explanation and connect to the next population-movements mission.

Every scene has three observation cards, a decision with feedback, relevant topic-review tags and authored vocabulary/help. The recap is mapped to all five assessed topics. Evidence Journal saving continues through the existing optional controls. The task is choice-based investigation, not a simulated excavation or an independent written argument.

## Sources and illustrations

Source framing uses the [National Museum Tabon site](https://www.nationalmuseum.gov.ph/our-museums/regional-area-and-site-museums/tabon-cave-complex/), [National Museum briefer](https://weblinks.nationalmuseum.gov.ph/wp-content/uploads/2023/07/03110829/Briefer-on-Tabon-Cave.pdf) and [UP's 2019 research report](https://up.edu.ph/up-led-international-team-discovers-new-human-species-in-the-philippines/). The Callao age statement is attributed to that report rather than presented as the latest or final chronology. No first-arrival, oldest-known or universal-ancestry claim is made.

Four SVGs in `assets/story/` supply an approximate site locator, side-by-side evidence summaries, context/care cards and a time-reading illustration. The locator derives from the existing public-domain Natural Earth coastlines; dots approximate site positions and do not mark cave boundaries or an ancient route. Other illustrations are labelled teaching summaries, not photographs of original finds or reconstructed ancient faces.

The research timeline shows Tabon investigations in 1962–1965 and the 2019 species description. It does not depict ancient lifetimes. The separate practice ranges (A: 1,000–2,000; B: 1,500–2,500 years ago) are explicitly fictional in the scene, image, caption, accessible description and corresponding questions. They teach overlapping uncertainty and must not be reused as dates for either cave. Numerical age memorization is not required to pass the mission.

## Authoring and deployment

`data/archaeology-pilot-lessons.json` and `data/archaeology-pilot-assessments.json` are authoring inputs. `functions/build-archaeology-pilot.cjs` builds the Firestore migration. `functions/apply-archaeology-pilot.cjs` defaults to preflight; `--apply` backs up and atomically commits guarded fields, then verifies all 27 target documents. Runtime text, feedback, topic links, source references and image URLs come from Firestore. The illustrated assets must be included with the website; Hosting was not deployed. Use Live Server for the current source.

The existing content-version policy may restart an unfinished activity when its teaching/questions change. Completed missions, XP and collectibles were not migrated or relocked. The prologue remains optional for accessing existing required chapters.

## Verification

108 local non-emulator unit tests passed. Chrome loaded all four illustrations, completed all six clue/decision interactions, opened authored help and exercised story recovery. The timeline was visually inspected; its preview is `docs/validation/archaeology-time-preview.png`. Original Firestore readback verified every planned field. The later glossary refinement was separately guarded, backed up and read back.

The previous full prologue walkthrough predates this six-scene archaeology expansion. A full authenticated walkthrough of this revised mission, independent teacher/source review and Grade 5 comprehension review remain pending; fixture checks do not establish learning outcomes or current-curriculum certification.

Subsequent acceptance: the expanded-prologue authenticated walkthrough now covers this revised six-scene archaeology mission as well as all other expanded missions. It passed all 24 scenes, failed-quiz recovery, fresh retry, journal, artifacts, 100% challenge, badge, Chapter 1 continuation and replay protection. Temporary records/account were removed; see validation/prologue-expanded-live-2026-10-27.json. Teacher and Grade 5 learning review remain pending.
