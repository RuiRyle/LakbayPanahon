# Teacher workflow implementation and activation handoff

**Activation update:** The user approved publication, the reviewed rules are [published and verified](teacher-rules-publication-2026-10-31.json), and the [isolated real-SDK check](teacher-workflow-live-2026-10-31.json) passes with cleanup complete. The original prepublication evidence below remains a dated handoff snapshot. Website Hosting is still not deployed.

Implemented the five ordered teacher steps in source: approved-account guard; owned class creation/edit/archive/restore and invitation management; active-member mission/quiz reports; announcement and mission-assignment draft/edit/publish/withdrawal; student-contract integration checks. See [workflow and limitations](../teacher-workflow.md).

Validation evidence:

- [Local emulator](teacher-workflow-emulator-2026-10-31.json): 57 checks passed against the actual candidate Firestore rules, using local synthetic records and identities. Includes query authorization, cross-teacher denials, draft isolation, invitation replacement, archived reporting denial, membership removal and progress preservation.
- [Local browser](teacher-workspace-browser-2026-10-31.json): 22 checks each at 390px and 1280px, exercising the actual guard, class policy, class client and workspace modules against an in-memory Firestore adapter. Includes name/report rendering, text injection defence, edit-in-place, approval dialog, error recovery and session cleanup. Source hashes recorded.
- Focused policy/guard suite: 32 checks passed.
- [Student regression](teacher-student-regression-2026-10-31.json): 406 checks across 65 suites and all 17 browser fixtures passed. This report is separate from future runs of the current acceptance report.
- [Offline permission review](teacher-rules-review-2026-10-31.json): hash-verified last-published baseline, 15 named teacher/class/report scopes changed, unrelated scopes preserved. [Full before/after text](../teacher-rules-review.md).
- Local release: `build/student-web-2QRnsI/public`, 26 entry pages, 547 files, no missing or rejected static references. Hash-verified by the existing release builder. Includes teacher pages alongside student entry pages; directory naming does not restrict it to student pages.

Local preview image: [teacher dashboard](teacher-workspace-local.png). Its synthetic records are browser-fixture data, not shipped product classes or learner records.

Nothing deployed. The actual application continues to use normal saved progression and the configured Firebase project. No testing/exploration UI was enabled. The local emulator was stopped after checks.

Automatic approval review rejected the online Rules API verification because it uploads private rules with local credentials. We replaced that check with local emulator validation and did not retry or bypass the rejection. Publication of the reviewed rules remains an external activation step requiring explicit approval; the guarded publisher is prepared in `functions/publish-teacher-rules.cjs` but has not been run in publishing mode.

After publication, an isolated real-SDK teacher/student walkthrough is still required; browser mocks and REST emulator checks are not hosted acceptance. Admin verification management remains the next workflow. No existing teacher was approved or real learner account modified during this implementation.
