# Classroom selector invalid-record fix - November 6, 2026

Fixed a race in the new Assigned Missions classroom dropdown. The change handler passed a callback that read the dropdown value only after task() entered busy state. applyArchiveState() called syncAssignmentBoard(), repopulating the dropdown from the old or empty classroom selection. The subsequent read could therefore send an empty ID to loadTeacherClass(), triggering Invalid record, or reopen the previous class.

Capture the chosen class ID before entering task(). Applied the same defensive capture to Announcement and Student Progress class selectors. No records, permissions or validation were weakened.

Validation: 48 mocked activity checks passed at 390px/1440px, now driving the actual classroom dropdown for initial selection and switching rather than calling openClass directly. Announcement (52) and Student Progress (78) regressions passed. Updated the running local preview and verified served source. No live Firebase records changed.
