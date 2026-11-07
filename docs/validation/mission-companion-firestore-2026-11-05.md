# Mission companion Firestore boundary — 5 November 2026

Completed the first item of the agreed one-at-a-time implementation: the Mission/Story companion now consumes the `learningGuide` field from the mission document already loaded by its page. It no longer imports the 66-guide JavaScript catalog. No additional Firestore reads or writes, provider changes, reward changes or deployment were performed.

The existing authoring input moved from `js/mission-learning-guides.js` to `data/mission-learning-guides.authoring.js`. The offline content builder still uses it to prepare guarded migrations. It is excluded from the public dependency inventory.

The page supplies its loaded mission after successful loading and clears the companion on reload/error. A request/reply event handles either module initialization order without fetching the mission again. The companion checks the exact current Auth user object, validates matching mission/chapter identifiers and question/choice/feedback/answer structure, and clears activities/reflections on session changes or page exit. Missing or malformed optional guides remain hidden rather than substituting bundled content. The ordinary lesson remains available.

Choices now use the published array length and answer index rather than an assumed three-choice layout. Questions and feedback remain plain text. Targeted topic review continues to hide the whole-mission companion.

Validation:

- 12 local tests passed: all 66 guide shapes, malformed/missing/mismatched data, published edits and variable choice counts, existing authoring/publication guards and public-package boundaries.
- Companion Chrome fixture passed at 1440px and 390px: all 66 activities, edited text/choices/answer, feedback, retry, private reflection cleanup, old-account rejection, exit and restoration. Uses simulated loaded Firestore-shaped mission data.
- Mission and Story browser regressions passed, including the actual producers' loaded-mission handoff, late-subscriber request and failed-load cleanup. Firebase is mocked in these checks.
- JavaScript syntax checks and scoped whitespace checks passed. The refreshed offline public inventory has no missing/rejected references and excludes the authoring catalog while including the runtime validator.

The existing all-mission publication record establishes the earlier guide-field publication; this change did not reread production content or run a live signed-in walkthrough. Existing tab-cached mission data follows the current content-cache lifetime and Refresh Learning Content behavior. Hosted users require a rebuilt/deployed frontend to receive these code changes.

Next separate task: migrate the detective-case runtime catalog to Firestore with a reviewed schema and scoped publication plan. It remains unchanged in this step. AI, trusted assessment, privacy and other assessment findings also remain open.
