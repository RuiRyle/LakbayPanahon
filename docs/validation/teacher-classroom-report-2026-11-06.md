# Classroom learning report

Implemented 2026-11-06 in Teacher > Student Progress > selected classroom > Class learning snapshot.

Prepare class report checks fresh classroom membership and loads current student reports in groups of three, only on request. It displays a timestamped snapshot and offers Download class CSV. All current members are included, independent of roster search and pagination. Archived classrooms cannot prepare reports. Each student report uses the existing authorization and membership checks.

Completion counts distinct completed missions matching the available catalog. Latest quiz evidence excludes undated and future attempts; tied latest timestamps are marked unclear. Missing reads are marked unavailable rather than zero. Exports omit private notes, feedback and email addresses, and reuse formula-safe CSV escaping. These are saved practice records, not official school grades.

Validation: five export tests passed; the student-progress browser suite passed at 390px and 1280px, including full preparation for 21 mocked members and table containment. Syntax, shared-page consistency and release packaging passed. No live data was changed, no real export was downloaded, and nothing was deployed.

Limits: report loading scales with the number of current members and their saved learning records. It is an on-demand snapshot rather than a simultaneous database snapshot, and must be prepared again after new activity. A partial report explicitly marks failed student reads unavailable.
