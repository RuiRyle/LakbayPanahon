# Student desktop website walkthrough ? 27 October 2026

Passed using local website files, real Firebase web SDK modules and the original `lakbaypanahon-1797e` project. Chrome ran headlessly at a 1440 ? 1000 desktop viewport. No emulators or mocked learning data were used. This was automated UI acceptance, not a manual review of every screen.

## Verified

- Actual registration form created a fresh student and continued to the dashboard.
- Dashboard recommended an eligible first mission.
- First lesson exploration, decisions and quick checks reached the recap.
- After the save confirmation, refreshing restored the completed lesson recap.
- The first mission quiz failed and its result navigated to targeted practice.
- Five practice questions completed and the practice session saved.
- Practice navigation returned to the quiz; an equivalent fresh question set passed.
- Passing returned to the mission journey and unlocked the next mission.
- Both missions in the first chapter passed through their real quiz controls.
- All ten chapter questions completed through historical decisions, matching and trading controls; chapter completion saved.
- Continue to Next Chapter opened the unlocked next chapter's mission journey.
- The dashboard displayed two completed missions, one badge and 90 XP.
- Replaying the first mission added no XP.
- The actual Log Out control returned to login; the actual login form restored the dashboard, journey guidance and unchanged XP.
- The temporary account and its owned Firestore records were removed after the successful run.

## Extended desktop acceptance

The follow-up run also passed:

- Required-field, terms and password-mismatch validation through the actual registration form; invalid submissions created no account.
- Profile form name/avatar editing using the live Firestore avatar catalog.
- Refresh of an unfinished quiz, mastered practice question and partial chapter decision/matching/trading interactions; saved answers, position and session IDs remained unchanged.
- A second complete chapter challenge retained exactly one badge; mission replay retained original artifact ownership.
- The updated Achievements page displayed the earned badge.
- The live daily activity rejected a wrong answer without XP, saved a correct answer with configured XP and one-day streak, and remained completed after refresh without extra XP.
- Fresh login restored edited name/avatar, XP/streak and the original mission/chapter/artifact/badge records.
- Missing mission URLs for lesson, quiz and practice showed recovery controls.
- Offline quiz input clearly reported unsaved state; reconnecting saved the same answer to original Firestore. A slower connection also reached confirmed save.

Temporary students and owned records were removed after the runs. Registration-validation-only checks created no account. [Recorded results](student-desktop-results-2026-10-27.json) contain no credentials.

## Additional fixes

Achievements now offers retry after failed reads, preserves earned ownership counts when catalog details are missing, loads details concurrently, deduplicates ownership IDs and ignores responses from replaced sessions or older requests. Available cards remain visible during partial detail failures; failures are distinguished from an empty collection. Badge content renders as text.

Shared lesson/quiz/practice/chapter drafts now explain that offline changes are unsaved and will resume saving when reconnected. They report success only after Firestore acknowledges the write. An explicit write failure keeps its retry message even when connectivity changes. Unsaved-leave protection remains active until saving succeeds or the draft closes.

## Fix found and verified

Firestore snapshots can return map fields in different orders between reads. Draft content versions previously compared ordinary JSON strings, so unchanged lessons could appear changed and restart after refresh. Lesson, quiz, practice and chapter content versions now canonicalize nested map fields while retaining array order. Real content changes still invalidate saved answers. Older unfinished drafts using the previous version format may reset once; completed progress and rewards are separate records.

A regression deliberately reorders lesson fields and confirms its saved position remains valid. The current verification total is 59 passing local unit tests and 13 passing local browser suites, including Achievements and offline draft handling. The legacy emulator-only security suite was excluded.

## Evidence and limits

[Desktop dashboard screenshot](student-desktop-dashboard-2026-10-27.png). Re-run explicitly with `node tests/desktop-live-walkthrough.cjs`; this creates and removes a temporary live student and requires the existing Firebase CLI project login for cleanup. Its generated report and screenshots are placed in a temporary directory; credentials are removed after successful cleanup. Use `--recovery-only` for missing-content/offline/slow-network checks and `--validation-only` for registration validation without creating an account.

Not established by these runs: physical-phone behavior, every desktop viewport and keyboard/visual combination, every registration/server failure, server-revoked-token expiry recovery, or historical/curriculum accuracy. Focused local tests cover further session/read/save failures, but do not establish every live failure case. Phone work remains deferred.

Frontend Hosting was not deployed. No runtime curriculum or configuration was added or changed by the walkthrough.
