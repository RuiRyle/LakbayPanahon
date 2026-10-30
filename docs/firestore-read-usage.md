# Firestore read usage audit and reduction

## Observed usage

The read-only Cloud Monitoring audit is saved in `docs/validation/firestore-usage-audit.json`. It queried successful Firestore document-operation metrics, not the database documents. For the interval beginning at Pacific midnight (2026-10-27 07:00 UTC) through 2026-10-27 17:09 UTC, it reported:

| Operation | Reported count |
| --- | ---: |
| Successful document reads | 49,367 |
| Successful writes | 3,333 |
| Successful deletes | 576 |

The [official Firestore quota documentation](https://firebase.google.com/docs/firestore/quotas) lists 50,000 free document reads per day, 20,000 writes and 20,000 deletes, with daily quota resetting around midnight Pacific time. Read usage near that threshold, together with the existing `429 RESOURCE_EXHAUSTED / Quota exceeded` database response, strongly suggests the daily read allowance is the problem. Monitoring counts are not an authoritative identification of the exact exhausted quota and can lag or differ from billing/quota counters. No attribution to a single student, screen or test run was established.

Around midnight Pacific is approximately 3 PM Manila during October daylight saving time, and 4 PM Manila when Pacific standard time applies. This reset guidance applies to a daily quota, not every possible resource limit. The failed quota response alone does not prove when access will recover.

Usage can be checked at Firebase Console > Firestore Database > Usage, with Google Cloud quota views available for further detail. Repeated database probes and full live walkthroughs are deferred while quota is exhausted.

## Code changes

- `js/chapter-challenge.js` now queries missions by current chapter, challenges by current chapter, and questions by the selected challenge. It no longer downloads every chapter's challenge questions at entry. Existing client-side status and identity checks remain.
- `js/review-question-catalog.js` loads practice banks only for distinct mission IDs in the signed-in learner's quiz/practice history. Records from another user do not supply mission IDs. A learner with no history makes no practice-bank requests. Requests are not persistently cached, so teacher edits and later attempts remain fresh.
- `js/student.js` and `js/student-review.js` use this scoped loader. The dashboard retains its optional-review failure handling: a missing bank is not silently treated as completed review evidence. User history remains queried by user ID; the helper also filters ownership.
- The four pending Chapter 5 live walkthrough scripts now scope main questions by quiz, challenge questions by challenge, missions by chapter and story scenes by mission. They no longer fetch the entire main-question catalog for each quiz attempt.

The earlier repeated live walkthroughs also downloaded full catalogs. Narrowing the future test reads addresses that avoidable load alongside website reads. Exact per-source contribution to the day's usage is unknown.

These changes reduce unnecessary documents fetched. They cannot replenish an already-used quota or guarantee the free plan will cover any number of users. No billing plan, Firebase rules, grading policy or student reward data was changed. Data still comes from the original Firestore project. No emulator was used or enabled.

## Validation and limitations

All 158 non-emulator unit checks passed, including zero reads for new learners, one bank request per distinct owned mission, failure propagation and dashboard query scoping. The Chapter 5 challenge and existing evidence-challenge Chrome fixtures passed prerequisite, grading, draft, badge, replay, recovery and completion-navigation checks. The Chapter 5 fixture rejects unscoped challenge catalog requests.

No live student walkthrough was rerun while the quota issue remained. The website edits are local and available through Live Server; Firebase Hosting was not deployed. Missions 3-4 and the Chapter 5 challenge remain unpublished. Once access is restored, follow the guarded publication order in `docs/chapter5-challenge.md` and run the narrowed walkthrough once; do not repeatedly rerun every older live acceptance script.

## Short-lived instructional catalog cache

Era cards, era-scoped chapter lists and chapter-scoped mission catalogs now use `js/instructional-content.js` and the tested `js/content-cache.js`. Entries expire after two minutes, share in-flight identical requests, and reuse JSON catalog data across full-page navigation through tab-local sessionStorage. The cache is bounded to 24 entries, keyed by account, clears on account changes and offers Refresh Learning Content on the chapter/mission page heading. Disabled storage falls back to memory. Failed reads are not cached; non-JSON Firestore values are not persisted.

Account access checks, student history/progress, unlock checks and reward transactions continue reading fresh data. This first cache increment deliberately covers navigation catalogs only; story scenes, assessment banks and other catalog consumers have not been moved into it. A cached display may reflect teacher edits up to two minutes later unless manually refreshed. Firestore remains the source; no authored lesson data was embedded in runtime code.

170 non-emulator unit checks passed, including cache expiration, navigation reuse, concurrent sharing, account switching, error retry, storage fallback and non-JSON bypass. Existing chapter and mission Chrome navigation fixtures passed; those fixtures stub the cache while exercising navigation behavior. Live read savings have not been measured against the quota-blocked database. No database changes or Hosting deployment were performed.
