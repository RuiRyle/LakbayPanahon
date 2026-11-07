# Teacher evidence-to-action flow

Updated 6 November 2026. Implemented locally, not deployed.

## From an individual learning report

A mission with a current dated review signal now offers Write guidance and Plan personal review. Guidance opens the existing private feedback form on the correct mission. If an unsent message belongs to another selected mission, switching requires confirmation and keeps the text.

Plan personal review carries only class/student/mission identifiers and a topic key, not student names or private message text. When exactly one diagnostic topic is present, it is requested as the focus. Multiple topics leave focus selection to the teacher rather than silently choosing one. Student Progress still avoids downloading the full story catalog; the destination planner validates the topic against current authored mappings.

## At the assignment planner

The shortcut rechecks the selected active class, current loaded membership, current mission and topic mapping before replacing form state. The existing unsent-change confirmation runs before reset. The selected student is shown on the correct roster page, including students beyond the first 20.

The planner opens with targeted-review purpose, receiving class, student, mission and validated focus set. Status defaults to Draft, instructions stay for the teacher to write, and the status explicitly says Nothing has been sent. Publication still uses existing live membership/rules, duplicate checks, version protection and uncertain-save recovery. Prefilling is not submission or approval.

## Confirmations

Personal-review publication confirmation uses the saved operation's target count, not reviewTargets after form reset. It identifies the receiving class and My Class > Activities destination. Private feedback confirmation identifies the student and My Class > Overview > Your teacher's guidance. Drafts remain explicitly hidden from students.

## Validation

- teacher-assignments-design.cjs: existing responsive planner coverage plus six assertions at each width for exact prefill, no submission, draft protection, changed membership, removed mappings and recipient count/destination.
- teacher-student-progress-design.cjs: existing responsive reports plus retained review-route context and unsent-guidance protection.
- teacher-publication-recovery.cjs: confirmed/ambiguous save and refresh recovery passed.
- Direct module syntax check passed.

No new database fields, rules, automatic messages, assignments or rewards. Topic evidence remains a suggestion to review, not a diagnosis or proof that an intervention is required. Separate private explanation-response inboxes are unchanged.
