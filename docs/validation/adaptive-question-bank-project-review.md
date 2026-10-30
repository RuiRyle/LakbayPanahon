# Project-wide adaptive question bank

## Scope

The content snapshot dated 2026-10-27 contains 17 active quizzes, each with five topics and two active medium-difficulty items per topic. The repository also contains local migration content for 49 additional quiz IDs. Those migration files are repository content and are not evidence that those quizzes are already published.

Across the snapshot and local migration content, the inventory covers 66 quiz IDs and 330 quiz-topic pairs. The Mission 1 source manifest is [`mission1-adaptive-quiz-question-drafts.json`](../../data/mission1-adaptive-quiz-question-drafts.json). [`other-missions-adaptive-quiz-question-drafts.json`](../../data/other-missions-adaptive-quiz-question-drafts.json) adds two difficulty variants for each of the other 325 quiz-topic pairs: 325 easy and 325 hard items.

## Publication status

On 2026-10-30, 660 question documents were published to the LakbayPanahon Firestore project with `status: active`. A read-only audit confirmed 660 active, zero draft, and zero missing documents. The backup is [`adaptive-question-bank-1793290668147.json`](../../backups/adaptive-question-bank-1793290668147.json).

The local manifests intentionally retain `status: draft`; the publisher changes that field to `active` only during publication. The 49 quiz IDs sourced from local migration files may not correspond to quizzes already active in Firestore, so their question documents will not be offered unless the associated quiz is active.

The Firestore content snapshot from 2026-10-27 contains 17 parent quiz documents, all active. A fresh read of the parent `quizzes` collection was rate-limited on 2026-10-30, so the current status of the 49 migration-only parent quizzes could not be confirmed. The 660-question audit confirms the question documents, not those parent quiz documents.

## Draft generation

The additional items use each topic's existing question, answer choices, answer key, learning point, and clue. The easy item checks recognition of the topic's main idea. The hard item asks the learner to make a focused conclusion from a lesson note and distinguishes that topic from nearby ideas. The builder is [`build-other-missions-adaptive-question-drafts.ps1`](../../scripts/build-other-missions-adaptive-question-drafts.ps1).

The non-Mission-1 items are generated editorial scaffolds. They were published after project-owner approval, but were not independently reviewed item by item by a teacher. Review them for Grade 5 readability, answer clarity, and curriculum fit, and revise any weak items. The local manifests remain drafts even though active copies exist in Firestore.

## Adaptive selection flow

At the start of a scored mission quiz, the selector keeps the blueprint's topic counts and question count. For each topic, recent mastery chooses the target level: `review-needed`, `practising`, or a recorded miss targets `easy`; a completed practice goal or at least two recent results at 80% or better targets `hard`; otherwise the quiz's blueprint difficulty is used. The selector fills a topic quota with items closest to that target, mixing neighboring levels when a single level does not have enough items. With one alternate easy or hard item and two medium items for a topic, a review-needed learner gets one easy and one medium item, while a learner who reached the practice goal gets one hard and one medium item.

During the scored attempt, each submitted answer can also reroute the next unanswered question. The selector weighs topics needing more practice and moves difficulty after correct or incorrect answers, while preserving the remaining blueprint topic quotas. The new variants are active in Firestore, but their item quality remains unreviewed; the publication status does not certify their historical accuracy, readability, or difficulty. The client skips hard items with the repeated generic answer found in the quality audit and falls back to available levels until replacements are ready.

After the scored mission questions, the existing short follow-up continues adapting to answers during that attempt using active `practiceQuestions`. Its result informs review recommendations and does not change the mission score.

## Required review

For every item, a teacher should confirm Grade 5 readability, topic alignment, difficulty level, a single defensible answer, plausible distractors, accurate answer feedback, and appropriate historical framing. The hard items in particular need review to confirm that the note supports the keyed conclusion and that the other choices are clearly unsupported in that context.

The adaptive selector now uses the active variants. The chapter-end challenge collection remains separate and was not changed by this mission-quiz publication.

## Verification and chapter challenges

On 2026-10-30, `node tests/mission-flow.test.cjs` passed all 16 tests. `node tests/mission-quiz-browser.cjs` passed the headless browser flow for fail/retry/pass, reward handling, load recovery, auth refresh, and delayed load/save after sign-out. The browser scenario also confirms that a wrong answer on a medium item routes the next scored item to an easier variant while keeping all five topic quotas. Two-question-per-topic unit checks cover the real blueprint shape and confirm mastery-based starting sets can mix one alternate-level item with one medium item. A second check ensures new sets skip the known generic hard-item template while saved attempts can still resume.

Chapter-end challenges are not difficulty-adaptive yet. The audited snapshot has 55 active challenge question documents; the local chapter migration files add 140 more challenge items. These use mixed interaction types such as historical decisions, matching, trade simulations, and evidence tasks, but have no topic or difficulty metadata. Their fixed authored sequence and mixed scoring cannot be safely passed through the mission quiz selector. Adaptive chapter challenges need reviewed topic/difficulty labels and parallel, equivalent tasks for each supported interaction type before runtime selection can change. No challenge scoring, completion rules, or live challenge content were changed in this pass.
