# Topic-preserving lesson and practice navigation

Updated 6 November 2026. Local changes only.

## Fixed

The targeted-practice introduction and practice lesson shortcut previously opened the general mission lesson without reviewTopic. Both now preserve the selected topic, chapter and mission.

The shared learning-navigation module provides an encoded topic-route helper and one contextual shortcut outside the breadcrumb list: Back to targeted practice on a focused lesson; Review this lesson topic on targeted practice. The actual breadcrumb still describes the chapter/mission hierarchy. Ordinary lessons without a topic do not acquire a targeted link. No caller-supplied external return URL is followed.

Targeted practice returns with topic and review=1. The full mission quiz remains a mission quiz rather than being mislabelled as a topic quiz. Existing lesson/practice save/resume handling, authentication and unlock checks remain in place. Opening an unsaved route does not itself confirm a save, change progress or award XP.

## Validation

- learning-topic-navigation.test.cjs: three checks for round-trip topic preservation, URL encoding, incomplete/general routes and arbitrary-return-URL exclusion.
- student-review-browser.cjs: actual practice module with mocked Firebase; new assertions cover both fixed lesson links. Existing draft resume/recovery, empty/failing content and lesson/quiz escape-route checks passed.
- Direct practice module syntax check passed.

## Scope still to review

These routes preserve topic context, not classroom/assignment identity across the entire learning journey. The direct classroom overview-to-review handoff was implemented separately. A future cross-page classroom return should carry validated class/activity identifiers and recheck active membership; it must not use an arbitrary return URL or imply that navigating back completes an assignment.

No database fields/rules, new draft formats, background requests or deployment were introduced.
