# Chapter 2 Mission 2 — attributed traditions and cultural evidence

Published to original Firestore project `lakbaypanahon-1797e` on 27 October 2026. Four existing documents were updated: scenes 4–6 and mission teaching metadata. The first three scenes, mission order, quiz/practice banks, XP, artifact configuration and student completions were preserved.

## What changed

Scene 4 explicitly labels the clever-bird tale as invented for the app, not an authentic ancient story or Hudhud chant. It uses the fictional scene to explain listening/retelling while introducing Hudhud as a distinct, attributed example of Ifugao oral tradition. A worked source-checking example covers origin, meaning, sharing limits and credit.

Scene 5 compares learning through performance with documented additional supports such as recording and organized teaching. It explains continuity/change without claiming that every performance has remained identical since precolonial times. Museum weaving examples illustrate diversity and the need for context; modern objects are not treated as proof of unchanged ancient designs.

Scene 6 supplies a named teaching example for the existing Manunggul Jar quiz questions. It distinguishes the observed boat-and-figure imagery, interpretation in relation to beliefs about death, and limits on broader or supernatural claims. Its source-summary illustration is not a photograph or depiction of original human remains. The recap maps all five main-quiz topics and retains the existing respect-for-traditions mapping.

Three non-repeated observation cards, guided decisions and authored vocabulary/help accompany each revised scene. Existing understanding checks remain. Two complete SVG illustrations in `assets/story/` provide an accessible continuity/change comparison and artifact source-summary card. The fictional storytelling scene keeps its existing illustration with an explicit fiction caption. Evidence Journal saving remains available.

## Sources and boundaries

Source framing uses [UNESCO's Hudhud entry](https://ich.unesco.org/en/RL/hudhud-epics-of-the-ifugao-00015), its [documented safeguarding project](https://ich.unesco.org/en/projects/safeguarding-and-transmission-of-the-hudhud-chants-of-the-ifugao-00004), the [National Museum mats and baskets collection](https://www.nationalmuseum.gov.ph/our-collections/ethnology/mats-and-baskets/) and [CCP's Manunggul Jar entry](https://epa.culturalcenter.gov.ph/3/82/2227/). These particular examples do not represent every community. Project descriptions are evidence of documented supports, not a claim that every program continues unchanged today or that UNESCO recognition dates establish a tradition's ancient origin.

The lesson reproduces no actual chant or restricted pattern and requires no ceremonial performance, personal religious disclosure or acceptance of a belief as a scientific fact. Interpretation of an artifact is distinguished from both observation and proof of a supernatural event. Independent teacher/source review, current-curriculum alignment and Grade 5 comprehension review remain pending.

## Maintenance and verification

`data/beliefs-learning-pilot.json` supplies authored content; `functions/build-beliefs-learning.cjs` creates the guarded migration. `functions/apply-beliefs-learning.cjs` defaults to preflight and supports backed-up atomic `--apply` with readback verification. Runtime text, source URLs, topic links, feedback and image references come from Firestore. Static illustrations must accompany normal website deployment. Hosting was not deployed; Live Server serves the current files. Content-version checks may restart an unfinished lesson; completed missions and rewards were not migrated.

120 local non-emulator unit tests passed. Chrome completed all three revised scenes, existing checks and authored help and loaded the illustrations. The comparison was visually inspected. Original Firestore readback verified all four documents. An authenticated original-project walkthrough completed all six mission scenes, preserved the comparison scene and quiz through refresh, passed the unchanged quiz, awarded the configured XP/artifact and replayed without duplicate XP. The temporary account and owned records were removed. See `validation/beliefs-live-2026-10-27.json`. These checks establish software behavior, not measured learning outcomes.
