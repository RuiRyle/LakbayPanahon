# Teacher regression follow-up

The synthetic combined teacher browser fixture now correctly awaits asynchronous report rendering, mission selection, follow-up editing and return-to-list actions. Progress fixtures include chapter IDs; display expectations use the current singular counts and class-goal terminology. The published announcement is checked through its Published filter rather than the preserved Drafts filter.

The check-in scenario now verifies that a future-dated result remains uncertain and is not promoted into an actionable review judgment, then verifies that a valid latest failed result supplies a review signal. Missing quiz evidence stays neutral. These checks were reached successfully at both tested widths, followed by private feedback/follow-up revision protection, export and announcement/assignment publication checks.

Two stale teacher messages claimed earlier independent completion counted for a class goal. Updated both to require a passing quiz opened from the class assignment, with personal progress separate. Source syntax and eight focused classroom-submission/moderation tests pass.

The complete combined teacher fixture is still FAIL: it reaches the assignment completion-summary assertion, which currently expects earlier solo completion to count. Remaining fixture scenarios must be rewritten to verify separate solo evidence followed by a fresh assignment-linked submission. No full teacher acceptance is claimed, and actual multi-page navigation remains separately unverified. No production data or deployment changed.
