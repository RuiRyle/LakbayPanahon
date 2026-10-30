# Geography learning pilot — Prologue Mission 1

Published 27 October 2026 to the original Firestore project, `lakbaypanahon-1797e`. The update changes 27 curriculum documents; no learner records or reward configuration were changed.

## Learning sequence

1. Find the Philippines in Southeast Asia and north of the Equator using a regional locator.
2. Follow a worked north-arrow example using Manila and Cebu City, then compare Cebu City with Davao City.
3. Locate the major island groups and choose their general north-to-south order.
4. Connect resources, skills and travel in a fictional livelihood problem. Introduce tropical/maritime climate and distinguish climate from one day's weather.
5. Independently interpret a locator using its legend, location dots and north arrow; distinguish supported claims from invented historical journeys.
6. Connect the five ideas in a field-journal recap before the quiz.

Each scene has three observation cards that add information rather than copy the main paragraphs verbatim, an applied decision, feedback and authored help. This uses the existing accessible choice-based investigation; the map is an illustration with equivalent descriptions, not a draggable or clickable geography game. The six scenes are an instructional choice for this pilot, not a new fixed quota.

The ten-question main bank retains the existing five-topic blueprint, five questions per attempt and three-correct passing rule. Retry selection can choose the other variant for each topic. Ten practice questions use different prompts and retain easy/hard review-evidence configuration. Matching topic coverage does not prove equal measured difficulty. New questions and examples still need teacher review.

## Data and assets

`functions/build-geography-pilot.cjs` authors `data/geography-pilot-migration.json`. The migration updates five existing scenes, adds `prologue-mission1-scene6`, revises the mission introduction/objectives/recap and updates ten quiz plus ten practice questions. Text, observations, feedback, image references and assessment content are stored in Firestore. `functions/apply-geography-pilot.cjs` is dry-run by default; `--apply` checks field preconditions, creates a backup, commits atomically and verifies saved fields.

Three SVG maps in `assets/story/` are shipped static illustrations referenced by Firestore. They use public-domain [Natural Earth](https://www.naturalearthdata.com/about/) geometry; the subset and original source URL are in `data/prologue-map-coastlines.json`. Latitude-aware shared scaling avoids stretching the national silhouette to fill the image. Small islands are omitted. These are simplified modern locators, not authoritative boundary maps or evidence of ancient voyages. Modern city names serve as reference points.

Climate framing uses [PAGASA](https://www.pagasa.dost.gov.ph/information/climate-philippines). The geography context also references the [Philippine Embassy](https://philippineembassy-dc.org/about/). The addition addresses an audit gap; it does not certify alignment to the currently applicable curriculum.

The scene field `imageFit: "contain"` tells the website to show the whole illustration without cropping labels. Other scene images keep their current presentation. This source update and the SVG files must accompany the normal website deployment. They are available when running the repository through Live Server; Hosting was not deployed by this task.

## Progress and verification

Existing IDs, completions, XP and artifacts remain unchanged. The existing content-version policy may restart an unfinished lesson or quiz after these changes; old answers must not silently count as answers to revised questions. Topic review includes the relevant scene and the synthesis recap. The prologue remains optional for unlocking existing chapters.

All 95 local non-emulator unit tests passed. Chrome checks loaded all three map assets, completed the six scene interactions and authored-help panels, and exercised story recovery. Existing story and route browser checks passed. A local visual preview is saved at `docs/validation/geography-map-preview.png`. Firestore readback verified all 27 planned documents. A full authenticated pilot walkthrough, teacher content review and Grade 5 learner comprehension review remain pending.
