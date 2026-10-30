# Chapter 2 Mission 3 — Islam and Cultural Exchange

Published to original Firestore project `lakbaypanahon-1797e` on 27 October 2026. Five existing curriculum documents were updated: scenes 2, 4, 5 and 6, plus mission objectives and recap. The opening encounter, Islamic-teachings scene, scene order, assessment banks, XP, artifacts and student completions were preserved.

## Teaching improvements

The locator scene identifies Mindanao, Jolo in Sulu and Simunul in Tawi-Tawi. These are approximate modern reference points, not a map of historical rule, recorded journeys or the religion of all residents. A worked example uses north/southwest relationships before making a cautious claim about possible contact.

The community-development investigation compares connected contributions: merchants create opportunities for contact, teachers explain teachings, families pass knowledge and local leaders support relationships. It is explicitly a fictional teaching case, not a rigid assignment of one role to each kind of person or a complete account of every community.

The timeline distinguishes a religious milestone associated with the Simunul mosque site from Sulu sultanate development in the 1400s. The 1380 date is presented as associated with the site in official recognition, not a universal conversion date or the age of every part of the current building. Differing exact dates for sultanate development are acknowledged; the lesson uses the broader century rather than asking children to memorize one disputed founding year. Religious teaching and political organization are related but distinct processes.

The recap connects the locator, chronology and people-based explanation with Chapter 3's wider maritime investigation. It maps all five main-quiz topics and the existing respect-for-religion topic. Three non-repeated observation cards, applied choices and authored vocabulary/help support every revised scene. Existing understanding checks remain. No worship, personal religious disclosure or representation of every Muslim community is required from a learner.

Three SVG illustrations in `assets/story/` provide a southern locator, contribution cards and a timeline comparison. The locator derives from public-domain Natural Earth geometry. Markers are approximate and small islands are omitted at this scale. Accessible descriptions and `imageFit: contain` retain the complete labels. Timeline spacing is explicitly not to scale.

## Sources and maintenance

Historical references are [RA 10573's recognition of the Simunul mosque site](https://elibrary.judiciary.gov.ph/thebookshelf/showdocs/11/57087), [NCCA's politico-diplomatic history overview](https://ncca.gov.ph/about-ncca-3/subcommissions/subcommission-on-cultural-heritagesch/historical-research/politico-diplomatic-history-of-the-philippines/) and the [BCPCH site-validation account](https://bcpch.bangsamoro.gov.ph/bcpch-regional-validating-team-conducted-site-validation-activity-in-the-municipality-of-indanan-province-of-sulu/). The legal source is used for its historical commemoration, not as legal guidance. No present administrative membership or territorial extent is inferred from the historical locator.

`data/islam-exchange-learning-pilot.json` contains authored lessons. `functions/build-islam-exchange-learning.cjs` generates the guarded migration; `functions/apply-islam-exchange-learning.cjs` defaults to preflight and supports backed-up atomic `--apply` plus readback verification. Runtime text, feedback, source references, topic links and image URLs come from Firestore. The illustrations must accompany normal website deployment; Hosting was not deployed. Live Server serves the current files. Content-version checks can restart an unfinished activity; completed missions and rewards were not migrated.

## Verification

123 local non-emulator unit tests passed. Chrome completed all four revised scenes, their existing understanding checks and authored help and loaded the illustrations. The locator was visually inspected. Firestore readback verified all five target documents. Independent teacher/source review, current-curriculum alignment and Grade 5 comprehension review remain pending; software checks do not establish learning outcomes.

Authenticated original-project acceptance passed all six mission scenes, timeline-image loading, scene and quiz refresh, passing the unchanged five-question quiz, configured XP/artifact and replay without duplicate XP. The temporary account and all owned records were removed. See validation/islam-exchange-live-2026-10-27.json.
