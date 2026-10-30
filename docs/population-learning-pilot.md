# Prologue Mission 4 — population movements and source comparison

Published to the original Firestore project `lakbaypanahon-1797e` on 27 October 2026. The package updates 27 curriculum documents: six scenes (one added), mission teaching metadata, ten main-quiz variants and ten separate practice prompts. Mission IDs, quiz blueprint, five questions per attempt, three-correct pass mark, XP, artifacts and existing student completions are preserved.

## Learning sequence

1. Connect archaeological evidence of earlier human presence with the new question of movements and contacts. Compare language-dispersal and population-history research views.
2. Work through a language-family membership card using Tagalog, Cebuano and Ilocano as selected Austronesian examples; distinguish language relationships from every speaker's ancestry.
3. Locate Taiwan, Batanes and northern Luzon. Compare a simplified northern language-connection model with Batanes pottery/adze evidence and its limits.
4. Investigate fictional object/language source cards and reject claims that exceed their evidence. Explain the distinct questions addressed by archaeology, language research and genetic research.
5. Discuss origins without stereotypes or requests for personal ancestry, family stories or DNA information.
6. Connect all four prologue missions in a final report and introduce Chapter 1's study of particular communities, responsibilities and livelihoods.

Each scene has three observation cards, an applied choice with feedback, authored vocabulary/help and topic-review tags. The recap is tagged to all five assessed topics. Students can save opened clues through the existing Evidence Journal. These are guided comparison tasks, not a simulation of real voyages, an ancestry classifier or an independent written argument.

## Source framing

The [National Museum's Batanes overview](https://www.nationalmuseum.gov.ph/2022/02/22/batanes-neolithic-artifacts/) supplies concrete archaeological examples. The [2021 population-history study](https://pnas.org/doi/full/10.1073/pnas.2026132118) supports the discussion of multiple movements. The [2024 language study](https://www.nature.com/articles/s41598-024-65810-x) examines language relationships, contact and the limits of a simple one-direction account. These are different research questions and timescales, not two exclusive options for every person's origins.

The lesson presents an initial northern language-dispersal connection as one simplified model, while explaining that earlier presence, later movement, contact and language learning complicate the picture. It does not treat a route arrow, pottery type or language family as a complete biological family tree. No fixed racial-wave diagram, ranking of communities or claim that all groups arrived at once is taught. Sources and interpretations remain subject to research and independent teacher review.

## Illustrations and runtime data

Four SVG illustrations in `assets/story/` supply a two-view comparison, a selected language-family membership card, a northern locator and a three-source comparison. The locator derives from the existing public-domain Natural Earth geometry. Batanes is explicitly represented by an approximate labelled marker because the small islands are omitted at this scale. Dashed arrows illustrate a model connection, not documented individual voyages or all migration routes. The language card is explicitly not a full linguistic tree.

`data/population-pilot-lessons.json` and `data/population-pilot-assessments.json` are authoring inputs. `functions/build-population-pilot.cjs` generates the Firestore plan; `functions/apply-population-pilot.cjs` defaults to preflight and supports a backed-up, guarded atomic `--apply` with readback verification. All runtime text, feedback, topic mappings and image references come from Firestore. Static illustrations must accompany normal website deployment. Hosting was not deployed; the source is available through Live Server.

The existing content-version policy may restart an unfinished activity when its content changes. No student reward/progress records were migrated. The prologue remains optional for unlocking existing required chapters.

## Verification

111 local non-emulator unit tests passed. Chrome loaded all four illustrations and completed the six-scene clue/decision/help sequence, including existing story recovery checks. The northern model map was visually inspected; see `docs/validation/population-map-preview.png`. Every field in the 27 planned documents was read back from original Firestore.

Independent teacher review, current-curriculum alignment and Grade 5 comprehension remain pending. Passing software checks does not establish measured learning outcomes or empirical equivalence of retry difficulty.

The authenticated original-project walkthrough subsequently passed all 24 teaching scenes, journal saves, deliberate quiz failure, mapped lesson review, targeted practice, five fresh retry questions, all four missions and artifacts, the 100% chapter challenge with evidence/matching draft restoration, badge, actual Chapter 1 continuation and replay without duplicate XP or artifacts. The temporary account and its owned records were removed. See validation/prologue-expanded-live-2026-10-27.json.
