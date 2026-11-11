# Assessment answer exposure follow-up — 11 November 2026

Fixed in current source: editable main quiz questions no longer expose correctAnswer, explanations, answer explanations or other grading-only feedback through issuance/advance/resume. Feedback remains available in completed review. Regression submits five questions, checks every intermediate state for grading secrets, and confirms submitted review contains feedback.

Daily correct-answer display now uses the submitted answer only after the trusted service confirms it passed. This remains compatible with pre-submit answer-key suppression. Seven classroom tests, two public-card projection tests and the daily browser fixture pass.

Audit correction: exploration-preview.js currently unconditionally disables the retired exploration mode. The inactive old preview implementation is not a legitimate current student flow; denied answer-bank reads must remain denied even if someone manually flips the browser flag. No new preview bypass will be enabled.

Practice deliberately exposes explanations for learning. Current backend comments and score calculation confirm these sessions influence support, not canonical reward eligibility; extra practice does not change the main quiz score. Do not misrepresent browser-authored practice evidence as secured mastery. Keeping practice feedback public is distinct from exposing main/chapter grading banks.

The unpublished rule candidate now replaces student dailyChallenges access with dailyChallengeCards access, in addition to blocking canonical browser writes and main/chapter bank reads. Public-card migration must happen before releasing this frontend/rule pair. The Render deployment still uses the earlier grading code and has not received the pre-submit feedback fix. Therefore policy remains disabled until a matched deployment and hosted checks. Nothing was published or pushed in this step.
