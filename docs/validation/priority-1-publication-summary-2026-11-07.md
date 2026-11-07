# Priority 1 - Firestore publication and verification

Published 7 November 2026 (Asia/Manila), using the user's explicit approval. Priority 2 was not started.

## Publication safety

- Project: `lakbaypanahon-1797e`.
- Exactly 13 approved `missions` documents and 65 objective sentences.
- Only `learningObjectives` was included in each update mask.
- All live original objective arrays matched the approved expected arrays. No content conflicts occurred.
- Created and read back a recoverable backup immediately before the atomic commit: `backups/mission-objective-wording-1793984126520.json`. It contains all 13 raw original documents, their update times, and original objective lists. Original lists were checked again against the approved plan after publication.
- Used one atomic Firestore commit with current-document updateTime preconditions. There was no automatic retry or overwrite of a concurrent edit.
- Read back all 13 documents: all revised arrays match exactly and every other decoded mission field is identical to its pre-publication value.
- Plan SHA-256: `37bb99df64ad7c47d55ed490c3f1a0dff8c9659d29b26689a52804ddcf38e83f`.

## Student interface verification

The real local student pages and Firebase SDK connected to live production Firestore. An isolated temporary student had explicitly synthetic prerequisite records for access; no real student account was used. All 65 sentences were first checked before publication, then verified after publication through the existing mission trail and learning-goal disclosure. Apostrophes, the Manila-Acapulco hyphen and all sentence punctuation matched the approved corrected strings exactly; no corrupted question marks or replacement characters were present.

After publication, the lesson loaded and its displayed paragraph matched the device narration utterance verbatim. The actual mission quiz loaded its question and answer controls from live content. The walkthrough did not submit a quiz, earn rewards, or listen to device audio. Hosted-page deployment/caching and audible pronunciation were not independently tested.

Each preflight/post-publication test student and its 85 owned synthetic records were removed. The preflight's first attempt stopped before publication because its URL-selection assumption did not match the page's existing last-completed-mission review behavior. The test was corrected to select through the mission trail; the preflight and post-publication walkthrough then passed. No application change was made for this test correction.

## Regression results

- Post-publication Node test run: 37 passed, zero failures. Covers objective-only scope, changed-value conflict checks, Firestore masks/updateTime guards, lesson/audio compatibility, quiz grading, replay-safe XP/artifacts, saved progression, mission/chapter/era gating and unchanged topic coverage.
- `tests/mission-journey-browser.cjs`: passed selection/review, saved progress unlocking, challenge gating, return refresh, retry and session isolation.
- `tests/mission-quiz-storage-browser.cjs`: passed fail/retry/pass, rewards, loading recovery and delayed save/load after sign-out.
- Live post-publication walkthrough: 16 successful checks, including exact live SDK reads, all 13 rendered objective lists, lesson narration text and quiz loading.

## Evidence

- `priority-1-objective-publication-2026-11-07.json`: atomic publication/readback evidence and backup location.
- `priority-1-objective-live-readback-2026-11-07.json`: live mission content readback.
- `priority-1-student-interface-preflight-2026-11-07.json`: live preflight and cleanup.
- `priority-1-student-interface-published-2026-11-07.json`: post-publication interface checks and cleanup.

## Recovery

If restoration is later authorized, restore only the originalObjectives arrays from the verified backup, using a learningObjectives-only update mask. First check that current live arrays still equal the published revised arrays, then use fresh document updateTime preconditions. Do not restore entire backed-up documents, because that could overwrite unrelated later edits. No rollback was necessary or performed.

Only Priority 1 objective content was published. The website code, narration system, historical lesson content, questions, reward rules and real learners' saved records were not changed by the migration.
