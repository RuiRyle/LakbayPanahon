# Chapter completion: a clear next step

29 October 2026. The chapter-result page now waits for the next-chapter lookup before enabling its primary action. While checking, the page confirms that the chapter is saved and shows “Checking Your Next Step...”.

If the lookup fails, the saved completion remains visible. Students can return to their era/map or select “Check Next Chapter Again”. Retrying runs only the navigation queries; it does not submit the challenge or rewards again. Duplicate retries are ignored while a lookup is pending.

Pending responses are scoped to the current account, session generation and displayed result button. Sign-out or replacement of the result prevents late responses from updating the page. Queries retain the existing era, candidate chapter and student-owner filters. There is no automatic retry loop.

The status panel uses the navy/gold theme. It sits above the result actions so the primary button retains its gold styling. The original Back to Missions action is available while the lookup runs.

The persistent student shell also now replaces its outer route query with the actual displayed activity after supported same-origin navigation, hash changes and history changes. Browser Refresh therefore reopens the activity currently on screen instead of the shell's original entry page. The route validator retains the existing student-page allowlist and pages-directory/origin restrictions. Replacing the URL does not reload the shell or its audio host.

## Local verification

Eleven targeted unit checks passed, including three shell-route checks. The expanded local Chrome continuation fixture also passed pending-click prevention, visible failure/retry, duplicate-read prevention, unchanged reward submission count, explicit-retry keyboard focus and sign-out races. The existing chapter-challenge Chrome fixture passed interactions, save retry, badge/replay and session recovery.

```powershell
node --test --test-isolation=none tests/chapter-continuation.test.cjs tests/student-recovery-action.test.cjs tests/student-dashboard-recovery.test.cjs tests/student-shell-route.test.cjs
node tests/chapter-continuation-browser.cjs
node tests/chapter-challenge-browser.cjs
```

## Bounded live verification

The existing Chapter 5 live harness now supports `--recovery-tail-only`. It creates one temporary account, seeds explicitly labelled earlier-era and Chapter 5 mission-completion fixtures only for that account, replays Mission 2, exercises missing-content/offline/reconnected/slow-save behavior, completes the chapter challenge through its real controls and clicks into Chapter 6 under normal locks. It does not repeat the four lessons or claim that fixture completions were earned in this run.

The harness follows the displayed same-origin shell frame, opens the quiz briefing before answering, waits for visible controls and asynchronous next-step readiness, verifies saved answers by question ID, stops on quota errors and removes temporary Auth before cleaning owned Firestore records. It uses a real top-page reload when checking refresh, including after opening Chapter 6. A recovery file is retained if cleanup is incomplete. The user's personal exploration session is not changed.

Live outcome: all 18 recorded steps passed against original Firestore. Mission 2 replay preserved XP; missing missions showed recovery; offline answers saved after reconnection; slow-network answer B was read back; chapter evidence/matching drafts survived reload; the ten-task challenge awarded one badge without mission XP; the result opened Chapter 6 under normal locks; and a real top-page refresh stayed at Chapter 6. The temporary Auth account, 15 owned learning/profile records and recovery file were removed. See [bounded live evidence](validation/student-recovery-tail-2026-10-29.json).

The first two attempts stopped on harness issues: targeting the outer shell rather than the displayed activity, and treating missing initial XP as `NaN` rather than zero. Both temporary accounts and their owned records were removed. These are not counted as passed runs. The final run followed the real displayed controls and actual top-page reload.

The live result screenshot exposed an unthemed white next-step panel and ID-specific button styles overriding theme rules. The final CSS fixes the panel, badge chips and result actions. A subsequent local Chrome run loaded the actual styles and checked heading/primary-button contrast plus the nonwhite back-action background. The live navigation run was not repeated solely for these CSS changes.

Frontend changes remain workspace-local until public website deployment. No content migration or rules deployment is needed for these navigation changes. This completes the specifically interrupted recovery acceptance slice; it does not replace curriculum review, learner comprehension or full-project release checks.
