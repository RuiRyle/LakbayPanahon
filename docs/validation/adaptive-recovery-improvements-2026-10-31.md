# Adaptive quiz recovery clarity — 31 October 2026

Implemented following the user's request to improve the explained failure flow.

- Changing an earlier answer now asks for confirmation before clearing later answers, with the affected count. Cancel preserves both the original choice and later answers; confirming retains the existing adaptive-reset behavior.
- The score label explicitly says Mission Quiz Score. The personalized-check introduction explains that mission answers are locked and extra checks cannot turn a failing main score into a pass or change rewards.
- Failed results show one recommended topic first, with the other topics in a closed, keyboard-accessible disclosure. All original topic lesson/practice routes remain available. The primary review button names its topic, while Retry Quiz Now remains an optional shortcut. The duplicate general lesson link is hidden on failure when a specific recovery topic exists.
- Failure recovery controls appear above the long answer explanations. Passing results restore the original position below rewards. Explanations and feedback remain available; none were removed.
- At the end of practice, optional topic disclosures explain the configured practice evidence goal and current distinct-question/session counts. They explicitly say the goal does not block retrying the main quiz.
- Replaced ambiguous question-mark separators in the quiz journal and practice introduction with readable separators/arrows.

No pass threshold, difficulty-selection algorithm, question quota, mandatory personalized-check behavior, reward policy or persistence schema changed. No AI calls, content/rules publication or website deployment occurred.

Verification: the full fixed suite passes 302 unit checks in 47 suites and all 14 mocked browser fixtures. Quiz fixtures cover cancel/confirm reset, fail/retry/pass, collapsed additional topics, specific recovery links, controls before explanations, blocked storage, rewards, saving and account changes. Final punctuation changes were followed by focused quiz and practice browser checks. This is local/mocked evidence; the earlier real-account chapter and failure/review/practice walkthroughs retain their original scope and were not unnecessarily repeated.

Rebuilt package: `build/student-web-QfGdRu/public`, 25 pages, 517 hash-verified files, zero missing/rejected references. The current source is also available through the project's usual local development server.
