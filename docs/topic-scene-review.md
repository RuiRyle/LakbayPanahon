# Topic review through lesson scenes

Review cards now open `story.html` with the mission, chapter and `reviewTopic`. The story reads active Firestore scenes belonging to that mission, keeps their authored order and selects those whose `reviewTopics` array includes the topic. Scene exploration, decisions and quick checks remain required before continuing. After the last review scene, the next action is targeted practice, not the main quiz.

Review mode does not read or overwrite the ordinary lesson draft, award XP, complete a mission, or remove a recommendation. Existing quiz/practice evidence still determines recommendations. Returning to the full lesson restores its normal behavior and saved position. Topic reviews themselves currently restart after refresh; they do not have a separate persistent draft.

## Required curriculum mapping in Firestore

In Firebase Console → Firestore Database → Data, open the existing `storyScenes` document that teaches a topic. Add `reviewTopics` as an **array of strings**. Each string must exactly match a `topic` value used by that mission's active quiz/practice questions. Add that topic to every scene required to explain it, including necessary context scenes. One scene can teach multiple topics.

Do not use the display `topicLabel`, invent a topic ID, or copy mappings across unrelated missions. Read the scene content and associated assessments before assigning a topic. Scene quick checks should assess the reviewed concept; add or revise curriculum through the normal authoring process if coverage is missing.

No curriculum mappings are automatically guessed or written to the original database by this change. Until these mappings are authored, a recommendation opens the full mission lesson with an explicit notice that a specific scene mapping is not configured. Existing lessons and practice remain usable.

The story's existing interactive checks provide the initial understanding check. Questions, explanations, hints and difficulty remain Firestore content. Finishing review alone does not establish mastery; subsequent practice/quiz responses provide evidence.

## Verification

Chrome checks cover mapped scene selection, retained scene checks, normal draft isolation, full-lesson fallback, targeted-practice routing, and existing story/practice session recovery.

## Original-project mapping applied � 27 October 2026

Reviewed the existing Firestore scene content and assessed topics. Applied and read back reviewTopics tags on 29 active story scenes, covering all 29 active assessed topics across five missions. The reviewed mapping is in data/topic-scene-mapping.json; functions/apply-topic-scenes.cjs defaults to dry run and uses update-time preconditions with a pre-write backup. Only reviewTopics changed. Existing story content, questions, student records and rewards were untouched. An independent curriculum review is still recommended, especially for broad introductory farming/fishing coverage. Newly authored topics still require scene mapping; the fallback remains available.

## First-mission learning enrichment

All six Life in the Barangay scenes were revised in original Firestore. The revision adds an applied decision to every scene, expands checks and vocabulary, makes fictional teaching scenarios explicit, and asks students to connect claims to evidence. Existing scene imagery, reviewTopics and student records were preserved. Source references and pending independent curriculum/reading-level review are recorded in data/barangay-scene-enrichment.json. The migration uses per-field content checks, update-time preconditions, a backup and readback verification. Changes to scene content invalidate old lesson drafts through the existing content-version check; mission completions and rewards are unaffected.

Help Me Understand replaces the disabled AI explanation button. Six first-mission scenes now contain learningHelp maps in Firestore: explanation, vocabulary (term/definition entries), example and guidingQuestion. These are authored support, not generated answers; independent teacher review remains pending. Scenes without a valid explanation hide the button. Panels toggle, reset with scene changes, and render text safely. No Cloud Functions call is made for story help. Original database writes were backed up; rereading all six documents confirmed matching content (map key order ignored).
