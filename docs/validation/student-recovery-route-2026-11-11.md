# Fail-to-recovery navigation review — 11 November 2026

Verified with synthetic browser fixtures and pure-policy tests: failed quiz identifies a lesson topic; topic lesson links to practice; practice preserves its topic and returns to the same mission quiz; classroom context is carried only for same-origin, same-mission learning routes. Generic/malformed routes do not fabricate a targeted destination. Mission quiz browser checks include fail/retry/pass and changed retry questions; hint fixture checks preserve first-try scoring.

Wording fix: empty practice content no longer incorrectly sends learners to the dashboard. It points to the existing Review Lesson and Retry Mission Quiz actions. Topic lesson completion now says Start Practice for This Topic; practice begins with Start Practice. Missing scene mapping still explicitly offers the full lesson and does not invent a precise topic match.

Eight focused navigation/recovery tests and quiz/practice/hint/story browser fixtures pass. These are not a full authenticated hosted walkthrough; the user previously confirmed a hosted quiz works. Current wording/contrast changes remain local and are not pushed. No Firebase data, permissions or deployment changed in this step.
