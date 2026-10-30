# Student live preview and progression checks

On 28 October 2026, authenticated Chrome walkthroughs used temporary student accounts against the original `lakbaypanahon-1797e` Firebase project. Each account and its owned records were removed by the walkthrough cleanup; the latest recovery file was confirmed absent. Existing student records were not touched.

## Exploration preview

- Opened the mission page and first story lesson for all 15 numbered chapters and the prologue (16 active chapter entries). Each loaded through the student website.
- Opened the challenge page for all 15 numbered chapters and the prologue (16 active challenges); each displayed an enabled preview start action.
- Opened the Era 4 overview, Chapter 15 Mission 1 lesson and main quiz, and Chapter 15 final challenge. Submitted all five main-quiz answers through the answer-review step in local preview.
- Completed all ten Chapter 15 challenge activities in authenticated preview: five clue-and-conclusion decisions and five matching tasks. The result rendered, and no chapter completion, badge or XP was saved.
- Confirmed that preview navigation and quiz submission did not create mission completion, chapter completion, quiz attempt or badge ownership records, and did not change the temporary student's XP.

## Normal progression

- Turned off exploration preview for the test browser tab and followed the dashboard's first recommended mission to its lesson.
- Answered its five main-quiz questions using the active Firestore quiz bank. Passing saved one mission completion and added the mission's authored XP reward.
- Replayed the mission quiz. XP and the single completion record remained unchanged.
- Completed all four prologue missions under normal prerequisites. Their accumulated XP matched the authored mission rewards.
- Passed the prologue's ten-activity chapter challenge. One chapter completion and one badge ownership record were saved; the challenge added no XP. The result action opened unlocked Chapter 1 under normal prerequisites. Replaying the challenge created no duplicate chapter completion or badge.
- Reran the complete prologue recovery walkthrough in normal mode after setting exploration preview off only in its temporary browser tab. A failed quiz opened its mapped teaching scene, targeted practice saved feedback, and the retry used five fresh equivalent questions. All four lessons and missions, four artifacts, the ten-activity challenge at full score, badge, Chapter 1 continuation, and replay reward protection passed. The temporary account and owned records were removed.

These checks cover chapter and challenge entry, Chapter 15 challenge grading in preview, and the complete prologue mission/challenge progression in normal mode. They do not certify every scene interaction, all other mission quizzes or chapter challenge rewards, historical accuracy, Grade 5 comprehension or Bayani AI replies. Normal prerequisite locks remain available; the user's local exploration preview was not changed. Firebase Hosting remains undeployed.
