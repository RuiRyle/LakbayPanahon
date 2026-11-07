# Quiz topic insights

Implemented locally using existing authorized student quiz-attempt reads. No additional collection, learner write or permission expansion is introduced.

Current signals use each student's latest clearly dated attempt per mission. All recorded topics counts diagnostic-topic appearances across attempts, including retries. Duplicate labels within one attempt count once. The same topic ID in different missions stays separate. Missing, future and tied-latest dates block current claims for that student/mission while retaining labelled history. Counts describe the currently loaded group, not the whole class.

Validation passed: three focused unit tests; teacher browser checks at 390px and 1280px covering filters, readable labels, uncertainty, group scope and unavailable records; and separate-document navigation tests. These checks use synthetic records and do not establish mastery, per-question correctness rates or learning gains.

The feature reuses the check-in group reads and updates when that group changes. Loading replaces previous topic output. No new rules are required specifically for insights; hosting remains unpublished and previously added teacher features have separate pending rules changes.
