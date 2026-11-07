# Grade 5 student website playtest

**Current procedure — 1 November 2026:** Use the [ready-to-run review kit](../student-review-kit.md) and its student handout. The preview is hosted, original progression is enforced, and exploration/testing mode is retired. No teacher or student group is available yet; no learner session or human acceptance is claimed. The dated adult dry run below is historical evidence only.

Prepared 29 October 2026. This is a **plan**, not a completed student study. Automated Chrome checks confirm many links, saves and rewards; they do not establish that a Grade 5 learner understands or enjoys the experience.

Adult website dry run on 29 October: an authenticated temporary student opened Era 4, Chapter 15 Mission 1, submitted its five-question quiz in preview, and opened the final challenge; no progress or rewards were saved and the account was removed. The first-scene screenshot revealed that the “modern teaching diagram” caption had dark text on a dark bar. The shared story CSS now gives that caption light, normal-case text, and the Chapter 15 Chrome check asserts the computed color. The authored mission has three main-content paragraphs per scene, roughly 130 words total; the learner session should still test whether that load is comfortable. This dry run did not include a child.

## Before inviting students

1. Have an adult run the tasks once in the current local website. Confirm the story images, quiz, practice and result controls still work after the latest edits.
2. Check historical accuracy and the intended Grade 5 wording with a curriculum reviewer. The current content has not received independent teacher approval.
3. Use a supervised session and an approved student account. Avoid recording names, email addresses, faces, voice, chat text or screenshots of a child's account in this repository. Record only anonymous observations such as “Learner 1 missed the route clue.”
4. Use the hosted URL in [current release status](../website-release-current.md), or the reviewed local package. The Hosting preview runs the normal application with real Firebase accounts, saved progression and one-time rewards. There is no exploration toggle. Arrange appropriate adult supervision and account/data handling before inviting learners; the preview URL alone is not approval for broad student rollout.

## Session A: first journey, about 20 minutes

Start on **Home** with the prologue available. Ask the learner to:

1. Find the first mission without being told which navigation item to press.
2. Read and interact with the first prologue story. Ask: “What did you learn from this clue?”
3. Open the five-question mission quiz. Ask them to explain what they think they must do to pass and what happens after a wrong answer.
4. If a quiz attempt fails, ask them to find the story topic to review, then try practice and a fresh quiz attempt. Do not deliberately force wrong answers or tell them an answer.
5. Find My Journey and describe what the topic status means in their own words.

Observe whether the learner can find the next action, understand the scene checks, distinguish a clue from a historical fact, and recover from a mistake without losing confidence.

## Session B: later historical reasoning, about 20 minutes

Use **Explore Chapters → Era 4 → Chapter 15 → Mission 1: Trade, Travel and the Sharing of Ideas** only with an account that has legitimately reached it. Do not bypass prerequisites or alter a learner's completions. If that chapter is unavailable, have the adult content reviewer inspect the matching entries in the [private review packet](../learning-review-packet.md); keep this learner task marked not observed. Do not give the answer-key packet to learners.

Ask the learner to:

1. Read the museum exhibit task and describe why the Iloilo and Suez clues matter.
2. Select a route and explain *which clue* supports the choice.
3. Complete the lesson, then describe what they think the five-question quiz will check.
4. Answer quiz questions and use the answer review screen before submitting.
5. Point out where they would go if they wanted help understanding a missed topic.

Observe the six illustrated scenes closely. The authored mission package has roughly 130 words of main content per scene, before interactive text. Note any scene the learner skims, rereads repeatedly or cannot explain. Check whether they mistake the fictional museum/family cards for primary historical records, or treat the symbolic Suez diagram as a scaled map.

## Return-to-learn check

The **Remember This** card appears only when a completed topic is due under the Firestore `reviewAfterDays` policy, currently three days. Do not change a child's record to force it. If a due card appears naturally, ask what the one-question check means, whether **Another Memory Clue** is understandable, and whether they know the story/practice links save different kinds of work. Otherwise show the card on an adult-owned test account separately.

## Observation sheet

Use one anonymous row per task. Do not store student identities or answer transcripts in the project.

| Task | Completed without help? | Confusing words or controls | What the learner said the idea means | Change to consider |
| --- | --- | --- | --- | --- |
| Find first mission |  |  |  |  |
| Explain a story clue |  |  |  |  |
| Finish an interactive scene |  |  |  |  |
| Understand quiz pass/fail |  |  |  |  |
| Recover through review and practice |  |  |  |  |
| Explain My Journey status |  |  |  |  |
| Explain Chapter 15 route evidence |  |  |  |  |
| Use answer review before submission |  |  |  |  |
| Use a due Remember This card, if available |  |  |  |  |

After each session, list the top three observed problems with the exact screen and control. Fix repeated blockers first, then revise wording and visual details. Repeat the affected tasks with learners who have not seen the revised screen. Do not count “clicked through” as evidence of historical understanding; ask for a short explanation in the learner's own words.
