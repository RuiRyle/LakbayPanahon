# Teacher learning reports and exports

Implemented locally; hosting is not deployed.

Reports include completion history, quiz history, per-mission comparison, latest review signals and historical review-topic counts. Historical topic counts are explicitly distinguished from current unresolved difficulty.

CSV and Print Learning Report reload current records with existing class ownership and membership checks. They export student/class names, generation time, mission progress and quiz attempts only. Private teacher support notes, teacher feedback messages, contact information and unrelated profile fields are excluded. Missing dates/scores remain unavailable and UTC timestamps are labelled. CSV quotes fields and neutralizes spreadsheet formula prefixes. Print builds a separate document with textContent and removes its hidden frame after print, timeout or workspace clearing.

Validation passed:

- Three unit tests for learning-record selection, excluded fields, timestamp/empty states, CSV quoting and formula prefixes.
- Teacher browser regression at 390px and 1280px, including changed records read at export time, no export after failed reads, and exclusion of private notes/feedback from print/CSV data.
- Separate teacher-page navigation and report deep links at 390px and 1280px.
- Shared-page generation check, JavaScript syntax checks, and data dictionary audit.

Tests use actual modules and synthetic mocked Firebase records. Browser export tests intercept file/print output to inspect its data; they do not verify a physical printer, browser PDF output or a spreadsheet application's rendering. No live learner records or database schema were changed by this feature.
