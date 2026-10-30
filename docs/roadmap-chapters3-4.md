# Roadmap 1.1 — Chapter 2 Mission 3 and Chapters 3–4

Applied to the original Firebase project `lakbaypanahon-1797e` on 27 October 2026. This implements the scope requested from the user's approved project roadmap; it does not implement the era prologue or Eras 2–4.

## What is playable

| Chapter | Missions |
| --- | --- |
| 2 | Islam and Cultural Exchange: preserve six existing story scenes, add authored help, revise ten quiz variants and add ten practice questions |
| 3 | Seafaring and the Balangay; Trade Networks with Neighboring Asian Societies; Goods, Technologies, and Cultural Exchange; Early Trading Centers and Maritime Communities |
| 4 | Ancient Writing and Communication; Indigenous Arts, Crafts, and Technologies; Regional Diversity and Cultural Traditions; Contributions of Early Societies to Filipino Identity |

Each of the eight new missions has five teaching scenes with three exploration clues and an applied decision per scene, vocabulary, help content, source references and topic-review links. Each has five topic/difficulty slots for the main quiz, two variants per slot and separate easy/hard practice. Main quizzes retain five questions and 60% passing. Matching the blueprint establishes coverage consistency, not measured difficulty equivalence.

Each new chapter ends with ten activities: six decisions and four matching activities. Passing is 70%. Missions award their configured XP and one artifact; chapter challenges award badges without extra XP, matching existing completion behavior. The existing Chapter 3 Mission 1 ID and 100-XP value were preserved; the other seven new missions use 50 XP configured in Firestore. A Chapter 2 badge was also supplied because its catalog entry was missing; students with prior chapter completion can obtain it through the existing replay/backfill behavior.

Chapter 3 now has `contentReady: true`; Chapter 4 is active and ready. Existing prerequisites remain: previous chapter challenges unlock later chapters in the same era, and prior missions unlock later missions. A fresh student cannot jump directly to these chapters. Chapters 1 and 2 and their saved progress were not reordered or replaced.

## Data and application behavior

The atomic package covers 277 documents: 90 quiz questions, 90 practice questions, 46 scene changes (40 new scenes and help on six existing scenes), eight missions, eight quizzes, eight artifacts, two chapters, two chapter challenges, twenty challenge activities and three badges. New scene artwork uses the existing visual fallback with a Firestore-configured symbol; this package does not supply historical illustrations or audio.

Authored content lives in `data/chapter34-learning-units.json` and `data/chapter34-final-challenges.json`. `functions/build-roadmap-chapter34.cjs` produces `data/roadmap-chapter34-migration.json`; these files are authoring/migration inputs, not browser runtime catalogs. Runtime content comes from Firestore. `functions/apply-roadmap-chapter34.cjs` defaults to dry run, restricts writes to curriculum collections, checks reviewed fields, backs up changed documents and uses a single atomic commit with update-time/create preconditions. Reapplying the current package reports zero changes and verifies the saved fields.

Backups are retained in `backups/`. No learner records were changed by this migration. Existing completions and rewards remain saved. Content-version checks may restart unfinished Chapter 2 Mission 3 lessons/quizzes. Frontend Hosting was not deployed.

## Source and editorial boundaries

The roadmap supplies the chapter structure. Historical framing draws on the National Museum's [maritime archaeological evidence](https://www.nationalmuseum.gov.ph/2022/09/20/the-9th-to-10th-century-archaeological-evidence-of-maritime-relations-between-the-philippines-and-the-islands-of-southeast-asia/), [ceramics collection](https://www.nationalmuseum.gov.ph/our-collections/archaeology/stoneware-and-porcelainware/), [writing gallery](https://www.nationalmuseum.gov.ph/2022/10/21/baybayin-ancient-and-traditional-scripts-of-the-philippines-gallery/), and [basketry collection](https://www.nationalmuseum.gov.ph/our-collections/ethnology/mats-and-baskets/), the National Museum's [Butuan tentative-list submission](https://whc.unesco.org/en/tentativelists/2071), the NCCA's [intangible heritage overview](https://ncca.gov.ph/about-culture-and-arts/culture-profile/intangible-heritage/) and the [DepEd Grade 5 learning-competency reference](https://lrmds.deped.gov.ph/detail/15672). Source URLs are stored with the authored content.

Activities are fictional teaching investigations, not original accounts of named historical encounters. The writing mission distinguishes Kawi-related copperplate evidence from Baybayin and recognizes continuing community scripts. Heritage activities avoid copying restricted designs or requiring religious practice. Teaching about present-day living traditions is identified as continuity/change, not proof that every practice existed unchanged before colonization.

Independent teacher review remains pending for current curriculum alignment, historical interpretation, Grade 5 comprehension, distractor quality, reading load and retry difficulty. These checks do not certify curriculum approval or student usability.

## Verification

- Seven roadmap unit checks cover package scope, all nine mission assessments, fresh retries, answer keys, practice separation, scene mappings, chapter prerequisites, actual grading and one-time artifact/badge rewards.
- Chrome rendered and completed the clue/decision interactions in all forty new scenes and displayed their help panels.
- Chrome rendered all twenty new final-challenge activities and accepted valid choices/matches, alongside chapter save/replay/session checks.
- Every planned field was read back from original Firestore; a subsequent apply found zero changes.

These browser checks use fixtures. The migration verification reads the live curriculum; a real student walkthrough and independent classroom review remain separate acceptance work.
