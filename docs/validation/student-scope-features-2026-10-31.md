# Missing student-scope features — 31 October 2026

Implemented against the [agreed scope](../project-scope.md), including the user's revised study summary. Independent learning remains available without class membership. No advertising, payment flow, mobile rewrite or teacher curriculum authoring was added.

## Historical Timeline

Open **Historical Timeline** in the student sidebar. The new `pages/history-timeline.html` stays inside the persistent student shell. It reads the existing Firestore eras, chapters, missions and owned progress, shows authored period labels and ordered chapters, offers a period filter and expandable mission topics, and links eligible chapters to their existing mission pages. Future chapters remain locked by the existing journey policy. Completed chapters can be revisited.

This is a timeline of selected curriculum topics. It does not fabricate exact historical dates, claim every historical event is represented, or introduce a competing static curriculum. More detailed event entries would require authored content rather than guessing dates from chapter order. Error/retry, empty, signed-out and stale-request states are supported.

## Published class announcements

Open **My Class** after joining a class. Announcements appear before assigned missions, newest timestamp first, with Philippine-time dates when supplied. Published messages are rendered as plain text; drafts are excluded. Announcement failure has its own recovery message and does not block assignments or independent learning. Empty announcements do not fabricate a teacher message.

The `classAnnouncements` schema is in the [data dictionary](../data-dictionary.md). Only active joined students can read published messages. Students cannot create/update/delete them. Teacher publishing must use a separately authorized teacher/backend contract; no teacher write privileges or teacher posting UI were invented as part of this student change.

The narrowly scoped read rule passed all 40 synthetic server Rules API cases. Live/local sources matched outside the addition. The previous rules were backed up; the announcement rule was published and read back exactly. See [comparison](class-announcement-rules-comparison-2026-10-31.json) and [publication](class-announcement-rules-publication-2026-10-31.json).

The extended `tests/live-class-flow.cjs` passed actual member queries, draft/nonmember/write denial and access revocation after leaving, alongside the existing join/assignment checks. Its two temporary accounts and all class/code/assignment/announcement/membership fixtures were removed. This verifies the student contract, not a teacher-created class workflow.

## Bayani-generated review questions

Open **My Journey → a review topic → Practise with Bayani**. The page loads the actual mission and its authored lesson content, preferring mapped review scenes. Only an explicit Generate click requests one question through the existing Bayani connection. The normal chat is a separate view to keep the review activity focused.

The result must contain a question, four distinct options, one suggested answer and an explanation within bounded lengths. Invalid replies show recovery guidance and do not retry automatically. The student chooses and checks an answer before seeing the explanation. Generated review is transient, labeled as AI practice, and grants no XP, grades, mastery evidence or mission completion. It does not send profile identity, scores or quiz answer keys. Returning to the lesson or authored practice remains available.

No actual AI generation was sent in this work. The existing provider/account, audience-suitability and signed-in reply acceptance remain unresolved as recorded in the Bayani setup documentation; mocked generation does not close them. No paid provider, model, billing, API secret or narration setting was changed.

## Verification and package

- Full fixed local audit: **302 unit checks in 47 suites and all 14 mocked browser fixtures pass**. This includes the new timeline/review fixture and existing class/chat/journey/session regressions.
- New exact-viewport checks pass at 390px and 1440px: timeline filtering, locks, safe text, failed-load recovery, sign-out races; generated-review preparation, explicit-only request, invalid response recovery and stale-account reply rejection. Initial fixture failures came from an incorrectly shared pending-read gate, which was corrected; no runtime guard was weakened.
- Nine public-boundary/header/local-server checks pass. A staged Chrome CSP/404/private-file check passed on the earlier same-feature package; final packaging was rebuilt after the final review-view/source-label changes.
- Final staged website: `build/student-web-xeXMeR/public`, **25 pages and 517 hash-verified files**, zero missing/rejected references. Website Hosting was not deployed. The separate announcement rule publication above is the only live configuration change.

Remaining acceptance includes current real AI replies/provider suitability, teacher announcement production, learning accuracy/learner usability, physical-device/audio checks and intended hosted frontend behavior. These features do not establish full curriculum coverage or long-term learning effectiveness.
