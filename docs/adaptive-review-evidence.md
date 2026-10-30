# Adaptive review evidence

The review flow distinguishes **Review recommended**, **Lesson revisited**, **Building understanding** and **Practice goal reached**. Reaching a practice goal is limited evidence, not a claim of mastery or a mission completion.

The current Firestore `reviewEvidencePolicy` on active practice-question documents requires two distinct questions answered correctly on the first try across two successful saved sessions, including a `hard` question. A newer mistake resets the successful-evidence window. Repeating one question does not satisfy distinct-question coverage; duplicate session IDs do not increase session counts. Retired questions and evidence before the latest quiz are excluded. Missing or inconsistent policy keeps the recommendation rather than inventing a goal.

`data/review-evidence-policy.json` is an authoring input. `functions/setup-review-evidence.cjs` defaults to dry run, checks that every topic has enough distinct questions and the required difficulty, backs up changes and commits with update-time/create preconditions. On 27 October 2026, policy was applied and verified on 148 active practice questions covering 69 topics, including four new harder variants needed to make existing review goals attainable. Independent teacher review of these variants and difficulty labels remains pending.

A newer quiz replaces the older quiz diagnosis and prior practice window. This means recommendations reflect the latest mission assessment, not lifetime historical mistakes. Session completion records retain their original data; states are derived when loading the page. This is not a spaced-repetition scheduler and the two-session requirement does not enforce different days.

Lesson review completion appends an owned `studentReviewEvents` record containing user, mission, chapter, topic, scene IDs, `kind: lesson-review`, and a server completion time. It does not award XP or clear the topic. The Continue button waits for the save to finish; a failed save offers continuation with an explicit message. Append-only rules validate ownership, mission/chapter relation and the first scene's active topic mapping. These browser-created reading events are activity evidence, not proof a learner read or understood the lesson; rules do not certify all submitted scene IDs or honest reading.

Home, My Journey and practice show the derived states. Practice completion reports goal evidence and continues to offer the mission quiz; it does not unlock missions or award their XP. Failed history reads do not claim a goal was reached. Review-event read failures omit the optional reading state.

Verification includes six evidence-logic checks, practice/state browser checks, existing story/session recovery, and live Firestore permission checks for owner-only reads, mapped topics, no reward fields and append-only events. The full local non-emulator unit suite passes 85 tests.

The original-project website walkthrough also passed: failed quiz to mapped lesson review, recorded revisit, first-session recommendation retained, second-session goal reached with distinct/harder evidence, and no mission completion or XP from practice. Temporary accounts and owned records were removed. Report: validation/review-evidence-live-2026-10-27.json. This does not establish classroom comprehension or durable retention.
