# Review, practice and retry handoff

Locally checked on 2026-10-28. No Firestore calls, migrations or deployment.

A targeted lesson review carries chapter, mission, topic and review mode into practice. Practice filters its question pool to the requested topic. The retry link returns to the original mission quiz with the same chapter and mission. Existing saved drafts retain their session, answers, attempts and adaptive difficulty when valid; normal lesson drafts are not overwritten by targeted review.

Fixed a recovery gap in practice.js: an explicit topic review now starts at the quiz's configured reviewDifficulty even when saved practice history or diagnosis cannot be loaded. Previously, that route could keep the normal startDifficulty because the diagnosed-topic list was unavailable or empty. Existing valid draft difficulty is restored afterward. The change uses Firestore policy fields and does not hardcode an educational difficulty, alter grading or grant mastery.

Expanded the actual story and practice mocked-data Chrome fixtures. They check that a lesson-review save failure keeps targeted practice available while displaying that saving failed; the handoff retains topic/review context; targeted practice uses review difficulty when history is unavailable; other-topic questions stay excluded; and the quiz retry link keeps its original mission scope. Existing scenarios continue to check wrong-answer hints, refresh resume, mastered-answer evidence, failed loading retry, sign-out and session races.

Validation: both story and adaptive-practice browser suites passed. All 373 non-emulator checks passed after the implementation change. The initial new practice scenario was placed after sign-out and therefore did not exercise loading; it was corrected to run before sign-out and passed. These are mocked local page checks, not one authenticated production multi-page walkthrough.

Teacher review, code deployment, the separately authored easy-question publication and authenticated verification remain pending. No user data or rewards were changed. Next priority: clarify Home and result-page saving/connection status so students can distinguish saved progress from guidance that could not be confirmed.
