# Chapter 5 normal progression: live website check

The test used the original Firebase project and local website pages on 29 October 2026. Exploration preview was disabled only in the temporary test browser. Earlier era chapter completions were seeded only for the temporary account so Chapter 5 could be reached under normal locks. This check does not prove the whole journey from first registration through Era 1.

## Completed walkthrough

The first temporary student completed all four Chapter 5 lessons (six illustrated scenes each), passed all four five-question mission quizzes, and completed all ten challenge activities. Refresh restored lesson, quiz and challenge drafts. Each mission awarded its configured XP and artifact once; replay added no XP. Mission completion alone did not award a chapter badge. Passing the chapter challenge awarded its badge once and no extra mission XP. The result offered **Continue to Next Chapter**. The temporary account and its owned records were removed. Evidence: local report in `lakbay-chapter5-challenge-live-GH9xHQ/report.json` under the system temporary directory.

## Interrupted recovery walkthrough

A second temporary student failed Mission 1, followed the mapped story review, saved targeted practice with no XP, and passed a retry using five different questions. Mission 1 awarded its XP and artifact once; Mission 2 also passed and awarded its reward. During the Mission 2 replay, Firestore returned HTTP 429, and the website correctly retained the answers with a save error. The rest of this walkthrough, including clicking through to Chapter 6, remains unverified. The temporary Auth account was deleted; its owned Firestore test records remain pending removal because cleanup reads also return 429. The recovery file is `C:\Users\RUIRYL~1\AppData\Local\Temp\lakbay-chapter5-challenge-live-kQIInd\test-account.json`; it contains temporary credentials and must not be shared or committed.

Once Firestore quota recovers, run `node functions/cleanup-chapter5-live-test.cjs "C:\Users\RUIRYL~1\AppData\Local\Temp\lakbay-chapter5-challenge-live-kQIInd\test-account.json"` from the project root. The script validates the temporary identity and deletes only records owned by its UID. Keep the recovery file until cleanup succeeds. Then rerun the failed recovery walkthrough and verify the Chapter 6 result action. Avoid further live test accounts while the cleanup is pending.

The walkthrough now fetches Chapters 5 and 6 and the current era by document ID, scopes quizzes by mission, and reuses previously loaded authored catalog rows for replays. This reduces its own Firestore reads on the next run. Syntax was checked locally; the revised live run awaits quota recovery.

Grade 5 learner comprehension, independent content review, Bayani AI acceptance and Hosting release remain separate student-side work.

## Cleanup completed

29 October 2026: after Firestore became available, `cleanup-chapter5-live-test.cjs` verified the recorded temporary identity, removed 19 owned Firestore documents and deleted the recovery file. No new test account was created. The interrupted recovery steps and Chapter 6 result action remain unverified; this cleanup does not mark that walkthrough complete.

## Recovery tail completed

Later on 29 October, the bounded `--recovery-tail-only` run passed the previously interrupted Mission 2 replay and connectivity checks, completed the ten challenge tasks, received the chapter badge and opened Chapter 6 through the actual result button. A real top-page refresh preserved Chapter 6 and normal learning locks. Four earlier mission completions were explicitly seeded fixtures for that isolated account, so this is continuation/recovery evidence rather than a new run of all four lessons. The temporary Auth account, 15 owned learning/profile records and credential recovery file were removed. The user's exploration mode was not changed. See [the current implementation record](../student-chapter-continuation-recovery.md) and [18 live check results](student-recovery-tail-2026-10-29.json). The older interrupted-run notes above remain historical evidence.
