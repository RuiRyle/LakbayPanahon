# Chapter completion navigation polish

Implemented 28 October 2026. This is a frontend behavior change; no Firestore
curriculum or learner migration is required.

After an acknowledged chapter pass, the page reads chapter metadata only for the
current era and progress only for the current user. It selects a candidate using
existing readiness/order/owned-completion rules. Only when a candidate exists does
it query active missions for that chapter. It no longer reads every mission or
every era's chapters to choose the continuation. Legacy chapters without eraId
retain the old chapter-catalog fallback, while mission reads remain scoped.

This reduces navigation lookups; existing grading and reward validation reads still
run because they are needed to save the result. It does not change answer grading,
mission rewards, the passing threshold or completion ownership requirements.

A playable next chapter offers Continue to Next Chapter. When none is available,
the action is Return to Era, using the verified loaded chapter's eraId. The era
page offers review and progress. Missing legacy era data falls back to Explore
Chapters. A lookup failure uses the same safe destination and never changes an
acknowledged result or leaves a stale next-chapter link. Session-generation guards
still reject late results after sign-out.

The pure nextChapterCandidate helper chooses metadata without claiming that a
chapter has playable missions. nextChapterAfterCompletion still verifies the
active mission check. A candidate without active content is not advertised as a
playable next step.

419 local checks passed. Browser checks cover scoped queries, era return,
next-chapter links, lookup failure, saved rewards, duplicate prevention and session
recovery. Existing Chapter 15 authored challenge, legacy chapter challenge and era
overview browser checks also passed. These are mocked browser checks; live student
acceptance testing remains pending. No Hosting deployment was performed.

Refresh Live Server to load the change. Temporary local exploration preview remains
active; normal saved completion behavior should be tested with preview turned off
when the user is ready to restore progression testing.
