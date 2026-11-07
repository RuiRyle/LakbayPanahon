# Return to the originating classroom activity

Updated 6 November 2026. Implemented locally; not deployed.

## Student behavior

Classroom overview and activity-card lesson/quiz links now carry classroom and activity identifiers. The shared learning navigation shows Back to my class activity while this context is present. Same-mission lesson, targeted practice and quiz links preserve it, including links rendered after loading. Explicit lesson-to-practice/quiz, practice-to-quiz and failed-quiz-to-lesson navigation also preserves context. Moving to another mission or general journey stops carrying the earlier activity context.

A successfully saved classroom quiz offers Back to class activity as its main result action. Returning is navigation, not assignment completion: the classroom reloads its own saved evidence. Existing save/retry guards and unlock rules remain in place.

## Return validation

my-class.html accepts classroom/activity identifiers only as a navigation request. It reloads the signed-in student's memberships and permitted class goals/private reviews before choosing a class or activity. A matching returned activity opens Activities, resets a restrictive activity filter, opens its completed/ended history when appropriate and receives focus. Closed/withdrawn work retains read-only behavior.

A missing activity or inaccessible class produces a plain unavailable message instead of opening a different task. Failed activity reads offer Refresh Classes rather than declaring the activity gone. No arbitrary external return URL is accepted, no foreign class is fetched solely from the query, and no membership or publication is created by the return.

Context is explicit in URLs rather than stored in browser-wide mutable state. This avoids carrying one account's classroom origin into unrelated independent learning. Learning pages validate identifier shape; actual authorization remains enforced by existing Firestore rules and classroom membership queries.

## Architecture

learning-navigation.js owns the context parser, same-origin/same-mission route decorator and return link. A guarded MutationObserver decorates rendered anchors without intercepting native or modified clicks. It disconnects on normal page disposal and remains available for Back/Forward-cache restoration. Page-specific programmatic transitions use the same navigation object's carry method. No new database fields, rules, listeners or draft formats are introduced.

The current return points to the activity, not an exact scroll offset or unsubmitted answer. Existing activity drafts remain responsible for session restoration. This patch does not claim a successful save merely because a student navigates away.

## Validation

- learning-topic-navigation.test.cjs: five policy tests covering topic round trip, ID validity, same-origin/same-mission boundaries and external-return exclusion.
- classroom-return-navigation-browser.cjs: seven actual shared-module browser checks for explicit/dynamic/programmatic/modified-click context and Back/Forward handling.
- student-classroom-hub-design.cjs: 42 assertions at each of 390px and 1440px, including current membership, unavailable activity and correct return selection.
- student-review-browser.cjs, mission-quiz-browser.cjs and student-navigation-browser.cjs passed their existing recovery, auth, reward and navigation regressions.
- Release package: build/student-web-iowx98, 33 pages, 572 files, no missing/rejected references.

No production account, learner record or published website was changed in this pass.
