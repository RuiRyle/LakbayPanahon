# Misconception feedback pilot: Seafaring and the Balangay

Updated 6 November 2026. Implemented locally for chapter3-mission1 only; not deployed.

## Student loop

1. Answer a practice question.
2. If the choice is wrong and authored choice-specific feedback is available, read why that selected choice needs another look.
3. Read an authored answer hint/general hint and compare it with the remaining choices. A link returns to the same lesson topic; the shared navigation can preserve a classroom origin.
4. Try again. A correct retry displays the normal correct-answer explanation and removes the old coaching block.
5. When targeted practice has a different question on the same topic remaining, Try another example replaces the generic Next label. It does not generate a new question or promise an unseen item when none is available.

This uses existing question answerExplanations, answerHints/hint/historicalClue and topic metadata. No historical claims, answer keys or question content were rewritten. Missing selected-choice feedback falls back to the existing hint behavior. Other missions retain their current flow.

## Learning evidence

The scaffold supports reasoning but does not automatically assess a student's written explanation. A correct answer after a wrong try remains firstTryCorrect=false in the existing practice result. It awards no extra XP or mission completion. The authored multi-question/multi-session review policy still controls recommendation clearing. Completing a retry is not presented as mastery, retention or evidence that the software outperforms classroom instruction.

## Validation

- practice-misconception-pilot.test.cjs: selected-choice explanation, non-solution clue selection, fallback/scope checks, and coverage of every authored pilot practice distractor in the offline verified-overlay catalog.
- practice-misconception-pilot-browser.cjs: actual practice controller in the existing mocked browser fixture, switched to the pilot mission. Covers specific wrong-choice feedback, topic return link, coaching cleanup after correct retry, another available example, assisted accuracy, saved drafts/recovery, write failures, and sufficient later clean evidence.
- student-review-browser.cjs: existing nonpilot practice regression passed.
- Module syntax check passed.

The browser fixture uses synthetic questions/results to exercise logic; catalog checks separately cover authored feedback presence. Neither certifies historical accuracy, child comprehension or comparative learning effectiveness. Teacher review and a supervised pilot remain required before extending the approach or claiming an educational effect.

## Next

Try this limited loop with the intended learners and a content reviewer. Record whether students can identify the relevant clue and explain why a rejected option does not fit. Refine wording before expanding to other missions. Do not clear review simply for opening the lesson link or reading the feedback.


## Accessible first-mission pilot

On 6 November 2026, the same feedback loop was also enabled for prologue-mission1 (The Philippines as an Archipelago: Location and Geography), chapter era1-prologue. It uses that mission's existing authored feedback and clues; no prerequisites were bypassed. The browser pilot supports --first-mission and passed assisted-scoring, retry, recovery and next-example checks.
