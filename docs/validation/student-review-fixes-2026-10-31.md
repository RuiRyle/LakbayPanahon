# Student review fixes — 31 October 2026

Fixed the two confirmed product-copy defects: registration no longer calls the website a capstone test version or asks students to acknowledge a test-version notice; the locked finale no longer mentions retired preview mode. Registration still honestly states that final privacy/support arrangements are unfinished. No operator, contact, retention policy or completed terms were invented.

Settings now provides **Download my learning data**. It reads the signed-in active student's profile and cosmetics plus eleven owner-filtered learning/membership collections. Pagination preserves records across pages. Ownership, session changes, read failures, timeouts, repeated records and the per-collection limit fail closed before a file is created. No writes, account deletion, invitation listing or other-student reads are performed. The JSON file identifies its scope and exclusions; it is not advertised as all data held by Firebase or outside AI services.

Six focused checks cover scope/exclusions, pagination, foreign/duplicate ownership, failed/oversized reads, inactive profiles, session changes, controller success, retry and suppression of stale downloads. The fixed browser fixtures cover actual registration/Settings/finale markup, but the new download's Firestore reads and browser file dialog have not received a new signed-in live acceptance run. No Firebase access or deployed-rules change was needed for implementation.

The local package is `build/student-web-nosSZU/public` (26 pages, 543 files), with zero missing/rejected references. Nothing was deployed. Progression, scoring, XP, rewards, practice policy and the disabled testing-mode entry remain unchanged.

Account deletion still requires a verified support/admin process and is explicitly unavailable. Remaining content review, independent teacher/learner comprehension, intended-device/listening, optional AI suitability/response acceptance and hosted-release verification remain open. This fixes concrete review findings without declaring the entire student product finalized.

The full regression passed 394 checks across 64 suites and all 17 browser fixtures. Two additional controller checks were added afterward and the final focused export suite passed all six checks; the full recorded run includes the first four export checks. [Full-run evidence](student-review-fixes-local-2026-10-31.json).
